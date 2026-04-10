import { apiRequest } from './client'

/**
 * Client-side wrappers for /assets routes. Mirrors the Asset model on
 * the server (see server/src/models/Asset.ts). The shape matches
 * `SessionAsset` so the editor can render embedded session assets and
 * shared-pool assets in a single list.
 */

import type { AssetKind } from '@shared/constants/assets'
export type { AssetKind }
export { ASSET_KINDS, ASSET_KIND_CONFIG, isValidMimeForKind, isValidSizeForKind } from '@shared/constants/assets'

export interface AssetDoc {
	id: string
	kind: AssetKind
	key: string
	label: string
	contentType: string
	size: number
	isSystem: boolean
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
		} catch {
			return null
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
