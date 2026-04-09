/**
 * Resolves an asset reference to a fetchable URL.
 *
 * Session documents store asset references as plain keys (e.g.
 * `audio/music.mp3`, `img/spiral.png`) that match entries in the `assets`
 * collection. This helper prepends the configured S3 public base URL to
 * turn a key into something the browser can load.
 *
 * Passed through untouched:
 *   - Full URLs: `https://...`, `http://...`, protocol-relative `//...`
 *   - In-memory blobs: `blob:...`
 *   - Inline data: `data:...`
 *
 * Configuration:
 *   Set `VITE_S3_PUBLIC_BASE_URL` in the Vite env (e.g.
 *   `https://gaze.nyc3.digitaloceanspaces.com`). With no base configured
 *   the helper returns the key unchanged — useful as a signal in dev
 *   that the env var is missing.
 */

const S3_PUBLIC_BASE_URL: string = (
	(import.meta.env as Record<string, string | undefined>)
		.VITE_S3_PUBLIC_BASE_URL ?? ''
).replace(/\/$/, '')

export function assetUrl(input: string | null | undefined): string {
	if (!input) return ''
	if (/^(https?:|data:|blob:|\/\/)/.test(input)) return input
	if (!S3_PUBLIC_BASE_URL) return input
	// Defensive leading-slash strip — asset keys should never have one,
	// but older callers sometimes pass `/key/path` by habit.
	const key = input.replace(/^\/+/, '')
	return `${S3_PUBLIC_BASE_URL}/${key}`
}
