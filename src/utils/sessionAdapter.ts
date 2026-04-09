import type { Session, SceneConfig } from '../types'
import type { SessionDoc, SceneBlock } from '../services/sessions'

/**
 * Convert a database-fed SessionDoc (as returned by `/sessions/:id`) into
 * the client runtime shape that Theater, SessionLivePreview, and the
 * Scene class consume.
 *
 * The critical behaviour: scene configs are passed BY REFERENCE, not
 * cloned. The Scene class holds `this.config = config` and reads live
 * fields (text, voice, audio, theme) at scene-start time. Cloning here
 * would freeze those reads against a snapshot and break the editor's
 * live-edit flow. If the caller needs a safe snapshot they can clone
 * after the fact.
 *
 * Design notes:
 *   - `SessionDoc.scenes` is `SceneBlock[]` (each block wraps a `config`).
 *     We flatten to `SceneConfig[]` by pulling `config` out and stamping
 *     `id` from the block so Scene-level id tracking works for metrics.
 *   - `skipIntro: true` because imported sessions already omit the
 *     hardcoded reminder scenes the legacy runtime used to prepend.
 *   - `audio` and `theme` are passed through as Mixed — they match the
 *     legacy shape field-for-field so no conversion is needed.
 */
export function sessionDocToLegacy(doc: SessionDoc): Session {
	// Presentation defaults that aren't first-class SessionDoc fields live
	// in the `settings` Mixed blob. Normalise any legacy paths that dropped
	// the leading slash so the runtime's URL rewriter can match them.
	const settings = (doc.settings ?? {}) as Record<string, unknown>
	const spiralBackground = normaliseAssetPath(
		settings.spiralBackground as string | undefined,
	)
	const videoBackground = normaliseAssetPath(
		settings.videoBackground as string | undefined,
	)

	return {
		id: doc.id,
		title: doc.title || 'Untitled',
		description: doc.description || '',
		tags: doc.tags,
		isAdult: doc.isAdult,
		skipIntro: true,
		audio: doc.audio as Session['audio'],
		theme: doc.theme as Session['theme'],
		spiralBackground,
		videoBackground,
		scenes: doc.scenes.map(sceneBlockToConfig),
	}
}

/**
 * Some of the imported legacy paths were stored as `img/spiral.png`
 * (no leading slash). Theater + assetUrl treat anything that doesn't
 * start with `/` as opaque, which breaks the S3 rewrite. Stamp the
 * slash back on so everything routes through the standard helper.
 */
function normaliseAssetPath(p: string | undefined): string | undefined {
	if (!p) return undefined
	if (
		p.startsWith('http://') ||
		p.startsWith('https://') ||
		p.startsWith('/')
	) {
		return p
	}
	return `/${p}`
}

/**
 * Flatten a single SceneBlock to its underlying SceneConfig, carrying
 * the block id so the runtime can use it for metric tracking and
 * per-scene keying.
 *
 * We mutate the config in place to stamp `id` — this is idempotent
 * (only writes when missing) and means the Scene class later reads a
 * live reference that already has an id attached. No clone penalty.
 */
function sceneBlockToConfig(block: SceneBlock): SceneConfig {
	const cfg = (block.config ?? {}) as SceneConfig & { id?: string }
	if (!cfg.id) cfg.id = block.id
	return cfg as SceneConfig
}
