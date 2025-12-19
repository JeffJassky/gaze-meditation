import { type InstructionContext } from '../core/Instruction'
import { ReadInstruction, type ReadInstructionConfig } from './ReadInstruction'
import { faceMeshService } from '../services/faceMeshService'

export interface CloseEyesInstructionOptions extends ReadInstructionConfig {
	fallbackThresholdMs?: number
	forceCompleteMs?: number
}

export class CloseEyesInstruction extends ReadInstruction {
	private centerOpenness = 0.25
	private isInitialized = false
	private stableSince = 0
	private isDetecting = false
	private animationFrameId: number | null = null
	private startTime = 0

	private readonly STABILITY_DURATION = 500
	private readonly CLOSE_THRESHOLD = -0.04
	private readonly OPEN_THRESHOLD = -0.035
	private readonly FALLBACK_THRESHOLD_MS: number
	private readonly FORCE_COMPLETE_MS: number

	constructor(options: CloseEyesInstructionOptions) {
		// Set duration to Infinity so the ReadInstruction doesn't complete on its own
		super({ ...options, duration: Infinity, capabilities: { faceMesh: true } })
		this.FALLBACK_THRESHOLD_MS = options.fallbackThresholdMs ?? 4000
		this.FORCE_COMPLETE_MS = options.forceCompleteMs ?? 8000
	}

	async start(context: InstructionContext) {
		super.start(context)

		this.isDetecting = true // Start detecting immediately
		this.isInitialized = false
		this.centerOpenness = 0
		this.stableSince = 0
		this.startTime = Date.now()

		await faceMeshService.init()

		// Start the loop for adaptive logic immediately
		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private loop() {
		// Always run this to update baseline/centerOpenness
		const rawEAR = faceMeshService.debugData.eyeOpenness
		const now = Date.now()
		const elapsed = now - this.startTime

		// Fallback 2: Force complete after timeout
		if (elapsed > this.FORCE_COMPLETE_MS) {
			this.finish()
			return
		}

		// --- Adaptive Center Logic (Matching FractionationInstruction) ---
		if (!this.isInitialized) {
			if (rawEAR > 0) {
				this.centerOpenness = rawEAR
				this.isInitialized = true
			}
		} else {
			// We adapt the "Center" (Open Baseline) when the user's eyes SHOULD be open.
			// Since we assume the user starts with eyes open (unlike OpenEyesInstruction),
			// we can adapt more aggressively here, similar to the READY state in Fractionation.

			// If we are DETECTING, we should only adapt if the deviation suggests "Open".
			// If we are NOT detecting yet (warmup), we assume they are looking at screen (Open).
			let shouldAdapt = !this.isDetecting

			const deviation = rawEAR - this.centerOpenness
			const seemOpen = deviation > this.OPEN_THRESHOLD

			if (this.isDetecting && seemOpen) {
				shouldAdapt = true
			}

			if (shouldAdapt) {
				this.centerOpenness = this.lerp(this.centerOpenness, rawEAR, 0.05)
			}
		}

		const deviation = rawEAR - this.centerOpenness
		let isClosed = deviation < this.CLOSE_THRESHOLD

		// Fallback 1: Conservative absolute threshold check
		if (!isClosed && elapsed > this.FALLBACK_THRESHOLD_MS) {
			// 0.2 is a conservative upper bound for "closed".
			// If rawEAR is below this, they are likely closed even if adaptive logic fails.
			if (rawEAR < 0.2) {
				isClosed = true
			}
		}

		// Only check for completion if we are past the warm-up period
		if (this.isDetecting) {
			if (isClosed) {
				if (this.stableSince === 0) this.stableSince = now
				else if (now - this.stableSince >= this.STABILITY_DURATION) {
					this.finish()
					return
				}
			} else {
				this.stableSince = 0
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