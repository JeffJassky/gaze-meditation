/**
 * Safely extract a human-readable message from an unknown catch value.
 *
 * Replaces the widespread `(e as Error).message` pattern which crashes
 * if the thrown value isn't actually an Error (e.g. a string, null, or
 * a DOMException).
 */
export function errorMessage(e: unknown): string {
	if (e instanceof Error) return e.message
	if (typeof e === 'string') return e
	return 'An unexpected error occurred'
}
