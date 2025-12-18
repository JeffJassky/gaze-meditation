import { type AudioBusName } from './types'

import { MusicLooper } from './musicLooper'
import { BinauralEngine } from './binuralEngine'

export class AudioSession {
	ctx!: AudioContext

	masterGain!: GainNode
	buses!: Record<AudioBusName, GainNode>
	musicLooper: MusicLooper = new MusicLooper(this)
	binaural: BinauralEngine = new BinauralEngine(this)

	async setup() {
		this.ctx = new AudioContext()

		this.masterGain = this.ctx.createGain()
		this.masterGain.gain.value = 1
		this.masterGain.connect(this.ctx.destination)

		this.buses = {
			binaural: this.ctx.createGain(),
			music: this.ctx.createGain(),
			vocals: this.ctx.createGain(),
			fx: this.ctx.createGain()
		}

		Object.values(this.buses).forEach(bus => {
			bus.gain.value = 1
			bus.connect(this.masterGain)
		})

		if (this.ctx.state === 'suspended') {
			await this.ctx.resume()
		}
	}

	setBusVolume(bus: AudioBusName, volume: number) {
		this.buses[bus].gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
	}

	setMasterVolume(volume: number) {
		this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
	}

	async loadBuffer(path: string): Promise<AudioBuffer> {
		const res = await fetch(path)
		const buf = await res.arrayBuffer()
		return this.ctx.decodeAudioData(buf)
	}

	end() {
		this.ctx?.close()
	}
}

export const audioSession = new AudioSession()
