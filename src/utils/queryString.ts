/**
 * Build a query string from a record of parameters.
 * Skips undefined, null, and empty-string values.
 * Booleans are serialized as '1'/'0'.
 */
export function qs(params: Record<string, unknown>): string {
	const p = new URLSearchParams()
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue
		p.set(k, v === true ? '1' : String(v))
	}
	const s = p.toString()
	return s ? `?${s}` : ''
}
