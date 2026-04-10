/**
 * Shared request helper for the Gaze API.
 *
 * Every request is credentialed (session cookie rides along) and sends
 * `Content-Type: application/json` — that header doubles as implicit CSRF
 * protection: a cross-origin `<form>` cannot set it, and a cross-origin
 * `fetch` with custom headers triggers a CORS preflight that the server's
 * origin whitelist rejects. Combined with `SameSite=Lax` cookies, this
 * provides defence-in-depth without a dedicated CSRF token.
 */

export const API_BASE =
	(import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000'

/**
 * Typed error thrown by apiRequest on non-2xx responses.
 * Consumers can inspect `status` to differentiate 401 (session expired)
 * from 404 (not found) from 500 (server error), etc.
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly body?: unknown,
	) {
		super(message)
		this.name = 'ApiError'
	}
}


/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 30_000

/**
 * In-flight GET request deduplication.
 * Concurrent calls to the same path share a single fetch promise.
 */
const inflight = new Map<string, Promise<unknown>>()

export interface ApiRequestOptions extends RequestInit {
	/** Request timeout in ms. Defaults to 30 000. Set 0 to disable. */
	timeout?: number
}

export async function apiRequest<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
	const { timeout = DEFAULT_TIMEOUT_MS, ...fetchInit } = init
	const method = (fetchInit.method ?? 'GET').toUpperCase()

	// --- GET deduplication ---------------------------------------------------
	// If an identical GET is already in flight, piggy-back on its promise
	// instead of firing a second network request.
	if (method === 'GET' && !fetchInit.body) {
		const existing = inflight.get(path)
		if (existing) return existing as Promise<T>
	}

	const promise = _doFetch<T>(path, fetchInit, timeout, method)

	if (method === 'GET' && !fetchInit.body) {
		inflight.set(path, promise)
		promise.finally(() => inflight.delete(path))
	}

	return promise
}

async function _doFetch<T>(
	path: string,
	init: RequestInit,
	timeout: number,
	method: string,
): Promise<T> {
	// --- Timeout via AbortController ----------------------------------------
	let controller: AbortController | undefined
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	// Merge caller-provided signal with our timeout signal.
	const callerSignal = init.signal
	if (timeout > 0 || callerSignal) {
		controller = new AbortController()

		if (timeout > 0) {
			timeoutId = setTimeout(() => controller!.abort(new DOMException(
				`Request to ${path} timed out after ${timeout}ms`,
				'TimeoutError',
			)), timeout)
		}

		// If the caller provided their own signal, forward its abort.
		if (callerSignal) {
			if (callerSignal.aborted) {
				controller.abort(callerSignal.reason)
			} else {
				callerSignal.addEventListener('abort', () => {
					controller!.abort(callerSignal.reason)
				}, { once: true })
			}
		}
	}

	try {
		const res = await fetch(`${API_BASE}${path}`, {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...(init.headers || {}),
			},
			...init,
			signal: controller?.signal,
		})

		const text = await res.text()
		let data: unknown = null
		if (text) {
			try {
				data = JSON.parse(text)
			} catch {
				// Non-JSON response (e.g. HTML error page from a proxy).
				if (!res.ok) throw new ApiError(`http_${res.status}`, res.status)
				throw new ApiError('invalid_json_response', res.status)
			}
		}
		if (!res.ok) {
			const msg =
				(data && typeof data === 'object' && (
					(data as Record<string, unknown>).error ||
					(data as Record<string, unknown>).message
				)) || `http_${res.status}`
			throw new ApiError(String(msg), res.status, data)
		}
		return data as T
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId)
	}
}
