import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import { markRaw, ref } from 'vue'
import ReadView from './views/ReadView.vue'
import { calculateDuration } from '../utils/time'
import type { ThemeConfig } from '../types'
import { playbackSpeed } from '../state/playback'

export interface ReadInstructionConfig extends InstructionOptions {
	prompt?: string
	duration?: number // Milliseconds to display text
	text?: string | string[]
	delay?: number // Milliseconds to delay before displaying text
	fadeInDuration?: number // Milliseconds
	fadeOutDuration?: number // Milliseconds
}

export class ReadInstruction extends Instruction<ReadInstructionConfig> {
	readonly component = markRaw(ReadView)

	public isFadingOut = ref(false)
	public currentText = ref('')
	public currentIndex = ref(0)
	public totalCount = ref(0)

	private activeTimer: number | null = null
	private isStopped = false
	private hasStarted = false
	private playedIndices = new Set<number>()

	constructor(config: ReadInstructionConfig) {
		super({
			...config,
			positiveReinforcement: { enabled: false, ...(config.positiveReinforcement || {}) },
			negativeReinforcement: { enabled: false, ...(config.negativeReinforcement || {}) }
		})

		const texts = Array.isArray(this.options.text) ? (this.options.text as string[]) : [this.options.text as string]
		this.totalCount.value = texts.length
		this.currentText.value = texts[0] || ''
	}

	start(context: InstructionContext): void {
		// Reset state
		this.hasStarted = true

		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.isFadingOut.value = false
		this.isStopped = false
		this.currentIndex.value = 0
		this.playedIndices.clear()

		const texts = Array.isArray(this.options.text) ? (this.options.text as string[]) : [this.options.text as string]
		const delayMs = (this.options.delay || 0) / playbackSpeed.value

		// Initial delay
		this.activeTimer = window.setTimeout(() => {
			this.showNext(0, texts)
		}, delayMs)
	}

	private async showNext(index: number, texts: string[]) {
		console.log(`[ReadInstruction] showNext index=${index} stopped=${this.isStopped}`)

		// Guard against re-entry for the same index if logic loops (though unlikely with this structure)
		if (this.playedIndices.has(index)) {
			console.warn(`[ReadInstruction] Skipping duplicate showNext for index ${index}`)
			return
		}
		this.playedIndices.add(index)

		if (this.isStopped || index >= texts.length) {
			if (!this.isStopped) this.context?.complete(true)
			return
		}

		this.currentIndex.value = index
		this.currentText.value = texts[index] || ''

		// Trigger Voice if available for this segment
		let currentVoicePromise: Promise<void> | null = null
		if (this.options.voice) {
			const voices = Array.isArray(this.options.voice)
				? this.options.voice
				: [this.options.voice]
			// If voices array matches texts array, pick specific.
			// If voice is single string, play it on first text only? Or play on all?
			// Assumption: 1-to-1 mapping if array. If single string, play once at start (index 0).

			let textToSpeak = ''
			let previousText: string | undefined
			let nextText: string | undefined

			if (Array.isArray(this.options.voice)) {
				if (index < voices.length) {
					textToSpeak = voices[index]
					// Get context from the voice array
					if (index > 0) {
						previousText = voices[index - 1]
					} else {
						// First item in array, use global context from previous instruction
						previousText = this.context?.previousVoiceText
					}
					
					if (index < voices.length - 1) nextText = voices[index + 1]
				}
			} else if (index === 0) {
				textToSpeak = this.options.voice
				// Single string, use global context
				previousText = this.context?.previousVoiceText
			}

			if (textToSpeak) {
				console.log(`[ReadInstruction] Requesting voice for: "${textToSpeak.substring(0, 20)}..."`)
				currentVoicePromise = this.playVoice(textToSpeak, { previousText, nextText })
			}

			// Preload next if available
			if (Array.isArray(this.options.voice) && index < voices.length - 1) {
				const nextVoice = voices[index + 1]
				if (nextVoice) {
					// We need to calculate context for the NEXT voice
					// nextVoice is at index + 1
					// its previousText is voices[index] (current)
					// its nextText is voices[index + 2]
					
					let nextPrev = voices[index]
					let nextNext = (index < voices.length - 2) ? voices[index + 2] : undefined

					this.preloadVoice(nextVoice, { previousText: nextPrev, nextText: nextNext })
				}
			}
		}

		const baseDuration = this.options.duration ?? calculateDuration(this.currentText.value)
		const durationMs = baseDuration === Infinity ? Infinity : baseDuration / playbackSpeed.value

		console.log(`[ReadInstruction] Waiting for duration=${durationMs}ms and voice...`)

		// Wait logic
		if (durationMs === Infinity) {
			return
		}

		const visualPromise = new Promise<void>(resolve => {
			this.activeTimer = window.setTimeout(resolve, durationMs)
		})

		// Wait for BOTH visual duration AND voice (if any)
		await Promise.all([visualPromise, currentVoicePromise])

		console.log(`[ReadInstruction] Segment ${index} complete. Moving next.`)

		if (this.isStopped) return

		// Transition
		const isLast = index === texts.length - 1
		// Add cooldown only if there is a next slide.
		// If last, complete immediately (Theater handles global cooldown).
		if (!isLast) {
			const cooldown = this.cooldown
			await new Promise<void>(resolve => {
				this.activeTimer = window.setTimeout(resolve, cooldown)
			})
		}

		if (!this.isStopped) {
			this.showNext(index + 1, texts)
		}
	}

	stop(): void {
		console.log('[ReadInstruction] Stop called')
		this.isStopped = true
		if (this.activeTimer !== null) {
			clearTimeout(this.activeTimer)
			this.activeTimer = null
		}
		// We can't cancel the promise, but we can ensure showNext returns immediately after await.
		// VoiceService.stop() will be called by Theater or next instruction, but we should probably ensure it too?
		// But Instruction.stop() doesn't know about the global voice service state per se, 
		// although we could call this.voiceService.stop() if we had access.
		// Actually Theater handles stopping previous instruction.
	}
}
