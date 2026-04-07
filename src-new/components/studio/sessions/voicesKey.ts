import type { InjectionKey, Ref } from 'vue'
import type { ElevenLabsVoice } from '@/services/elevenlabs'

/**
 * Shared state for the ElevenLabs voice list inside a session editor.
 * The top-level SessionEditorView fetches the voices once on mount and
 * provides this key so descendant components (session details panel,
 * scene text panel) can pick voices without prop-drilling.
 */
export interface VoicesState {
	voices: Ref<ElevenLabsVoice[]>
	loading: Ref<boolean>
	error: Ref<string | null>
	/** True when the signed-in user has an ElevenLabs key configured. */
	enabled: Ref<boolean>
}

export const VOICES_KEY: InjectionKey<VoicesState> = Symbol('elevenlabs-voices')
