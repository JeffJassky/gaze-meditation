import { apiRequest } from './api'

// --- Types (mirror server/src/models/Session.ts) -----------------------------

export type SessionStatus = 'draft' | 'published'
export type SessionVisibility = 'private' | 'public'
export type SessionAudience =
	| 'f4a'
	| 'm4a'
	| 'm4f'
	| 'm4m'
	| 'f4f'
	| 'f4m'
	| 't4a'
	| 't4f'
	| 't4m'
	| 't4t'
	| 'unspecified'

export interface SessionAsset {
	id: string
	kind: 'audio' | 'image' | 'video'
	key: string
	label?: string
	contentType?: string
	size?: number
	meta?: Record<string, unknown>
}

export interface SceneBlock {
	id: string
	type: string
	label?: string
	config: Record<string, unknown>
}

export interface SessionDoc {
	id: string
	owner: string
	slug: string
	title: string
	description: string
	status: SessionStatus
	visibility: SessionVisibility
	publishedAt: string | null
	audience: SessionAudience
	tags: string[]
	isAdult: boolean
	theme: Record<string, unknown>
	coverAssetId: string | null
	audio: Record<string, unknown>
	/** Default ElevenLabs voice id for the session's spoken text. */
	elevenlabsVoiceId: string | null
	assets: SessionAsset[]
	scenes: SceneBlock[]
	settings: Record<string, unknown>
	createdAt: string
	updatedAt: string
}

export interface SessionListResult {
	items: SessionDoc[]
	page: number
	limit: number
	total: number
	hasMore: boolean
}

// --- Client ------------------------------------------------------------------

export interface ListSessionsParams {
	mine?: boolean
	owner?: string
	audience?: string
	tag?: string
	q?: string
	status?: SessionStatus
	limit?: number
	page?: number
}

function qs(params: Record<string, unknown>): string {
	const p = new URLSearchParams()
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue
		p.set(k, v === true ? '1' : String(v))
	}
	const s = p.toString()
	return s ? `?${s}` : ''
}

export const sessionsApi = {
	list: (params: ListSessionsParams = {}) =>
		apiRequest<SessionListResult>(`/sessions${qs(params as Record<string, unknown>)}`),
	get: (id: string) => apiRequest<SessionDoc>(`/sessions/${id}`),
	create: (body: Partial<SessionDoc>) =>
		apiRequest<SessionDoc>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: Partial<SessionDoc>) =>
		apiRequest<SessionDoc>(`/sessions/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),
	delete: (id: string) =>
		apiRequest<{ ok: true }>(`/sessions/${id}`, { method: 'DELETE' }),
	publish: (id: string) =>
		apiRequest<SessionDoc>(`/sessions/${id}/publish`, { method: 'POST' }),
	unpublish: (id: string) =>
		apiRequest<SessionDoc>(`/sessions/${id}/unpublish`, { method: 'POST' }),
}
