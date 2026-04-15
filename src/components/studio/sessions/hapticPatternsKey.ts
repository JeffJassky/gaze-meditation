import type { ComputedRef, InjectionKey } from 'vue'
import type { HapticPattern } from '@shared/types'

export const HAPTIC_PATTERNS_KEY: InjectionKey<ComputedRef<HapticPattern[]>> =
	Symbol('haptic-patterns')
