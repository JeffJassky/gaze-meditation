import { textToHash } from '../utils/voiceCrypto'
import { audioSession } from '@/audio/audioSession'
import { assetsApi } from '@/api/assets'
import { assetUrl } from '../utils/assetUrl'

/** Timeout for voice generation requests (ElevenLabs can be slow). */
const VOICE_GENERATE_TIMEOUT_MS = 60_000

/**
 * Fetch wrapper for the voice generation endpoint (Vite dev middleware).
 * Uses AbortController for timeout and credentials for consistency.
 */
async function voiceFetch(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
	const controller = new AbortController()
	const timeoutId = setTimeout(
		() => controller.abort(new DOMException('Voice generation timed out', 'TimeoutError')),
		VOICE_GENERATE_TIMEOUT_MS,
	)

	// Forward caller abort to our controller.
	if (signal) {
		if (signal.aborted) {
			controller.abort(signal.reason)
		} else {
			signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
		}
	}

	try {
		return await fetch('/api/voice/generate', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal,
		})
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Resolves a voice hash to an asset key (or `null` if no such asset
 * exists). Callers use the result to load from cache; a null return
 * means the voice needs to be generated.
 */
async function resolveVoiceKey(hash: string): Promise<string | null> {
	try {
		const asset = await assetsApi.byVoiceHash(hash)
		return asset?.key ?? null
	} catch (e) {
		console.warn('[VoiceService] asset lookup failed', e)
		return null
	}
}

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
		const key = await resolveVoiceKey(hash)

		// If the voice is already in the asset collection, warm the buffer
		// cache so playVoice() can start instantly when the scene fires.
		if (key) {
			try {
				await audioSession.loadBuffer(key)
				return
			} catch (e) {
				// Fall through to regeneration if the cached asset fails to load.
			}
		}

		// Generate
		console.log('[VoiceService] Preload generating voice for:', hash)
		try {
			await voiceFetch({
				text: fullText,
				programId,
				previousText: context?.previousText,
				nextText: context?.nextText,
			})
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

			const key = await resolveVoiceKey(hash)

			// Check cancellation
			if (this.currentGenerationId !== myId) return

			if (key) {
				try {
					// Verify the asset actually exists on S3 before committing
					// to playback. A HEAD request is cheap and lets us fall
					// through to regeneration if the asset row is stale.
					const check = await fetch(assetUrl(key), { method: 'HEAD', credentials: 'include' })

					if (this.currentGenerationId !== myId) return

					const cType = check.headers.get('content-type')
					const isAudio =
						cType &&
						(cType.includes('audio') || cType.includes('octet-stream'))

					if (check.ok && isAudio) {
						this.generatingPromise = null
						await this.playAudio(key, myId)
						return
					}
				} catch (e) {
					// Fall through to generation.
				}
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
				const res = await voiceFetch({
					text: fullText,
					programId,
					previousText: context?.previousText,
					nextText: context?.nextText,
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

	/**
	 * Play a time region from a pre-loaded audio buffer (session-level voice).
	 * The buffer should already be decoded and cached by audioSession.loadBuffer.
	 */
	async playRegion(audioKey: string, startSec: number, endSec: number): Promise<void> {
		this._isSpeaking = true
		try {
			const myId = ++this.currentGenerationId
			this.stop_source()

			if (!audioSession.ctx) {
				console.warn('[VoiceService] AudioSession not initialized')
				return
			}
			if (audioSession.ctx.state === 'suspended') {
				await audioSession.ctx.resume()
			}

			let buffer: AudioBuffer
			try {
				buffer = await audioSession.loadBuffer(audioKey)
			} catch (e) {
				console.error('[VoiceService] Failed to load master audio buffer', e)
				return
			}

			if (this.currentGenerationId !== myId) return

			const duration = Math.max(0, endSec - startSec)
			if (duration <= 0) return

			return new Promise((resolve) => {
				console.log(`[VoiceService] Playing region ${startSec.toFixed(2)}–${endSec.toFixed(2)}s (ID: ${myId})`)

				const source = audioSession.ctx.createBufferSource()
				source.buffer = buffer
				source.loop = false
				source.connect(audioSession.buses.voice)

				this.currentSource = source

				source.onended = () => {
					if (this.currentSource === source) {
						this.currentSource = null
					}
					resolve()
				}

				source.start(0, startSec, duration)
			})
		} finally {
			this._isSpeaking = false
		}
	}

	private stop_source() {
		if (this.currentSource) {
			try {
				this.currentSource.stop()
				this.currentSource.disconnect()
			} catch (e) {
				// Ignore if already stopped
			}
			this.currentSource = null
		}
	}

	stop() {
		// Invalidate any in-flight generation so it won't start playback.
		this.currentGenerationId++
		this._isSpeaking = false

		if (this.currentSource) {
			console.log('[VoiceService] Stopping current source')
			try {
				this.currentSource.stop()
				this.currentSource.disconnect()
			} catch (e) {
				// Ignore if already stopped
			}
			this.currentSource = null
		}
	}
}

export const voiceService = new VoiceService()