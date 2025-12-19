import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import { markRaw, ref } from 'vue'
import ReadView from './views/ReadView.vue'
import { calculateDuration } from '../utils/time'
import type { ThemeConfig } from '../types'

export interface ReadInstructionConfig extends InstructionOptions {
	prompt?: string
	duration?: number // Milliseconds to display text
	text: string | string[]
	delay?: number // Milliseconds to delay before displaying text
	fadeInDuration?: number // Milliseconds
	fadeOutDuration?: number // Milliseconds
}

export class ReadInstruction extends Instruction<ReadInstructionConfig> {
	readonly component = markRaw(ReadView)

	// Reactive state for the view
	public isFadingOut = ref(false)
	public currentText = ref('')
	public currentIndex = ref(0)
	public totalCount = ref(0)

	private activeTimer: number | null = null
	private isStopped = false

	constructor(config: ReadInstructionConfig) {
		super({
			...config,
			positiveReinforcement: { enabled: false, ...(config.positiveReinforcement || {}) },
			negativeReinforcement: { enabled: false, ...(config.negativeReinforcement || {}) }
		})

		const texts = Array.isArray(this.options.text) ? this.options.text : [this.options.text]
		this.totalCount.value = texts.length
		this.currentText.value = texts[0] || ''
	}

	start(context: InstructionContext): void {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.isFadingOut.value = false
		this.isStopped = false
		this.currentIndex.value = 0

		const texts = Array.isArray(this.options.text) ? this.options.text : [this.options.text]
		const delayMs = this.options.delay || 0

		// Initial delay
		this.activeTimer = window.setTimeout(() => {
			this.showNext(0, texts)
		}, delayMs)
	}

	private showNext(index: number, texts: string[]) {
		if (this.isStopped || index >= texts.length) {
			if (!this.isStopped) this.context?.complete(true)
			return
		}

		this.currentIndex.value = index
		this.currentText.value = texts[index] || ''
		this.isFadingOut.value = false

		const durationMs = this.options.duration ?? calculateDuration(this.currentText.value)
		const fadeOutMs = this.options.fadeOutDuration || 0

		// If duration is Infinity, we do not schedule the next step.
		// The instruction is expected to be completed externally (e.g. by subclass logic).
		if (durationMs === Infinity) {
			return
		}

		// 1. Wait for Duration (Reading time)
		this.activeTimer = window.setTimeout(() => {
			// 2. Handle Fade Out
			if (fadeOutMs > 0) {
				this.isFadingOut.value = true
				this.activeTimer = window.setTimeout(() => {
					this.showNext(index + 1, texts)
				}, fadeOutMs)
			} else {
				this.showNext(index + 1, texts)
			}
		}, durationMs)
	}

	stop(): void {
		this.isStopped = true
		if (this.activeTimer !== null) {
			clearTimeout(this.activeTimer)
			this.activeTimer = null
		}
	}
}
