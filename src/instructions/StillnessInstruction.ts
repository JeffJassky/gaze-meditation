import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import StillnessView from './views/StillnessView.vue'
import { faceMeshService } from '../services/faceMeshService'

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

	// Dynamic Centering
	private centerPitch = 0
	private centerYaw = 0
	private centerHeadX = 0
	private centerHeadY = 0
	private isInitialized = false

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
		this.isInitialized = false
		this.progress.value = 0
		this.accumulatedTime = 0
		this.drift.value = 0

		await faceMeshService.init()

		this.status.value = 'WAITING'
		this.loop()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private loop() {
		if (this.status.value === 'SUCCESS' || this.status.value === 'FAILED') return

		const currentYaw = faceMeshService.debugData.headYaw
		const currentPitch = faceMeshService.debugData.headPitch
		const currentHeadX = faceMeshService.debugData.headX
		const currentHeadY = faceMeshService.debugData.headY

		// Initialization
		if (!this.isInitialized) {
			if (currentYaw !== 0 || currentPitch !== 0) {
				this.centerYaw = currentYaw
				this.centerPitch = currentPitch
				this.centerHeadX = currentHeadX
				this.centerHeadY = currentHeadY
				this.isInitialized = true
			}
		} else {
			// Adaptive Center (Slow Moving Average)
			const alpha = 0.05
			this.centerYaw = this.lerp(this.centerYaw, currentYaw, alpha)
			this.centerPitch = this.lerp(this.centerPitch, currentPitch, alpha)
			this.centerHeadX = this.lerp(this.centerHeadX, currentHeadX, alpha)
			this.centerHeadY = this.lerp(this.centerHeadY, currentHeadY, alpha)
		}

		// Calculate drift from the *Average* Center
		const diffYaw = currentYaw - this.centerYaw
		const diffPitch = currentPitch - this.centerPitch
		const diffHeadX = currentHeadX - this.centerHeadX
		const diffHeadY = currentHeadY - this.centerHeadY

		this.driftX.value = diffYaw
		this.driftY.value = diffPitch
		this.driftXPos.value = -diffHeadX
		this.driftYPos.value = diffHeadY

		const totalDrift = Math.hypot(diffYaw, diffPitch, diffHeadX * 1.5, diffHeadY * 1.5)
		this.drift.value = totalDrift

		if (this.status.value === 'HOLDING') {
			if (totalDrift > this.tolerance) {
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
				this.progress.value = Math.min(100, (totalElapsed / this.options.duration) * 100)

				if (totalElapsed >= this.options.duration) {
					this.succeed()
					return
				}
			}
		} else if (this.status.value === 'WAITING' && this.isInitialized) {
			// Check if we can start/resume holding
			if (totalDrift < this.tolerance) {
				this.status.value = 'HOLDING'
				this.startHoldTime = Date.now()
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
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
