import { type BinauralConfig } from './types'
import { AudioSession } from './audioSession'

export class BinauralEngine {
	private session: AudioSession
	private left?: OscillatorNode
	private right?: OscillatorNode
	private gain?: GainNode

	public isActive = false
	public currentConfig?: BinauralConfig

	constructor(session: AudioSession) {
		this.session = session
	}

	start(config: BinauralConfig) {
		console.log('[BinauralEngine] Starting...', config)
		const ctx = this.session.ctx
		const now = ctx.currentTime

		if (this.isActive) {
			console.warn('[BinauralEngine] Already active, stopping first.')
			this.stop(0)
		}

		this.isActive = true
		this.currentConfig = config

		this.gain = ctx.createGain()
		this.gain.gain.setValueAtTime(0, now)
		// Use setTargetAtTime for robust interruption. 
		// TimeConstant 2.5s ~= reach 95% in ~7.5s
		this.gain.gain.setTargetAtTime(config.volume ?? 0.4, now, 2.5)

		const merger = ctx.createChannelMerger(2)

		this.left = ctx.createOscillator()
		this.right = ctx.createOscillator()

		this.left.frequency.value = config.carrierFreq
		this.right.frequency.value = config.carrierFreq + config.beatFreq

		console.log(
			`[BinauralEngine] Osc Freqs: L=${this.left.frequency.value}, R=${this.right.frequency.value}`
		)

		this.left.connect(merger, 0, 0)
		this.right.connect(merger, 0, 1)

		merger.connect(this.gain)
		this.gain.connect(this.session.buses.binaural)

		this.left.start()
		this.right.start()
		console.log('[BinauralEngine] Started.')
	}

	setBeatFrequency(freq: number) {
		if (!this.left || !this.right) return
		console.log('[BinauralEngine] Setting beat freq:', freq)
		// Add small buffer to prevent clicks
		const now = this.session.ctx.currentTime + 0.1

		this.right.frequency.cancelScheduledValues(now)
		this.right.frequency.setTargetAtTime(this.left.frequency.value + freq, now, 0.5)
		if (this.currentConfig) {
			this.currentConfig.beatFreq = freq
		}
	}

	setVolume(volume: number) {
		if (!this.gain) return
		console.log('[BinauralEngine] Setting volume:', volume)
		// Add small buffer to prevent clicks
		const now = this.session.ctx.currentTime + 0.1
		
		this.gain.gain.cancelScheduledValues(now)
		this.gain.gain.setTargetAtTime(volume, now, 0.5)
		
		if (this.currentConfig) {
			this.currentConfig.volume = volume
		}
	}

	stop(fade = 10) {
		if (!this.isActive) return
		console.log('[BinauralEngine] Stopping (fade=' + fade + ')')
		const now = this.session.ctx.currentTime

		if (this.gain) {
			this.gain.gain.cancelScheduledValues(now)
			this.gain.gain.setValueAtTime(this.gain.gain.value, now)
			this.gain.gain.linearRampToValueAtTime(0, now + fade)
		}
		
		if (this.left) this.left.stop(now + fade)
		if (this.right) this.right.stop(now + fade)

		setTimeout(() => {
			this.left = undefined
			this.right = undefined
			this.gain = undefined
			this.isActive = false
			this.currentConfig = undefined
			console.log('[BinauralEngine] Stopped and cleaned up.')
		}, fade * 1000 + 100)
	}
}
