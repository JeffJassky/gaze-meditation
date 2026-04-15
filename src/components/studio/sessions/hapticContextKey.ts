import type { ComputedRef, InjectionKey } from 'vue'
import type { SceneBlock } from '@shared/types'

export interface HapticContext {
	scenes: ComputedRef<SceneBlock[]>
	selectedIndex: ComputedRef<number>
}

export const HAPTIC_CONTEXT_KEY: InjectionKey<HapticContext> =
	Symbol('haptic-context')
