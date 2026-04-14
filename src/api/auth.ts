/**
 * Auth + account API client.
 */
import { apiRequest } from './client'

export interface UserSettings {
	studio?: {
		/** Server never returns the raw key — only a boolean "is set" flag. */
		hasElevenlabsApiKey?: boolean
	}
	[key: string]: unknown
}

export interface AuthUser {
	id: string
	username: string
	email: string | null
	emailVerifiedAt: string | null
	pendingEmail: string | null
	settings: UserSettings
	bio: string
	avatarAssetKey: string | null
	xp: number
	level: number
	levelProgress: number
	currentStreak: number
	totalSessions: number
	totalMinutes: number
}

export const authApi = {
	me: () => apiRequest<AuthUser>('/auth/me'),
	register: (body: { username: string; password: string; email?: string }) =>
		apiRequest<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
	login: (body: { username: string; password: string }) =>
		apiRequest<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
	logout: () => apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' }),

	forgotPassword: (body: { username?: string; email?: string }) =>
		apiRequest<{ ok: true }>('/auth/password/forgot', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	resetPassword: (body: { token: string; password: string }) =>
		apiRequest<{ ok: true }>('/auth/password/reset', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	verifyEmail: (token: string) =>
		apiRequest<{ ok: true; email: string }>('/auth/verify-email', {
			method: 'POST',
			body: JSON.stringify({ token }),
		}),

	updateUsername: (username: string) =>
		apiRequest<AuthUser>('/users/me', {
			method: 'PATCH',
			body: JSON.stringify({ username }),
		}),
	updateProfile: (body: { username?: string; bio?: string; avatarAssetKey?: string | null }) =>
		apiRequest<AuthUser>('/users/me', {
			method: 'PATCH',
			body: JSON.stringify(body),
		}),
	requestEmailChange: (email: string) =>
		apiRequest<AuthUser>('/users/me/email', {
			method: 'POST',
			body: JSON.stringify({ email }),
		}),
	cancelEmailChange: () =>
		apiRequest<AuthUser>('/users/me/email/pending', { method: 'DELETE' }),
	changePassword: (body: { currentPassword: string; newPassword: string }) =>
		apiRequest<{ ok: true }>('/users/me/password', {
			method: 'POST',
			body: JSON.stringify(body),
		}),

	getSettings: () => apiRequest<Record<string, unknown>>('/users/me/settings'),
	updateSettings: (patch: Record<string, unknown>) =>
		apiRequest<Record<string, unknown>>('/users/me/settings', {
			method: 'PATCH',
			body: JSON.stringify(patch),
		}),
}
