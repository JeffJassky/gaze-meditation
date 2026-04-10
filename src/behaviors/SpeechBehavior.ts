import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import SpeechVisualizer from '../components/scene/visualizers/SpeechVisualizer.vue'
import { SPEECH_DURATION_DEFAULT } from '@shared/constants/behavior'
import { registerBehavior } from './registry'

export interface SpeechBehaviorOptions extends BehaviorOptions {
	targetValue: string
}

export class SpeechBehavior extends Behavior<SpeechBehaviorOptions> {
	public static override readonly requiredDevices = ['microphone']

	private transcript = ''

	constructor(options: SpeechBehaviorOptions) {
		super({
			duration: SPEECH_DURATION_DEFAULT,
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
		this.transcript = ''
		this.addManagedEventListener(this.devices.microphone, 'result', this.handleResult)
	}

	protected onStop() {
		// Handled by base class
	}

	private handleResult = (e: Event) => {
		const { text } = (e as CustomEvent).detail
		this.transcript += ' ' + text
		this.handleTranscript(this.transcript.trim())
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

			const searchArea = normalizedTranscript.substring(searchIndex)
			const regex = new RegExp(`\\b${cleanWord}\\b`)
			const match = searchArea.match(regex)

			if (match && match.index !== undefined) {
				status.isSpoken = true
				searchIndex += match.index + match[0].length
			} else {
				if (!status.isSpoken) {
					allFound = false
					break
				}
			}
		}

		this.updateData({ words: [...currentWords] })

		if (allFound && !this.data.isComplete) {
			console.log('[SpeechBehavior] Phrase complete - triggering success')
			this.updateData({ isComplete: true })
			this.emitSuccess({ transcript })
		}
	}
}

registerBehavior('speech:speak', SpeechBehavior)
