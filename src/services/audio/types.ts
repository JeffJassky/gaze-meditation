export type AudioBusName = 'binaural' | 'music' | 'vocals' | 'fx'

export interface AudioSessionConfig {
	track: string
	volume: number
	loop?: {
		inPoint?: number
		outPoint?: number
		crossfadeDuration?: number
	}
}

export interface BinauralConfig {
	carrierFreq: number
	beatFreq: number
	volume?: number
}
