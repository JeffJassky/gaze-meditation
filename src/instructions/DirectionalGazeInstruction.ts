import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import DirectionalGazeView from './views/DirectionalGazeView.vue'
import { faceMeshService, type Point } from '../services/faceMeshService'

interface DirectionalOptions extends InstructionOptions {
	direction: 'LEFT' | 'RIGHT'
	duration?: number
	leftSrc?: string
	rightSrc?: string
	threshold?: number
	prompt?: string
}

export class DirectionalGazeInstruction extends Instruction<DirectionalOptions> {
	public currentGaze = ref<Point | null>(null)
	public isCorrect = ref(false)
	public score = ref(100)

	// Adaptive Centering
	public relativeYaw = ref(0)
	private centerYaw = 0
	private isInitialized = false

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	private isActive = false
	private startTime = 0
	private correctFrames = 0
	private totalFrames = 0

	constructor(options: DirectionalOptions) {
		super({
			duration: 0, // Default to 0 (immediate) if not specified, overriding base class default of 5000
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.isActive = true
		this.startTime = Date.now()
		this.correctFrames = 0
		this.totalFrames = 0
		this.score.value = 0
		this.isInitialized = false

		// Ensure service running
		await faceMeshService.init()

		this.loop()
	}

	stop() {
		this.isActive = false
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private async loop() {
		if (!this.isActive) return

		const currentYaw = faceMeshService.debugData.headYaw
		const pred = faceMeshService.getCurrentGaze()
		this.currentGaze.value = pred

		// Initialization
		if (!this.isInitialized) {
			if (currentYaw !== 0) {
				this.centerYaw = currentYaw
				this.isInitialized = true
			}
		}

		const relYaw = currentYaw - this.centerYaw
		this.relativeYaw.value = relYaw

		if (pred) {
			this.totalFrames++
			const correct = this.checkDirection(relYaw)
			this.isCorrect.value = correct

			if (correct) {
				this.correctFrames++
				// If no duration is set, complete immediately on success
				if (!this.options.duration || this.options.duration <= 0) {
					this.complete(true)
					return
				}
			} else {
				// Adaptive Baseline: Only drift the neutral center when NOT performing the action.
				// This allows the system to "find" the user's neutral posture (even if off-axis)
				// without "eating" the delta while they are sustained-looking.
				const alpha = 0.02
				this.centerYaw = this.lerp(this.centerYaw, currentYaw, alpha)
			}

			this.score.value = (this.correctFrames / this.totalFrames) * 100
		}

		// Check duration only if it exists
		if (this.options.duration && this.options.duration > 0) {
			if (Date.now() - this.startTime > this.options.duration) {
				this.complete(this.score.value > 50)
				return
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private checkDirection(relYaw: number): boolean {
		const thresh = this.options.threshold || 0.02
		if (this.options.direction === 'LEFT') {
			return relYaw < -thresh
		} else {
			return relYaw > thresh
		}
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	protected complete(success: boolean) {
		// Stop called by base complete()
		super.complete(success, { score: this.score.value })
	}

	get component() {
		return markRaw(DirectionalGazeView)
	}
}
