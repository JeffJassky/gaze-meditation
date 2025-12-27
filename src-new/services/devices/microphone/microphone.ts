import { Device } from '../device'

export class Microphone extends Device {
	private recognition: SpeechRecognition | null = null
	private _isStopping = false
	public isListening = false

	constructor() {
		super('microphone', 'Microphone')
	}

	async isAvailable(): Promise<boolean> {
		return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
	}

	async isAccessGranted(): Promise<boolean> {
		// No direct API. Assume true if available for now, or false until requested.
		return this.isAvailable()
	}

	async requestAccess(): Promise<boolean> {
		// Starting recognition triggers permission prompt
		if (!(await this.isAvailable())) return false
		// We can't really "request" without starting. 
		// We'll return true if API exists.
		return true
	}

	async start(): Promise<void> {
		this._isStopping = false
		if (this.isListening) return

		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!SpeechRecognition) {
			throw new Error('Speech API not supported')
		}

		if (!this.recognition) {
			this.recognition = new SpeechRecognition()
			this.recognition.continuous = true
			this.recognition.interimResults = true
			this.recognition.lang = 'en-US'

			this.recognition.onstart = () => {
				this.isListening = true
				this.dispatchEvent(new Event('start'))
			}

			this.recognition.onend = () => {
				this.isListening = false
				this.dispatchEvent(new Event('stop')) // Or 'end'
				
				// Auto-restart if not manually stopped
				if (!this._isStopping) {
					try {
						this.recognition?.start()
					} catch (e) {
						// ignore
					}
				}
			}

			this.recognition.onerror = (event: any) => {
				const evt = new CustomEvent('error', { detail: event.error })
				this.dispatchEvent(evt)
			}

			this.recognition.onresult = (event: SpeechRecognitionEvent) => {
				let interimTranscript = ''
				let finalTranscript = ''
				
				// Get the latest result
				const lastIdx = event.results.length - 1
				const lastResult = event.results[lastIdx]
				const text = lastResult[0].transcript
				const isFinal = lastResult.isFinal

				const evt = new CustomEvent('result', {
					detail: {
						text,
						isFinal,
						timestamp: Date.now()
					}
				})
				this.dispatchEvent(evt)
			}
		}

		try {
			this.recognition.start()
		} catch (e) {
			// already started
		}
	}

	async stop(): Promise<void> {
		this._isStopping = true
		if (this.recognition) {
			this.recognition.stop()
		}
		this.isListening = false
	}
}
