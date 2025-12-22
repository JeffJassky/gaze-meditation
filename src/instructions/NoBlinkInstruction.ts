import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import BlinkView from './views/BlinkView.vue'
import { faceMeshService } from '../services/faceMeshService'
import type { ThemeConfig } from '../types'

interface BlinkOptions extends InstructionOptions {
	duration: number
	resetProgressOnFail?: boolean
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
	private accumulatedTime = 0
	private currentOpenStart = 0

	constructor(options: BlinkOptions) {
		super({
			resetProgressOnFail: false,
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme // Store the resolved theme
		this.status.value = 'RUNNING'
		this.accumulatedTime = 0
		this.currentOpenStart = 0

		await faceMeshService.init()

		this.loop()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private loop() {
		if (this.status.value !== 'RUNNING') return

		const now = Date.now()

		this.isBlinking.value = faceMeshService.debugData.blinkDetected
		this.ear.value = faceMeshService.debugData.eyeOpenness
		this.eyeOpennessNormalized.value = faceMeshService.debugData.eyeOpennessNormalized

		if (this.isBlinking.value) {
			if (this.options.resetProgressOnFail) {
				this.fail()
				return
			} else {
				// Paused: add to accumulated if we were open
				if (this.currentOpenStart > 0) {
					this.accumulatedTime += now - this.currentOpenStart
					this.currentOpenStart = 0
				}
			}
		} else {
			// Not blinking: start segment if needed
			if (this.currentOpenStart === 0) {
				this.currentOpenStart = now
			}
		}

		// Calculate total progress
		let currentSegment = 0
		if (this.currentOpenStart > 0) {
			currentSegment = now - this.currentOpenStart
		}

		const totalTime = this.accumulatedTime + currentSegment
		this.timeLeft.value = Math.max(0, this.duration - totalTime)
		this.progress.value = Math.min(100, (totalTime / this.duration) * 100)

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
