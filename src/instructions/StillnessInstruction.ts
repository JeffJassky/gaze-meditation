import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import StillnessView from './views/StillnessView.vue'
import { faceMeshService } from '../services/faceMeshService'

interface StillnessOptions extends InstructionOptions {
	duration: number // ms to hold still
	tolerance?: number // Sensitivity (0.01 - 0.1)
	mistakeMessage?: string
}

export class StillnessInstruction extends Instruction<StillnessOptions> {
	public status = ref<'WAITING' | 'HOLDING' | 'FAILED' | 'SUCCESS'>('WAITING')
	public progress = ref(0)
	public drift = ref(0)
	public driftX = ref(0) // Yaw diff
	public driftY = ref(0) // Pitch diff
	// public resolvedTheme!: ThemeConfig; // Removed redundant declaration

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	private startHoldTime = 0

	// Dynamic Centering
	private centerPitch = 0
	private centerYaw = 0
	private isInitialized = false

	constructor(options: StillnessOptions) {
		super({
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
		this.drift.value = 0

		await faceMeshService.init()

		this.status.value = 'HOLDING'
		this.startHoldTime = Date.now()
		this.loop()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private loop() {
		if (this.status.value === 'SUCCESS' || this.status.value === 'FAILED') return

		if (this.status.value === 'HOLDING') {
			const currentYaw = faceMeshService.debugData.headYaw
			const currentPitch = faceMeshService.debugData.headPitch

			// Initialization
			if (!this.isInitialized) {
				if (currentYaw !== 0 || currentPitch !== 0) {
					this.centerYaw = currentYaw
					this.centerPitch = currentPitch
					this.isInitialized = true
				}
			} else {
				// Adaptive Center (Slow Moving Average)
				// Filters out static posture, keeps focus on "stillness" (low AC signal)
				// Use a slightly faster alpha than Nod to adapt to posture shifts,
				// but slow enough that "movement" registers as drift.
				const alpha = 0.05
				this.centerYaw = this.lerp(this.centerYaw, currentYaw, alpha)
				this.centerPitch = this.lerp(this.centerPitch, currentPitch, alpha)
			}

			// Calculate drift from the *Average* Center
			// If holding perfectly still, current ~= center, drift ~= 0.
			// If moving, current diverges from lagging center.
			const diffYaw = currentYaw - this.centerYaw
			const diffPitch = currentPitch - this.centerPitch

			this.driftX.value = diffYaw
			this.driftY.value = diffPitch

			const totalDrift = Math.hypot(diffYaw, diffPitch)
			this.drift.value = totalDrift

			if (totalDrift > this.tolerance) {
				this.fail('Moved too much')
				return
			}

			const elapsed = Date.now() - this.startHoldTime
			this.progress.value = Math.min(100, (elapsed / this.options.duration!) * 100)

			if (elapsed >= this.options.duration!) {
				this.succeed()
				return
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	private fail(reason: string) {
		this.status.value = 'FAILED'
		this.stop()
		setTimeout(() => {
			this.context?.complete(false, { reason })
		}, 1000)
	}

	private succeed() {
		this.status.value = 'SUCCESS'
		this.stop()
		this.context?.complete(true, { drift: this.drift.value })
	}

	get component() {
		return markRaw(StillnessView)
	}
}
