import { type AudioBusName } from './types'

import { MusicLooper } from './musicLooper'
import { BinauralEngine } from './binuralEngine'

export class AudioSession {
	ctx!: AudioContext

	masterGain!: GainNode
	buses!: Record<AudioBusName, GainNode>
	private bufferCache = new Map<string, AudioBuffer>()
	/**
	 * Master volume requested before the audio graph existed. Applied as
	 * soon as `setup()` creates the master gain node. This lets callers
	 * (e.g. the studio editor's live preview) mute the bus synchronously
	 * at setup time without needing to know whether the graph is ready.
	 */
	private pendingMasterVolume: number | null = null
	musicLooper: MusicLooper = new MusicLooper(this)
	binaural: BinauralEngine = new BinauralEngine(this)

	async setup() {
		if (this.ctx && this.ctx.state !== 'closed') {
			console.log('[AudioSession] Setup called, but context exists and is', this.ctx.state)
			// Fire and forget — see note below about not awaiting resume().
			if (this.ctx.state === 'suspended') {
				console.log('[AudioSession] Resuming existing suspended context...')
				this.ctx.resume().catch(() => {})
			}
			return
		}

		console.log('[AudioSession] Setting up...')
		this.ctx = new AudioContext({ latencyHint: 'playback' })

		this.masterGain = this.ctx.createGain()
		this.masterGain.gain.value = this.pendingMasterVolume ?? 1.0
		this.masterGain.connect(this.ctx.destination)
		this.pendingMasterVolume = null

		this.buses = {
			binaural: this.ctx.createGain(),
			music: this.ctx.createGain(),
			voice: this.ctx.createGain(),
			fx: this.ctx.createGain()
		}

		Object.entries(this.buses).forEach(([name, bus]) => {
			bus.gain.value = 0.25
			bus.connect(this.masterGain)
			console.log(`[AudioSession] Bus '${name}' created and connected.`)
		})

		// IMPORTANT: do not `await` resume(). Browser autoplay policy keeps
		// AudioContexts suspended until a user gesture; awaiting here would
		// hang the entire session initialization until the user clicks
		// something, which breaks embedded preview mounts. The graph is
		// fully built either way — scheduled nodes will start producing
		// sound automatically once the context resumes.
		if (this.ctx.state === 'suspended') {
			console.log('[AudioSession] Resuming suspended context (non-blocking)...')
			this.ctx.resume().catch(() => {})
		}
		console.log('[AudioSession] Setup complete. State:', this.ctx.state)
	}

	setBusVolume(bus: AudioBusName, volume: number) {
		console.log(`[AudioSession] Set Bus Volume [${bus}]: ${volume}`)
		this.buses[bus].gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
	}

	setMasterVolume(volume: number) {
		console.log(`[AudioSession] Set Master Volume: ${volume}`)
		if (!this.masterGain || !this.ctx) {
			// Graph not yet built — stash it for setup() to apply.
			this.pendingMasterVolume = volume
			return
		}
		this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
	}

	async loadBuffer(path: string): Promise<AudioBuffer> {
		if (this.bufferCache.has(path)) {
			console.log(`[AudioSession] Cache hit: ${path}`)
			return this.bufferCache.get(path)!
		}

		console.log(`[AudioSession] Loading buffer: ${path}`)
		try {
			const res = await fetch(path)
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			
			const contentType = res.headers.get('content-type')
			if (contentType && !contentType.includes('audio') && !contentType.includes('octet-stream')) {
				console.warn(`[AudioSession] Warning: loading buffer from ${path} returned Content-Type: ${contentType}`)
				// If it's HTML, it's likely a 404 fallback
				if (contentType.includes('text/html')) {
					throw new Error('Received HTML instead of Audio (Likely 404)')
				}
			}

			const buf = await res.arrayBuffer()
			const decoded = await this.ctx.decodeAudioData(buf)
			console.log(`[AudioSession] Buffer loaded: ${path} (${decoded.duration.toFixed(2)}s)`)

			this.bufferCache.set(path, decoded)
			return decoded
		} catch (e) {
			console.error(`[AudioSession] Failed to load buffer: ${path}`, e)
			throw e
		}
	}

	end() {
		this.ctx?.close()
	}
}

export const audioSession = new AudioSession()
