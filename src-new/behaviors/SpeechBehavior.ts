import { markRaw, watch } from 'vue'
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
		this.updateData({ 
			words: this.options.targetValue.split(' ').map(text => ({ text, isSpoken: false })), 
			isComplete: false 
		})
	}

	public get component() {
		return markRaw(SpeechVisualizer)
	}

	protected async onStart() {
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
		const normalizedTranscript = transcript.toLowerCase().replace(/[^\w\s]|_/g, ' ')
		const targetWords = this.options.targetValue.split(' ')
		const currentWords = (this.data.words as { text: string; isSpoken: boolean }[]) || []

		console.log(`[SpeechBehavior] Transcript: "${normalizedTranscript}"`)

		let searchIndex = 0
		let allFound = true

		for (let i = 0; i < targetWords.length; i++) {
			const word = targetWords[i]
			const cleanWord = word?.toLowerCase().replace(/[^\w\s]|_/g, '')
			const status = currentWords[i]

			if (!status) continue

			if (!cleanWord) {
				status.isSpoken = true
				continue
			}

			// Search for the word only AFTER the last found word's position
			const searchArea = normalizedTranscript.substring(searchIndex)
			const regex = new RegExp(`\\b${cleanWord}\\b`)
			const match = searchArea.match(regex)

			if (match && match.index !== undefined) {
				// Word found in the correct relative order
				status.isSpoken = true
				searchIndex += match.index + match[0].length
				console.log(`[SpeechBehavior] Match: "${cleanWord}" at rel index ${match.index}. Total searchIndex: ${searchIndex}`)
			} else {
				// If not found in current transcript, check if it was already spoken in a previous update
				if (!status.isSpoken) {
					allFound = false
					// Restore strict order: stop checking further words if this one hasn't been spoken yet.
					break 
				}
			}
		}

		this.updateData({ words: [...currentWords] })

		console.log(`[SpeechBehavior] allFound: ${allFound}, isComplete: ${this.data.isComplete}`)

		if (allFound && !this.data.isComplete) {
			console.log('[SpeechBehavior] Phrase complete - triggering success')
			this.updateData({ isComplete: true })
			// Trigger success immediately to avoid race conditions with multiple transcript updates
			this.emitSuccess({ transcript })
		}
	}
}
