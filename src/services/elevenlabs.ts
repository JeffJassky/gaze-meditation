import { apiRequest } from './api'

export interface ElevenLabsVoice {
	voice_id: string
	name: string
	category?: string
	description?: string | null
	labels?: Record<string, string> | null
	preview_url?: string | null
}

/**
 * Fetches the list of voices available on the signed-in user's ElevenLabs
 * account. The request runs on the server using the user's stored API key —
 * the raw key never reaches the browser.
 */
export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
	const res = await apiRequest<{ voices: ElevenLabsVoice[] }>(
		'/users/me/elevenlabs/voices',
	)
	return res.voices
}
