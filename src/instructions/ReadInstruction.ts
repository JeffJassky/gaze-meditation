import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import { markRaw, ref } from 'vue'
import ReadView from './views/ReadView.vue'
import type { ThemeConfig } from '../types'

interface ReadInstructionConfig extends InstructionOptions {
	id: string
	prompt: string
	duration?: number // Milliseconds to display text
	text: string
	delay?: number // Milliseconds to delay before displaying text
	fadeInDuration?: number // Milliseconds
	fadeOutDuration?: number // Milliseconds
}

export class ReadInstruction extends Instruction<ReadInstructionConfig> {
	readonly text: string
	readonly component = markRaw(ReadView)

	// Reactive state for the view
	public isFadingOut = ref(false)

	private timer: number | null = null
	private delayTimer: number | null = null
	private fadeOutTimer: number | null = null

	constructor(config: ReadInstructionConfig) {
		super({
			...config,
			positiveReinforcement: { enabled: false, ...(config.positiveReinforcement || {}) },
			negativeReinforcement: { enabled: false, ...(config.negativeReinforcement || {}) }
		})
		this.text = config.text
	}

	start(context: InstructionContext): void {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.isFadingOut.value = false

		const delayMs = this.options.delay || 0
		const durationMs = this.options.duration || 0
		const fadeOutMs = this.options.fadeOutDuration || 0

		// 1. Wait for Delay
		this.delayTimer = window.setTimeout(() => {
			// 2. Wait for Duration (Reading time)
			if (durationMs > 0) {
				this.timer = window.setTimeout(() => {
					// 3. Handle Fade Out
					if (fadeOutMs > 0) {
						this.isFadingOut.value = true
						this.fadeOutTimer = window.setTimeout(() => {
							this.context?.complete(true)
						}, fadeOutMs)
					} else {
						// No fade out, complete immediately
						this.context?.complete(true)
					}
				}, durationMs)
			} else {
				// If no duration is set, we typically wait for manual interaction
				// But if auto-complete is expected without duration, it would go here.
				// Assuming infinite hold if duration is missing/0.
			}
		}, delayMs)
	}

	stop(): void {
		if (this.timer !== null) clearTimeout(this.timer)
		if (this.delayTimer !== null) clearTimeout(this.delayTimer)
		if (this.fadeOutTimer !== null) clearTimeout(this.fadeOutTimer)

		this.timer = null
		this.delayTimer = null
		this.fadeOutTimer = null
	}
}
