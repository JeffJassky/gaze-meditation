import type { ComputedRef, InjectionKey } from 'vue'
import type { SceneBlock } from '@shared/types'

export interface SceneContext {
	scenes: ComputedRef<SceneBlock[]>
	selectedIndex: ComputedRef<number>
}

export const SCENE_CONTEXT_KEY: InjectionKey<SceneContext> =
	Symbol('scene-context')
