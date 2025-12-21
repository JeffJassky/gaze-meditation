import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import RelaxJawView from './views/RelaxJawView.vue'
import { faceMeshService } from '../services/faceMeshService'

interface RelaxJawOptions extends InstructionOptions {
	duration?: number // ms to hold open. If 0 or undefined, instant completion on open.
	threshold?: number // Delta from baseline to consider "open". Default 0.2?
	resetProgressOnFail?: boolean // If false (default), tracking is cumulative.
}

export class RelaxJawInstruction extends Instruction<RelaxJawOptions> {
	// UI State
	public status = ref<'WAITING' | 'HOLDING' | 'SUCCESS'>('WAITING')
	public progress = ref(0)
	public currentOpenness = ref(0)
	public relativeOpenness = ref(0)
	public isJawOpen = ref(false)

	// Internal Logic
	private baselineOpenness = 0
	private isInitialized = false
	private holdStartTime = 0
	private accumulatedTime = 0 // Track time across multiple "opens" if not resetting
	private animationFrameId: number | null = null

	// Constants
	private readonly DEFAULT_THRESHOLD = 0.04 // MAR increase to count as open
	private readonly ADAPTATION_RATE = 0.05 // Rate at which baseline adapts to resting face
	private readonly ADAPTATION_THRESHOLD = 0.02 // Fixed range for what counts as "resting"

	constructor(options: RelaxJawOptions) {
		super({
			duration: 0,
			resetProgressOnFail: false,
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.status.value = 'WAITING'
		this.progress.value = 0
		this.accumulatedTime = 0
		this.isInitialized = false
		this.baselineOpenness = 0

		await faceMeshService.init()
		this.loop()
	}

	stop() {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
			this.animationFrameId = null
		}
	}

	private loop() {
		if (this.status.value === 'SUCCESS') return

		const rawOpenness = faceMeshService.debugData.mouthOpenness
		this.currentOpenness.value = rawOpenness

		// 1. Initialization
		if (!this.isInitialized) {
			if (rawOpenness > 0) {
				this.baselineOpenness = rawOpenness
				this.isInitialized = true
			}
			this.animationFrameId = requestAnimationFrame(() => this.loop())
			return
		}

		// 2. Detection
		const threshold = this.options.threshold || this.DEFAULT_THRESHOLD
		const diff = rawOpenness - this.baselineOpenness
		this.relativeOpenness.value = diff

		const isOpen = diff > threshold
		this.isJawOpen.value = isOpen

		// 3. Baseline Adaptation
		const isStable = Math.abs(diff) < this.ADAPTATION_THRESHOLD

		if (!isOpen && isStable) {
			this.baselineOpenness = this.lerp(
				this.baselineOpenness,
				rawOpenness,
				this.ADAPTATION_RATE
			)
		}

		// 4. Progress / Completion Logic
		const duration = this.options.duration || 0

		if (isOpen) {
			if (this.status.value === 'WAITING') {
				// Transition to HOLDING
				this.status.value = 'HOLDING'
				this.holdStartTime = Date.now()

				// If no duration, we are done immediately
				if (duration <= 0) {
					this.complete()
					return
				}
			} else if (this.status.value === 'HOLDING') {
				// Check timer
				const sessionElapsed = Date.now() - this.holdStartTime
				const totalElapsed = this.accumulatedTime + sessionElapsed
				this.progress.value = Math.min(100, (totalElapsed / duration) * 100)

				if (totalElapsed >= duration) {
					this.complete()
					return
				}
			}
		} else {
			// Not Open
			if (this.status.value === 'HOLDING') {
				// User closed mouth -> Store progress
				const sessionElapsed = Date.now() - this.holdStartTime
				this.accumulatedTime += sessionElapsed
				
				this.status.value = 'WAITING'
				
				if (this.options.resetProgressOnFail) {
					this.accumulatedTime = 0
					this.progress.value = 0
				}
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	protected complete() {
		this.status.value = 'SUCCESS'
		super.complete(true, {
			finalOpenness: this.currentOpenness.value,
			baseline: this.baselineOpenness
		})
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	get component() {
		return markRaw(RelaxJawView)
	}
}
