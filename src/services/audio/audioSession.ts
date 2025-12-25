import { type AudioBusName } from './types'

import { MusicLooper } from './musicLooper'
import { BinauralEngine } from './binuralEngine'

export class AudioSession {
	ctx!: AudioContext

	masterGain!: GainNode
	buses!: Record<AudioBusName, GainNode>
	private bufferCache = new Map<string, AudioBuffer>()
	musicLooper: MusicLooper = new MusicLooper(this)
	binaural: BinauralEngine = new BinauralEngine(this)

	async setup() {
		if (this.ctx && this.ctx.state !== 'closed') {
			console.log('[AudioSession] Setup called, but context exists and is', this.ctx.state)
			if (this.ctx.state === 'suspended') {
				console.log('[AudioSession] Resuming existing suspended context...')
				await this.ctx.resume()
			}
			return
		}

		console.log('[AudioSession] Setting up...')
		this.ctx = new AudioContext({ latencyHint: 'playback' })

		this.masterGain = this.ctx.createGain()
		this.masterGain.gain.value = 1.0
		this.masterGain.connect(this.ctx.destination)

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

		if (this.ctx.state === 'suspended') {
			console.log('[AudioSession] Resuming suspended context...')
			await this.ctx.resume()
		}
		console.log('[AudioSession] Setup complete. State:', this.ctx.state)
	}

	setBusVolume(bus: AudioBusName, volume: number) {
		console.log(`[AudioSession] Set Bus Volume [${bus}]: ${volume}`)
		this.buses[bus].gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
	}

	setMasterVolume(volume: number) {
		console.log(`[AudioSession] Set Master Volume: ${volume}`)
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
