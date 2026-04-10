/**
 * Canonical value arrays for session enums.
 * Both the server (Mongoose schema) and client (UI dropdowns, type guards)
 * derive from these so they can never drift.
 */

export const SESSION_STATUS = ['draft', 'published'] as const
export const SESSION_VISIBILITY = ['private', 'public'] as const

/**
 * Audience categorization. `f4a` = "female for all", etc.
 * Kept loose — add values here as the taxonomy grows.
 */
/** Who produced the voice audio. */
export const VOICE_ORIGIN = ['human', 'ai'] as const

/** How the voice audio is structured across the session. */
export const VOICE_STRUCTURE = ['session', 'scene'] as const

export const SESSION_AUDIENCE = [
	'f4a',
	'm4a',
	'm4f',
	'm4m',
	'f4f',
	'f4m',
	't4a',
	't4f',
	't4m',
	't4t',
	'unspecified',
] as const
