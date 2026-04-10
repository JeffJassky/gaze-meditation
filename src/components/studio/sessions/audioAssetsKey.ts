import type { ComputedRef, InjectionKey } from 'vue'
import type { SessionAsset } from '@/api/sessions'

/**
 * Injection key for the merged audio-assets list in the session editor.
 *
 * SessionEditorView computes a de-duplicated union of session-embedded
 * assets and the shared asset pool, then provides it here so any
 * descendant panel can access it without prop drilling.
 */
export const AUDIO_ASSETS_KEY: InjectionKey<ComputedRef<SessionAsset[]>> = Symbol('audio-assets')
