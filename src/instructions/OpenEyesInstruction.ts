import { type InstructionContext } from '../core/Instruction'
import { ReadInstruction, type ReadInstructionConfig } from './ReadInstruction'
import { faceMeshService } from '../services/faceMeshService'
import { audioSession } from '../services/audio/audioSession'
import { playOneShot } from '../services/audio/oneShot'

export interface OpenEyesInstructionOptions extends ReadInstructionConfig {
	repeatAfter?: number // seconds, default 5
	openEyesTrigger?: string
	fallbackThresholdMs?: number
	forceCompleteMs?: number
}

export class OpenEyesInstruction extends ReadInstruction {
	private centerOpenness = 0.25
	private isInitialized = false
	private stableSince = 0
	private isDetecting = false
	private animationFrameId: number | null = null
	private lastTriggerTime = 0
	private startTime = 0

	private readonly STABILITY_DURATION = 500
	// Standard Fractionation thresholds relative to Open Baseline
	private readonly OPEN_THRESHOLD = -0.035
	private readonly REPEAT_INTERVAL_MS: number
	private readonly TRIGGER_SOUND: string
	private readonly FALLBACK_THRESHOLD_MS: number
	private readonly FORCE_COMPLETE_MS: number

	constructor(options: OpenEyesInstructionOptions) {
		super({ ...options, duration: Infinity, capabilities: { faceMesh: true } })
		this.REPEAT_INTERVAL_MS = (options.repeatAfter ?? 5) * 1000
		this.TRIGGER_SOUND = options.openEyesTrigger ?? '/audio/fx/chimes.wav'
		this.FALLBACK_THRESHOLD_MS = options.fallbackThresholdMs ?? 4000
		this.FORCE_COMPLETE_MS = options.forceCompleteMs ?? 8000
	}

	async start(context: InstructionContext) {
		super.start(context)

		this.isDetecting = true // Start detecting immediately
		this.isInitialized = false
		this.stableSince = 0
		// Initialize so the first trigger happens immediately once detection starts
		this.lastTriggerTime = Date.now() - this.REPEAT_INTERVAL_MS
		this.startTime = Date.now()

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
		const elapsed = now - this.startTime

		// Fallback 2: Force complete after timeout
		if (elapsed > this.FORCE_COMPLETE_MS) {
			this.finish()
			return
		}

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
		let seemOpen = deviation > this.OPEN_THRESHOLD

		// Fallback 1: Conservative absolute threshold check
		if (!seemOpen && elapsed > this.FALLBACK_THRESHOLD_MS) {
			// 0.22 is a conservative lower bound for "open".
			// If rawEAR is above this, they are likely open even if adaptive logic fails.
			if (rawEAR > 0.18) {
				seemOpen = true
			}
		}

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
