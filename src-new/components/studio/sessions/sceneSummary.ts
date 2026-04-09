import type { SceneBlock } from '@/services/sessions'

/**
 * Returns the first non-empty preview line for a scene, drawing from
 * `config.text` then `config.voice`. Both fields may be a string or an
 * array of strings (legacy data shape).
 */
export function sceneFirstLine(scene: SceneBlock, maxLen = 80): string {
	const cfg = (scene?.config ?? {}) as Record<string, unknown>
	const fields: unknown[] = [cfg.text, cfg.voice]
	for (const field of fields) {
		if (typeof field === 'string') {
			const trimmed = field.trim()
			if (trimmed) return trimmed.slice(0, maxLen)
		} else if (Array.isArray(field)) {
			for (const item of field) {
				const s = String(item ?? '').trim()
				if (s) return s.slice(0, maxLen)
			}
		}
	}
	return ''
}

/** Format a duration in seconds as `m:ss`, or an em dash if undefined. */
export function formatDuration(seconds?: number): string {
	if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return '—'
	const s = Math.max(0, Math.floor(seconds))
	const m = Math.floor(s / 60)
	const r = s % 60
	return `${m}:${r.toString().padStart(2, '0')}`
}
