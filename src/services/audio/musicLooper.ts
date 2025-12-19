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

	stop(fade = 10) {
		this.running = false
		if (this.current) {
			const ctx = this.session.ctx
			const now = ctx.currentTime
			this.current.gain.gain.cancelScheduledValues(now)
			this.current.gain.gain.setValueAtTime(this.current.gain.gain.value, now)
			this.current.gain.gain.linearRampToValueAtTime(0, now + fade)
			this.current.source.stop(now + fade)
		}
		this.current = undefined
	}

	async queue(config: AudioSessionConfig) {
		if (!this.running) return
		await this.crossfadeTo(config)
	}

	private async crossfadeTo(config: AudioSessionConfig, scheduledTime?: number) {
		const ctx = this.session.ctx
		const buffer = await this.session.loadBuffer(config.track)

		if (!this.running) return

		const now = ctx.currentTime
		// If scheduledTime is provided, use it. Otherwise start NOW (plus a tiny safety margin).
		// Ensure we don't schedule in the past.
		const startTime = scheduledTime ? Math.max(scheduledTime, now) : now
		
		const fade = config.loop?.crossfadeDuration ?? 10
		const volume = config.volume ?? 1

		const source = ctx.createBufferSource()
		const gain = ctx.createGain()

		source.buffer = buffer
		source.connect(gain)
		gain.connect(this.session.buses.music)

		// Schedule Fade In
		// Start at 0 volume at startTime
		gain.gain.setValueAtTime(0, startTime)
		// Ramp to target volume over 'fade' duration
		gain.gain.linearRampToValueAtTime(volume, startTime + fade)

		const inPoint = config.loop?.inPoint ?? 10
		source.start(startTime, inPoint)

		if (this.current) {
			const old = this.current
			
			// Schedule Fade Out for the old track
			// We assume the old track is currently at its target volume (or will be by startTime).
			// We clamp it to its current conceptual volume just to be safe, 
			// but since we are scheduling in future, we set the anchor point at startTime.
			
			// Note: If we are switching tracks manually (no scheduledTime), we want immediate fade out.
			// If we are looping (scheduledTime set), we want fade out at scheduledTime.
			
			old.gain.gain.cancelScheduledValues(startTime)
			
			// If we are starting NOW (manual change), we need to capture current value to ramp smoothly.
			// If we are scheduling for FUTURE, we assume steady state.
			if (!scheduledTime) {
				old.gain.gain.setValueAtTime(old.gain.gain.value, now)
			} else {
				// For future scheduling, we anchor at the transition point.
				// We assume it's at 'volume' from previous config. 
				// To be safe, we just ramp down from wherever it is? 
				// No, WebAudio needs a value to ramp FROM if we use linearRamp.
				// setValueAtTime(currentConfig.volume, startTime) is safe assumption for loop.
				old.gain.gain.setValueAtTime(old.config.volume ?? 1, startTime)
			}
			
			old.gain.gain.linearRampToValueAtTime(0, startTime + fade)
			old.source.stop(startTime + fade)
		}

		const instance: TrackInstance = {
			source,
			gain,
			startTime: startTime,
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
		// The next track should start when this one reaches (outPoint - fade)
		// relative to its start.
		// Actually, we want the overlap to be 'fade'.
		// So new track starts 'fade' seconds before the old one ends?
		// Logic:
		// Old ends at: startTime + (outPoint - inPoint)
		// New starts at: OldEnd - fade
		const nextAt = startTime + (outPoint - inPoint) - fade

		// Lookahead: Schedule the setup 1 second before the actual start time
		const lookahead = 1.0 
		const delay = Math.max(nextAt - this.session.ctx.currentTime - lookahead, 0) * 1000

		setTimeout(() => {
			if (!this.running) return
			if (this.current !== track) return
			this.crossfadeTo(config, nextAt)
		}, delay)
	}
}
