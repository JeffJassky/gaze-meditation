import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import BlinkView from './views/BlinkView.vue'
import { faceMeshService } from '../services/faceMeshService'
import type { ThemeConfig } from '../types'

interface BlinkOptions extends InstructionOptions {
	duration: number
}

export class NoBlinkInstruction extends Instruction<BlinkOptions> {
	public timeLeft = ref(0)
	public progress = ref(0)
	public isBlinking = ref(false)
	public ear = ref(0) // Eye Aspect Ratio
	public eyeOpennessNormalized = ref(1.0) // Normalized 0-1 eye openness
	public status = ref<'RUNNING' | 'FAILED' | 'SUCCESS'>('RUNNING')
	// public resolvedTheme!: ThemeConfig; // Removed redundant declaration

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	private endTime = 0
	private duration = 0

	constructor(options: BlinkOptions) {
		super({
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme // Store the resolved theme
		this.status.value = 'RUNNING'

		await faceMeshService.init()

		this.duration = this.options.duration || 10000
		this.endTime = Date.now() + this.duration
		this.loop()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private loop() {
		if (this.status.value !== 'RUNNING') return

		const now = Date.now()
		this.timeLeft.value = Math.max(0, this.endTime - now)
		this.progress.value = ((this.duration - this.timeLeft.value) / this.duration) * 100

		this.isBlinking.value = faceMeshService.debugData.blinkDetected
		this.ear.value = faceMeshService.debugData.eyeOpenness
		this.eyeOpennessNormalized.value = faceMeshService.debugData.eyeOpennessNormalized

		if (this.isBlinking.value) {
			this.fail()
			return
		}

		if (this.timeLeft.value <= 0) {
			this.succeed()
			return
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private fail() {
		this.status.value = 'FAILED'
		this.complete(false, { reason: 'Blinked' })
	}

	private succeed() {
		this.status.value = 'SUCCESS'
		this.complete(true)
	}

	get component() {
		return markRaw(BlinkView)
	}
}
