/**
 * Normalize a hex color input — auto-prepends # if the user types or pastes
 * a bare 3 or 6 digit hex code.
 */
export function normalizeHex(value: string): string {
	const trimmed = value.trim()
	if (!trimmed) return ''
	// Already has #
	if (trimmed.startsWith('#')) return trimmed
	// Bare 6-digit hex (e.g. "ff0000")
	if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`
	// Bare 3-digit hex (e.g. "f00")
	if (/^[0-9a-fA-F]{3}$/.test(trimmed)) return `#${trimmed}`
	// Partial typing — could be mid-input like "ff00" — prepend # anyway
	if (/^[0-9a-fA-F]{1,6}$/.test(trimmed)) return `#${trimmed}`
	return trimmed
}
