/**
 * Shared request helper for the Gaze API.
 * Every request is credentialed so the session cookie rides along.
 */
export const API_BASE =
	(import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000'

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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
