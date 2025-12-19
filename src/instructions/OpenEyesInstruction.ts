import { type InstructionContext } from '../core/Instruction'
import { ReadInstruction, type ReadInstructionConfig } from './ReadInstruction'
import { faceMeshService } from '../services/faceMeshService'
import { audioSession } from '../services/audio/audioSession'
import { playOneShot } from '../services/audio/oneShot'

export interface OpenEyesInstructionOptions extends ReadInstructionConfig {
	repeatAfter?: number // seconds, default 5
	openEyesTrigger?: string
}

export class OpenEyesInstruction extends ReadInstruction {
	private centerOpenness = 0.25
	private isInitialized = false
	private stableSince = 0
	private isDetecting = false
	private animationFrameId: number | null = null
	private lastTriggerTime = 0

	private readonly STABILITY_DURATION = 500
	// Standard Fractionation thresholds relative to Open Baseline
	private readonly OPEN_THRESHOLD = -0.035
	private readonly REPEAT_INTERVAL_MS: number
	private readonly TRIGGER_SOUND: string

	constructor(options: OpenEyesInstructionOptions) {
		super({ ...options, duration: Infinity, capabilities: { faceMesh: true } })
		this.REPEAT_INTERVAL_MS = (options.repeatAfter ?? 5) * 1000
		this.TRIGGER_SOUND = options.openEyesTrigger ?? '/audio/fx/chimes.wav'
	}

	async start(context: InstructionContext) {
		super.start(context)

		this.isDetecting = true // Start detecting immediately
		this.isInitialized = false
		this.stableSince = 0
		// Initialize so the first trigger happens immediately once detection starts
		this.lastTriggerTime = Date.now() - this.REPEAT_INTERVAL_MS

		await faceMeshService.init()

		// SEEDING: We seed with the service's calibrated "Max" (Open) value.
		this.centerOpenness = faceMeshService.getCalibration().eyeOpennessMax
		this.isInitialized = true

		// Start the loop immediately
		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private loop() {
		const rawEAR = faceMeshService.debugData.eyeOpenness
		const now = Date.now()

		// --- Adaptive Center Logic ---
		if (!this.isInitialized) {
			if (rawEAR > 0) {
				this.centerOpenness = rawEAR
				this.isInitialized = true
			}
		} else {
			// mimics Fractionation's helpful drift but with a safety rail
			// Allow adaptation towards current value (even if lower), but CLAMP it
			// so it doesn't drift all the way down to the "Closed" level.
			const closedLevel = faceMeshService.getCalibration().eyeOpennessMin
			const safetyFloor = closedLevel + 0.1 // Buffer to keep baseline above closed eyes

			// Calculate target if we were to adapt
			const target = this.lerp(this.centerOpenness, rawEAR, 0.05)

			// Only apply adaptation if the result stays above the safety floor
			// OR if we are adapting UPWARDS (eyes opening wider than expected)
			if (target >= safetyFloor || rawEAR > this.centerOpenness) {
				this.centerOpenness = Math.max(target, safetyFloor)
			}
		}

		const deviation = rawEAR - this.centerOpenness
		const seemOpen = deviation > this.OPEN_THRESHOLD

		if (this.isDetecting) {
			if (seemOpen) {
				if (this.stableSince === 0) this.stableSince = now
				else if (now - this.stableSince >= this.STABILITY_DURATION) {
					this.finish()
					return
				}
			} else {
				this.stableSince = 0

				// Audio Trigger Logic
				if (now - this.lastTriggerTime > this.REPEAT_INTERVAL_MS) {
					playOneShot(audioSession, this.TRIGGER_SOUND, 'fx')
					this.lastTriggerTime = now
				}
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}
	stop() {
		super.stop()
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
			this.animationFrameId = null
		}
		this.isDetecting = false
	}

	private finish() {
		this.stop()
		this.context?.complete(true)
	}
}
