import { apiRequest } from './api'

/**
 * Client-side wrappers for /assets routes. Mirrors the Asset model on
 * the server (see server/src/models/Asset.ts).
 *
 * The shape here intentionally matches the legacy `SessionAsset` subdoc
 * so the editor can mix embedded session assets and the shared pool in
 * the same list during the Phase-1→Phase-2 transition.
 */

export type AssetKind = 'audio' | 'image' | 'video'

export interface AssetDoc {
	id: string
	kind: AssetKind
	key: string
	label: string
	contentType: string
	size: number
	meta: Record<string, unknown>
	createdAt: string
	updatedAt: string
}

export interface AssetListResult {
	items: AssetDoc[]
	total: number
	page: number
	limit: number
	hasMore: boolean
}

export interface ListAssetsParams {
	kind?: AssetKind | AssetKind[]
	q?: string
	limit?: number
	page?: number
}

export interface RegisterAssetInput {
	kind: AssetKind
	key: string
	label?: string
	contentType?: string
	size?: number
	meta?: Record<string, unknown>
}

function qs(params: ListAssetsParams): string {
	const p = new URLSearchParams()
	if (params.kind) {
		const kinds = Array.isArray(params.kind) ? params.kind : [params.kind]
		for (const k of kinds) p.append('kind', k)
	}
	if (params.q) p.set('q', params.q)
	if (params.limit !== undefined) p.set('limit', String(params.limit))
	if (params.page !== undefined) p.set('page', String(params.page))
	const s = p.toString()
	return s ? `?${s}` : ''
}

export const assetsApi = {
	list: (params: ListAssetsParams = {}) =>
		apiRequest<AssetListResult>(`/assets${qs(params)}`),
	get: (id: string) => apiRequest<AssetDoc>(`/assets/${id}`),
	/**
	 * Fast lookup for cached voice assets by content hash. Returns null
	 * when the server responds with 404 or "not_found" so callers can
	 * fall through to generation without needing a try/catch.
	 */
	byVoiceHash: async (hash: string): Promise<AssetDoc | null> => {
		try {
			return await apiRequest<AssetDoc>(`/assets/voice/${hash}`)
		} catch (e) {
			const msg = (e as Error).message || ''
			if (msg === 'not_found' || msg === 'http_404') return null
			throw e
		}
	},
	register: (body: RegisterAssetInput) =>
		apiRequest<AssetDoc>('/assets', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	delete: (id: string) =>
		apiRequest<void>(`/assets/${id}`, { method: 'DELETE' }),
}
