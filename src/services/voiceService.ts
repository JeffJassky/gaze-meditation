import { textToHash } from '../utils/voiceCrypto'
import { audioSession } from './audio/audioSession'

class VoiceService {
	private currentSource: AudioBufferSourceNode | null = null
	private currentGenerationId = 0
	private generatingPromise: Promise<void> | null = null
	private _isSpeaking = false

	get isSpeaking(): boolean {
		return this._isSpeaking
	}

	async preloadVoice(text: string | string[], programId: string = 'default', context?: { previousText?: string, nextText?: string }): Promise<void> {
		const fullText = Array.isArray(text) ? text.join(' ') : text
		if (!fullText.trim()) return

		// Wait for the current generation (if any) to finish before starting preload
		// This ensures the previous segment's ID is saved on the server for continuity.
		if (this.generatingPromise) {
			try {
				// console.log('[VoiceService] Preload waiting for current generation...')
				await this.generatingPromise
			} catch (e) {
				// Ignore errors from previous generation, just proceed
			}
		}

		const hash = await textToHash(fullText)
		const filename = `${hash}.mp3`
		const relativeUrl = `/sessions/${programId}/audio/voice/${filename}`

		// Check cache first (loadBuffer handles this)
		try {
			await audioSession.loadBuffer(relativeUrl)
			// If successful, we have it.
			return
		} catch (e) {
			// Fail silently on preload check, proceed to generate
		}

		// Generate
		console.log('[VoiceService] Preload generating voice for:', hash)
		try {
			const res = await fetch('/api/voice/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					text: fullText, 
					programId,
					previousText: context?.previousText,
					nextText: context?.nextText
				})
			})
			
			if (res.ok) {
				// We can optionally load it into buffer cache now
				const blob = await res.blob()
				// const blobUrl = URL.createObjectURL(blob)
			}

		} catch (e) {
			console.warn('[VoiceService] Preload generation failed', e)
		}
	}

	async playVoice(text: string | string[], programId: string = 'default', context?: { previousText?: string, nextText?: string }): Promise<void> {
		this._isSpeaking = true
		try {
			const fullText = Array.isArray(text) ? text.join(' ') : text
			if (!fullText.trim()) return

			// Increment ID to invalidate any previous pending operations
			const myId = ++this.currentGenerationId
			
			// Stop any currently playing voice
			this.stop()

			const hash = await textToHash(fullText)
			
			// Check cancellation
			if (this.currentGenerationId !== myId) return

			const filename = `${hash}.mp3`
			const relativeUrl = `/sessions/${programId}/audio/voice/${filename}`

			try {
				// Check if file exists via HEAD
				const check = await fetch(relativeUrl, { method: 'HEAD' })
				
				// Check cancellation
				if (this.currentGenerationId !== myId) return

				const cType = check.headers.get('content-type')
				const isAudio = cType && (cType.includes('audio') || cType.includes('octet-stream'))

				if (check.ok && isAudio) {
					this.generatingPromise = null
					await this.playAudio(relativeUrl, myId)
					return
				}
			} catch (e) {
				// Proceed to generation
			}

			// Generate if not found
			console.log('[VoiceService] Generating voice for:', hash)
			
			// Create a promise for this generation task
			let resolveGen: () => void
			let rejectGen: (err: any) => void
			this.generatingPromise = new Promise<void>((resolve, reject) => {
				resolveGen = resolve
				rejectGen = reject
			})

			try {
				const res = await fetch('/api/voice/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						text: fullText, 
						programId,
						previousText: context?.previousText,
						nextText: context?.nextText
					})
				})

				// Check cancellation
				if (this.currentGenerationId !== myId) {
					resolveGen!()
					return
				}

				if (!res.ok) {
					const err = await res.text()
					console.error('[VoiceService] Generation failed:', err)
					rejectGen!(new Error(err))
					return
				}

				const blob = await res.blob()
				const blobUrl = URL.createObjectURL(blob)
				
				// Generation complete
				resolveGen!()
				
				await this.playAudio(blobUrl, myId)
			} catch (e) {
				console.error('[VoiceService] Error:', e)
				if (rejectGen!) rejectGen!(e)
			}
		} finally {
			this._isSpeaking = false
		}
	}

	private async playAudio(url: string, generationId: number): Promise<void> {
		// Ensure audio session is ready (it should be)
		if (!audioSession.ctx) {
			console.warn('[VoiceService] AudioSession not initialized')
			return
		}
		if (audioSession.ctx.state === 'suspended') {
			await audioSession.ctx.resume()
		}

		// Load buffer
		let buffer: AudioBuffer
		try {
			buffer = await audioSession.loadBuffer(url)
		} catch (e) {
			console.error('[VoiceService] Failed to load buffer', e)
			return
		}

		if (this.currentGenerationId !== generationId) return

		return new Promise((resolve) => {
			console.log(`[VoiceService] Starting playback (ID: ${generationId}):`, url)
			
			const source = audioSession.ctx.createBufferSource()
			source.buffer = buffer
			source.loop = false // Explicitly ensure no looping
			source.connect(audioSession.buses.voice)
			
			this.currentSource = source
			
			// Attach a cleanup/resolve function to the source so stop() can call it
			// We cast to any to attach custom property, or we map it externally.
			// Simpler: just use the onended callback which stop() triggers.
			
			source.onended = () => {
				console.log(`[VoiceService] Playback ended/stopped (ID: ${generationId})`)
				// If we are still the current source, clear it.
				// If we were stopped by playVoice(), this.currentSource might already be null or new.
				if (this.currentSource === source) {
					this.currentSource = null
				}
				resolve()
			}

			source.start(0)
		})
	}

	stop() {
		if (this.currentSource) {
			console.log('[VoiceService] Stopping current source')
			try {
				this.currentSource.stop()
				this.currentSource.disconnect()
			} catch (e) {
				// Ignore if already stopped
			}
			// We do NOT set currentSource to null here immediately.
			// We let source.stop() trigger onended, which handles the cleanup and resolution.
			// This ensures the Promise returned by playAudio resolves naturally.
			this.currentSource = null
		}
	}
}

export const voiceService = new VoiceService()