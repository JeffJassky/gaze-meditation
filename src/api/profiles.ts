import { apiRequest } from './client'

export interface PublicProfileUser {
	id: string
	username: string
	bio: string
	avatarAssetKey: string | null
	xp: number
	level: number
	levelProgress: number
	currentStreak: number
	totalSessions: number
	totalMinutes: number
	memberSince: string
}

export interface PublicPlaylistSummary {
	id: string
	title: string
	slug: string
	description: string
	visibility: string
	coverImageKey: string | null
	sessions: string[]
	createdAt: string
	updatedAt: string
}

export interface PublicProfile {
	user: PublicProfileUser
	playlists: PublicPlaylistSummary[]
}

export interface UserStats {
	xp: number
	level: number
	levelProgress: number
	currentStreak: number
	totalSessions: number
	totalMinutes: number
}

export interface LeaderboardEntry {
	rank: number
	username: string
	totalMinutes: number
	level: number
	avatarAssetKey: string | null
}

export interface LeaderboardResult {
	items: LeaderboardEntry[]
	page: number
	limit: number
	total: number
	hasMore: boolean
}

export const profilesApi = {
	getProfile: (username: string) =>
		apiRequest<PublicProfile>(`/users/${encodeURIComponent(username)}/profile`),
	getMyStats: () => apiRequest<UserStats>('/users/me/stats'),
	leaderboard: (page = 1) =>
		apiRequest<LeaderboardResult>(`/users/leaderboard?page=${page}`),
}
