import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import StillnessView from './views/StillnessView.vue'
import { faceMeshService } from '../services/faceMeshService'
import { postureAnalyzer } from '../services/analysis/postureAnalyzer'

interface StillnessOptions extends InstructionOptions {
	duration: number // ms to hold still
	tolerance?: number // Sensitivity (0.01 - 0.1)
	mistakeMessage?: string
	resetProgressOnFail?: boolean // If false (default), tracking is cumulative.
}

export class StillnessInstruction extends Instruction<StillnessOptions> {
	public status = ref<'WAITING' | 'HOLDING' | 'FAILED' | 'SUCCESS'>('WAITING')
	public progress = ref(0)
	public drift = ref(0)
	public driftX = ref(0) // Yaw diff
	public driftY = ref(0) // Pitch diff
	public driftXPos = ref(0) // X Position diff
	public driftYPos = ref(0) // Y Position diff

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	private startHoldTime = 0
	private accumulatedTime = 0 // Track time across multiple "holds" if not resetting

	constructor(options: StillnessOptions) {
		super({
			resetProgressOnFail: false,
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	// Tolerance for movement
	public get tolerance() {
		return this.options.tolerance || 0.02
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.progress.value = 0
		this.accumulatedTime = 0
		this.drift.value = 0

		await faceMeshService.init()
		
		// Initialize Analyzer
		postureAnalyzer.start()
		// We want to lock the current posture as the target
		// Wait a frame to ensure we have fresh data? faceMesh init waits for video.
		// Let's capture immediately if ready, loop will handle rest.
		if (faceMeshService.debugData.faceScale > 0) {
			postureAnalyzer.captureCenter()
		}

		this.status.value = 'WAITING'
		this.loop()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
		// We do NOT stop the analyzer here, as it might be needed for session tracking.
	}

	private loop() {
		if (this.status.value === 'SUCCESS' || this.status.value === 'FAILED') return

		// Sync with Analyzer
		this.drift.value = postureAnalyzer.drift.value
		this.driftX.value = postureAnalyzer.driftX.value
		this.driftY.value = postureAnalyzer.driftY.value
		this.driftXPos.value = postureAnalyzer.driftXPos.value
		this.driftYPos.value = postureAnalyzer.driftYPos.value
		
		// If analyzer is still calibrating (e.g. no face yet), just wait
		if (postureAnalyzer.state.value === 'CALIBRATING') {
			// Try to capture if we have a face now
			if (faceMeshService.debugData.faceScale > 0) {
				postureAnalyzer.captureCenter()
			}
			this.animationFrameId = requestAnimationFrame(() => this.loop())
			return
		}

		if (this.status.value === 'HOLDING') {
			if (this.drift.value > this.tolerance) {
				if (this.options.resetProgressOnFail) {
					this.fail('Moved too much')
					return
				} else {
					// Cumulative mode: pause and switch to WAITING
					this.accumulatedTime += Date.now() - this.startHoldTime
					this.status.value = 'WAITING'
				}
			} else {
				// Still holding
				const sessionElapsed = Date.now() - this.startHoldTime
				const totalElapsed = this.accumulatedTime + sessionElapsed
				this.progress.value = Math.min(100, (totalElapsed / this.duration) * 100)

				if (totalElapsed >= this.duration) {
					this.succeed()
					return
				}
			}
		} else if (this.status.value === 'WAITING') {
			// Check if we can start/resume holding
			if (this.drift.value < this.tolerance) {
				this.status.value = 'HOLDING'
				this.startHoldTime = Date.now()
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private fail(reason: string) {
		this.status.value = 'FAILED'
		this.complete(false, { reason })
	}

	private succeed() {
		this.status.value = 'SUCCESS'
		this.complete(true, { drift: this.drift.value })
	}

	get component() {
		return markRaw(StillnessView)
	}
}
