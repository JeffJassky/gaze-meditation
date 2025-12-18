import { type BinauralConfig } from './types'
import { AudioSession } from './audioSession'

export class BinauralEngine {
	private session: AudioSession
	private left?: OscillatorNode
	private right?: OscillatorNode
	private gain?: GainNode

	constructor(session: AudioSession) {
		this.session = session
	}

	start(config: BinauralConfig) {
		const ctx = this.session.ctx
		const now = ctx.currentTime

		this.gain = ctx.createGain()
		this.gain.gain.setValueAtTime(0, now)
		this.gain.gain.linearRampToValueAtTime(config.volume ?? 0.4, now + 2)

		const merger = ctx.createChannelMerger(2)

		this.left = ctx.createOscillator()
		this.right = ctx.createOscillator()

		this.left.frequency.value = config.carrierFreq
		this.right.frequency.value = config.carrierFreq + config.beatFreq

		this.left.connect(merger, 0, 0)
		this.right.connect(merger, 0, 1)

		merger.connect(this.gain)
		this.gain.connect(this.session.buses.binaural)

		this.left.start()
		this.right.start()
	}

	setBeatFrequency(freq: number) {
		if (!this.left || !this.right) return
		const now = this.session.ctx.currentTime

		this.right.frequency.setTargetAtTime(this.left.frequency.value + freq, now, 0.5)
	}

	stop(fade = 2) {
		if (!this.left || !this.right || !this.gain) return
		const now = this.session.ctx.currentTime

		this.gain.gain.linearRampToValueAtTime(0, now + fade)
		this.left.stop(now + fade)
		this.right.stop(now + fade)

		this.left = undefined
		this.right = undefined
		this.gain = undefined
	}
}
