/**
 * Rewrites a legacy absolute-rooted asset path (e.g. `/audio/music.mp3`,
 * `/img/spiral.png`, `/sessions/prog_council_fire/audio/fx/drums.mp3`) to
 * point at the configured S3 public base URL. Everything else — full URLs,
 * relative paths, data URIs, blob URLs — is passed through untouched.
 *
 * Legacy session programs and imported SessionDocs store asset references
 * as absolute-rooted paths from the time when everything was served out of
 * `public/`. Once assets moved to S3 (DigitalOcean Spaces), those paths
 * needed to resolve against the bucket's public base URL. This helper is
 * the single choke point where that rewrite happens — the runtime passes
 * every audio / image / video URL through it before loading.
 *
 * Paths that should be rewritten:
 *   `/audio/...`, `/img/...`, `/sessions/...`
 *
 * Paths passed through:
 *   `https://...`, `http://...`, `data:...`, `blob:...`, `./foo.mp3`
 *
 * Configuration:
 *   Set `VITE_S3_PUBLIC_BASE_URL` in the Vite env (root `.env` or
 *   `.env.local`) to the bucket's base, e.g.
 *   `https://gaze.nyc3.digitaloceanspaces.com`. With no base configured
 *   the helper is a no-op and legacy paths will 404 against the dev
 *   server, which is a useful signal that the env var is missing.
 */

const S3_PUBLIC_BASE_URL: string = (
	(import.meta.env as Record<string, string | undefined>)
		.VITE_S3_PUBLIC_BASE_URL ?? ''
).replace(/\/$/, '')

const LEGACY_PREFIXES = ['/audio/', '/img/', '/sessions/']

/**
 * Resolve a path or URL to something the browser can fetch. Safe to call
 * with any value; non-rewritable inputs return unchanged.
 */
export function assetUrl(input: string | null | undefined): string {
	if (!input) return ''
	// Pass-through: already absolute URLs, protocol-relative, data:, blob:
	if (
		input.startsWith('http://') ||
		input.startsWith('https://') ||
		input.startsWith('data:') ||
		input.startsWith('blob:') ||
		input.startsWith('//')
	) {
		return input
	}
	// Pass-through: no base configured, nothing to rewrite
	if (!S3_PUBLIC_BASE_URL) return input
	// Only rewrite known legacy prefixes so we don't accidentally hoist
	// Vite-served paths like `/src/assets/foo.svg`.
	for (const prefix of LEGACY_PREFIXES) {
		if (input.startsWith(prefix)) {
			return `${S3_PUBLIC_BASE_URL}${input}`
		}
	}
	return input
}
