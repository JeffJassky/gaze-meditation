import { apiRequest } from './api'
import type {
	Session,
	SessionListResult,
	SessionStatus,
} from '@shared/types'

// Re-export types so existing `import type { X } from '@/services/sessions'` works.
export type {
	Session,
	SessionStatus,
	SessionListResult,
	SceneBlock,
	SessionAsset,
	SessionAudio,
	SessionSettings,
	SessionVisibility,
	SessionAudience,
	AssetKind,
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
	get: (id: string) => apiRequest<Session>(`/sessions/${id}`),
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
