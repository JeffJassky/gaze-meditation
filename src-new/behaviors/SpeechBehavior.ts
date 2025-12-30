import { ref, type Ref, markRaw, watch } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { speechService } from '@/services/speechService'
import SpeechVisualizer from '../components/scene/visualizers/SpeechVisualizer.vue'

export interface SpeechBehaviorOptions extends BehaviorOptions {
	targetValue: string
}

export class SpeechBehavior extends Behavior<SpeechBehaviorOptions> {
	public static override readonly requiredDevices = ['microphone']

	constructor(options: SpeechBehaviorOptions) {
		super({
			// Speech usually relies on matching, so maybe infinite duration until match or timeout
			duration: 10000, 
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return markRaw(SpeechVisualizer)
	}

	private initWords() {
		return this.options.targetValue.split(' ').map(text => ({ text, isSpoken: false }))
	}

	protected async onStart() {
		const words = this.initWords()
		this.updateData({ words, isComplete: false })

		await speechService.init()
		speechService.resetTranscript()
		
		if (!speechService.isListening.value) {
			speechService.start()
		}

		this.addManagedEventListener(
			watch(speechService.transcript, (newVal) => {
				this.handleTranscript(newVal)
			})
		)
	}

	protected onStop() {
		// Handled by base class
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

		this.updateData({ words: newWords })

		if (allFound) {
			this.updateData({ isComplete: true })
			setTimeout(() => {
				this.emitSuccess({ transcript })
			}, 500)
		}
	}
}
