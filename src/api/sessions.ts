import { apiRequest } from './client'
import { qs } from '@/utils/queryString'
import type {
	Session,
	SessionListResult,
	SessionStatus,
} from '@shared/types'

// Re-export types so existing `import type { X } from '@/api/sessions'` works.
export type {
	Session,
	SessionStatus,
	SessionListResult,
	SceneBlock,
	SceneRegion,
	SessionAsset,
	SessionAudio,
	SessionSettings,
	SessionVisibility,
	SessionAudience,
	AssetKind,
	MasterAudio,
	VoiceOrigin,
	VoiceStructure,
} from '@shared/types'

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


export const sessionsApi = {
	list: (params: ListSessionsParams = {}) =>
		apiRequest<SessionListResult>(`/sessions${qs(params as Record<string, unknown>)}`),
	get: (idOrSlug: string) => apiRequest<Session>(`/sessions/${idOrSlug}`),
	create: (body: Partial<Session>) =>
		apiRequest<Session>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: Partial<Session>) =>
		apiRequest<Session>(`/sessions/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),
	delete: (id: string) =>
		apiRequest<{ ok: true }>(`/sessions/${id}`, { method: 'DELETE' }),
	publish: (id: string) =>
		apiRequest<Session>(`/sessions/${id}/publish`, { method: 'POST' }),
	unpublish: (id: string) =>
		apiRequest<Session>(`/sessions/${id}/unpublish`, { method: 'POST' }),
}
