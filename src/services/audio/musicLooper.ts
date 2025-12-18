import { type AudioSessionConfig } from './types'
import { AudioSession } from './audioSession'

type TrackInstance = {
	source: AudioBufferSourceNode
	gain: GainNode
	startTime: number
	buffer: AudioBuffer
	config: AudioSessionConfig
}

export class MusicLooper {
	private session: AudioSession
	private current?: TrackInstance
	private running = false

	constructor(session: AudioSession) {
		this.session = session
	}

	async start(config: AudioSessionConfig) {
		this.running = true
		await this.crossfadeTo(config)
	}

	stop() {
		this.running = false
		this.current?.source.stop()
		this.current = undefined
	}

	async queue(config: AudioSessionConfig) {
		if (!this.running) return
		await this.crossfadeTo(config)
	}

	private async crossfadeTo(config: AudioSessionConfig) {
		const ctx = this.session.ctx
		const buffer = await this.session.loadBuffer(config.track)

		const now = ctx.currentTime
		const fade = config.loop?.crossfadeDuration ?? 10
		const volume = config.volume ?? 1

		const source = ctx.createBufferSource()
		const gain = ctx.createGain()

		source.buffer = buffer
		source.connect(gain)
		gain.connect(this.session.buses.music)

		gain.gain.setValueAtTime(0, now)
		gain.gain.linearRampToValueAtTime(volume, now + fade)

		const inPoint = config.loop?.inPoint ?? 10
		source.start(now, inPoint)

		if (this.current) {
			const old = this.current
			old.gain.gain.cancelScheduledValues(now)
			old.gain.gain.setValueAtTime(old.gain.gain.value, now)
			old.gain.gain.linearRampToValueAtTime(0, now + fade)
			old.source.stop(now + fade)
		}

		const instance: TrackInstance = {
			source,
			gain,
			startTime: now,
			buffer,
			config
		}

		this.current = instance
		this.scheduleLoop(instance)
	}

	private scheduleLoop(track: TrackInstance) {
		const { buffer, config, startTime } = track
		const fade = config.loop?.crossfadeDuration ?? 10

		const inPoint = config.loop?.inPoint ?? 10
		const outPoint = config.loop?.outPoint ?? buffer.duration - 10

		const duration = outPoint - inPoint
		const nextAt = startTime + duration - fade

		const delay = Math.max(nextAt - this.session.ctx.currentTime, 0) * 1000

		setTimeout(() => {
			if (!this.running) return
			if (this.current !== track) return
			this.crossfadeTo(config)
		}, delay)
	}
}
