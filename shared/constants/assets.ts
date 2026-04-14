/**
 * Asset kind definitions — allowed MIME types, max file sizes, and labels.
 * Used by both the server (validation on upload/register) and the client
 * (file picker accept filters, size warnings).
 */

export const ASSET_KINDS = ['music', 'fx', 'voice', 'session-audio', 'image', 'spiral', 'video', 'profile-image'] as const

export type AssetKind = (typeof ASSET_KINDS)[number]

export interface AssetKindConfig {
	label: string
	/** Allowed MIME type prefixes (e.g. 'audio/' matches any audio MIME). */
	mimePatterns: string[]
	/** Maximum file size in bytes. */
	maxBytes: number
	/** Human-readable max size for display. */
	maxSizeLabel: string
	/** File input accept attribute value. */
	accept: string
}

const MB = 1024 * 1024

export const ASSET_KIND_CONFIG: Record<AssetKind, AssetKindConfig> = {
	music: {
		label: 'Music',
		mimePatterns: ['audio/'],
		maxBytes: 50 * MB,
		maxSizeLabel: '50 MB',
		accept: 'audio/*',
	},
	fx: {
		label: 'Sound effect',
		mimePatterns: ['audio/'],
		maxBytes: 10 * MB,
		maxSizeLabel: '10 MB',
		accept: 'audio/*',
	},
	voice: {
		label: 'Voice clip',
		mimePatterns: ['audio/'],
		maxBytes: 20 * MB,
		maxSizeLabel: '20 MB',
		accept: 'audio/*',
	},
	'session-audio': {
		label: 'Session recording',
		mimePatterns: ['audio/'],
		maxBytes: 200 * MB,
		maxSizeLabel: '200 MB',
		accept: 'audio/*',
	},
	image: {
		label: 'Image',
		mimePatterns: ['image/'],
		maxBytes: 10 * MB,
		maxSizeLabel: '10 MB',
		accept: 'image/*',
	},
	spiral: {
		label: 'Spiral',
		mimePatterns: ['image/'],
		maxBytes: 10 * MB,
		maxSizeLabel: '10 MB',
		accept: 'image/*',
	},
	video: {
		label: 'Video',
		mimePatterns: ['video/'],
		maxBytes: 100 * MB,
		maxSizeLabel: '100 MB',
		accept: 'video/*',
	},
	'profile-image': {
		label: 'Profile image',
		mimePatterns: ['image/'],
		maxBytes: 5 * MB,
		maxSizeLabel: '5 MB',
		accept: 'image/*',
	},
}

/**
 * Validate a content type against an asset kind's allowed MIME patterns.
 */
export function isValidMimeForKind(kind: AssetKind, contentType: string): boolean {
	const config = ASSET_KIND_CONFIG[kind]
	if (!config) return false
	return config.mimePatterns.some((pattern) => contentType.startsWith(pattern))
}

/**
 * Validate file size against an asset kind's maximum.
 */
export function isValidSizeForKind(kind: AssetKind, size: number): boolean {
	const config = ASSET_KIND_CONFIG[kind]
	if (!config) return false
	return size <= config.maxBytes
}
