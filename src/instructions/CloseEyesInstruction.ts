import { type InstructionContext } from '../core/Instruction'
import { ReadInstruction, type ReadInstructionConfig } from './ReadInstruction'
import { faceMeshService } from '../services/faceMeshService'

export interface CloseEyesInstructionOptions extends ReadInstructionConfig {
	// No specific options added yet, but interface allows for future expansion
}

export class CloseEyesInstruction extends ReadInstruction {
	private centerOpenness = 0.25
	private isInitialized = false
	private stableSince = 0
	private isDetecting = false
	private animationFrameId: number | null = null

	private readonly STABILITY_DURATION = 500
	private readonly CLOSE_THRESHOLD = -0.04
	private readonly OPEN_THRESHOLD = -0.035

	constructor(options: CloseEyesInstructionOptions) {
		// Set duration to Infinity so the ReadInstruction doesn't complete on its own
		super({ ...options, duration: Infinity, capabilities: { faceMesh: true } })
	}

	async start(context: InstructionContext) {
		super.start(context)

		this.isDetecting = true // Start detecting immediately
		this.isInitialized = false
		this.centerOpenness = 0
		this.stableSince = 0

		await faceMeshService.init()

		// Start the loop for adaptive logic immediately
		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private loop() {
		// Always run this to update baseline/centerOpenness
		const rawEAR = faceMeshService.debugData.eyeOpenness
		const now = Date.now()

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
		const isClosed = deviation < this.CLOSE_THRESHOLD

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
