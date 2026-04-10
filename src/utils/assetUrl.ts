/**
 * Resolves an asset reference to a fetchable URL.
 *
 * S3 asset keys (starting with `u/`) are served through the authenticated
 * API proxy at `/assets/file/<key>`. This keeps S3 objects private.
 *
 * Local static assets (e.g. `img/spiral.png`) are served directly by Vite
 * from the `public/` directory — no auth needed.
 *
 * Passed through untouched:
 *   - Full URLs: `https://...`, `http://...`, protocol-relative `//...`
 *   - In-memory blobs: `blob:...`
 *   - Inline data: `data:...`
 */

export function assetUrl(input: string | null | undefined): string {
	if (!input) return ''
	if (/^(https?:|data:|blob:|\/\/)/.test(input)) return input

	const key = input.replace(/^\/+/, '')

	// Only S3-uploaded assets (keyed under u/<userId>/...) go through the
	// authenticated proxy. In dev, Vite proxies /assets/file/* to the API
	// server so cookies flow same-origin. In prod, API_BASE is same-origin.
	if (key.startsWith('u/')) {
		return `/assets/file/${key}`
	}

	// Local static asset — serve directly (Vite serves from public/).
	return `/${key}`
}
