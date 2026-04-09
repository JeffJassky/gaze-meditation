import type { Session } from './session.js'

export type PlaylistVisibility = 'private' | 'public'

export interface PlaylistDoc {
	id: string
	owner: string
	slug: string
	title: string
	description: string
	visibility: PlaylistVisibility
	coverImageKey: string | null
	sessions: string[]
	sessionDocs?: Session[]
	createdAt: string
	updatedAt: string
}

export interface PlaylistListResult {
	items: PlaylistDoc[]
	page: number
	limit: number
	total: number
	hasMore: boolean
}
