/**
 * Auth + account API client.
 * Calls the Gaze server with credentialed fetches so the session cookie flows.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000'

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
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(init.headers || {}),
		},
		...init,
	})
	const text = await res.text()
	const data = text ? JSON.parse(text) : null
	if (!res.ok) {
		const msg = (data && (data.error || data.message)) || `http_${res.status}`
		throw new Error(msg)
	}
	return data as T
}

export const authApi = {
	me: () => request<AuthUser>('/auth/me'),
	register: (body: { username: string; password: string; email?: string }) =>
		request<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
	login: (body: { username: string; password: string }) =>
		request<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
	logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

	forgotPassword: (body: { username?: string; email?: string }) =>
		request<{ ok: true }>('/auth/password/forgot', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	resetPassword: (body: { token: string; password: string }) =>
		request<{ ok: true }>('/auth/password/reset', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	verifyEmail: (token: string) =>
		request<{ ok: true; email: string }>('/auth/verify-email', {
			method: 'POST',
			body: JSON.stringify({ token }),
		}),

	updateUsername: (username: string) =>
		request<AuthUser>('/users/me', {
			method: 'PATCH',
			body: JSON.stringify({ username }),
		}),
	requestEmailChange: (email: string) =>
		request<AuthUser>('/users/me/email', {
			method: 'POST',
			body: JSON.stringify({ email }),
		}),
	cancelEmailChange: () =>
		request<AuthUser>('/users/me/email/pending', { method: 'DELETE' }),
	changePassword: (body: { currentPassword: string; newPassword: string }) =>
		request<{ ok: true }>('/users/me/password', {
			method: 'POST',
			body: JSON.stringify(body),
		}),

	getSettings: () => request<Record<string, unknown>>('/users/me/settings'),
	updateSettings: (patch: Record<string, unknown>) =>
		request<Record<string, unknown>>('/users/me/settings', {
			method: 'PATCH',
			body: JSON.stringify(patch),
		}),
}
