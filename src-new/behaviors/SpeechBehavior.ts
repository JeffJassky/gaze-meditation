import { ref, type Ref, markRaw, watch } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { speechService } from '@/services/speechService'
import SpeechVisualizer from '../components/scene/visualizers/SpeechVisualizer.vue'

export interface SpeechBehaviorOptions extends BehaviorOptions {
	targetValue: string
}

export class SpeechBehavior extends Behavior<SpeechBehaviorOptions> {
	public words: Ref<{ text: string; isSpoken: boolean }[]> = ref([])
	public isComplete: Ref<boolean> = ref(false)

	private unwatch: (() => void) | null = null

	constructor(options: SpeechBehaviorOptions) {
		super({
			// Speech usually relies on matching, so maybe infinite duration until match or timeout
			duration: 10000, 
			failOnTimeout: true,
			...options
		})
		this.initWords()
	}

	public get component() {
		return markRaw(SpeechVisualizer)
	}

	public getVisualizerProps() {
		return {
			words: this.words.value,
			isComplete: this.isComplete.value
		}
	}

	private initWords() {
		this.words.value = this.options.targetValue.split(' ').map(text => ({ text, isSpoken: false }))
	}

	protected async onStart() {
		this.isComplete.value = false
		this.initWords()

		await speechService.init()
		speechService.resetTranscript()
		
		if (!speechService.isListening.value) {
			speechService.start()
		}

		this.unwatch = watch(speechService.transcript, (newVal) => {
			this.handleTranscript(newVal)
		})
	}

	protected onStop() {
		if (this.unwatch) {
			this.unwatch()
			this.unwatch = null
		}
		// We don't stop speech service globally here
	}

	private handleTranscript(transcript: string) {
		const normalizedTranscript = transcript.toLowerCase()
		const targetWords = this.options.targetValue.split(' ')

		let searchIndex = 0
		let allFound = true
		
		const newWords = targetWords.map(word => {
			const cleanWord = word.toLowerCase().replace(/[^\w\s]|_/g, '')
			if (!cleanWord) return { text: word, isSpoken: true }

			const foundIndex = normalizedTranscript.indexOf(cleanWord, searchIndex)
			if (foundIndex !== -1) {
				searchIndex = foundIndex + cleanWord.length
				return { text: word, isSpoken: true }
			} else {
				allFound = false
				return { text: word, isSpoken: false }
			}
		})

		this.words.value = newWords

		if (allFound && !this.isComplete.value) {
			this.isComplete.value = true
			setTimeout(() => {
				this.emitSuccess({ transcript })
			}, 500)
		}
	}
}
