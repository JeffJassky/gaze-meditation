import { apiRequest } from './client'
import { qs } from '@/utils/queryString'
import type { PlaylistDoc, PlaylistListResult } from '@shared/types'

// Re-export types so existing imports work.
export type { PlaylistDoc, PlaylistListResult, PlaylistVisibility } from '@shared/types'

export interface ListPlaylistsParams {
	mine?: boolean
	owner?: string
	limit?: number
	page?: number
}


export const playlistsApi = {
	list: (params: ListPlaylistsParams = {}) =>
		apiRequest<PlaylistListResult>(`/playlists${qs(params as Record<string, unknown>)}`),
	get: (id: string, populate = false) =>
		apiRequest<PlaylistDoc>(`/playlists/${id}${populate ? '?populate=1' : ''}`),
	create: (body: Partial<PlaylistDoc>) =>
		apiRequest<PlaylistDoc>('/playlists', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: Partial<PlaylistDoc>) =>
		apiRequest<PlaylistDoc>(`/playlists/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),
	delete: (id: string) =>
		apiRequest<{ ok: true }>(`/playlists/${id}`, { method: 'DELETE' }),
	addSession: (id: string, sessionId: string, position?: number) =>
		apiRequest<PlaylistDoc>(`/playlists/${id}/sessions`, {
			method: 'POST',
			body: JSON.stringify({ sessionId, position }),
		}),
	removeSession: (id: string, sessionId: string) =>
		apiRequest<PlaylistDoc>(`/playlists/${id}/sessions/${sessionId}`, {
			method: 'DELETE',
		}),
}
