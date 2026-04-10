import type { ComputedRef, InjectionKey } from 'vue'
import type { SoundboardSample } from '@shared/types'

export const SOUNDBOARD_SAMPLES_KEY: InjectionKey<ComputedRef<SoundboardSample[]>> =
	Symbol('soundboard-samples')
