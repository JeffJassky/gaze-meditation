import type { ThemeConfig } from './theme.js'
import type { BehaviorSuggestion, SoundboardEvent, SoundboardSample } from './behavior.js'
import { SESSION_STATUS, SESSION_VISIBILITY, SESSION_AUDIENCE } from '../constants/session.js'

// --- Enums / unions (derived from shared constants) ------------------------

export type SessionStatus = (typeof SESSION_STATUS)[number]
export type SessionVisibility = (typeof SESSION_VISIBILITY)[number]
export type SessionAudience = (typeof SESSION_AUDIENCE)[number]

export type AssetKind = 'audio' | 'image' | 'video'

// --- Session binaural config -----------------------------------------------

export interface SessionBinauralConfig {
	hertz?: number  // 6 by default
	volume?: number // 0.5 by default
}

// --- SceneConfig (strengthened) --------------------------------------------

export interface SceneAudioConfig {
	binaural?: SessionBinauralConfig
	fx?: {
		path: string
		volume?: number
		loop?: boolean | number
	}
	soundboard?: SoundboardEvent[]
}

export interface SceneBehaviorConfig {
	suggestions?: BehaviorSuggestion[]
	success?: {
		enabled?: boolean
		message?: string
	}
	fail?: {
		enabled?: boolean
		message?: string
	}
}

export interface SceneConfig {
	theme?: ThemeConfig
	voice?: string | string[]
	text?: string | string[]
	/** Override the session's default ElevenLabs voice for this scene. */
	elevenlabsVoiceId?: string
	/** Forced duration in ms. By default, dynamic based on text/voice/behavior. */
	duration?: number
	audio?: SceneAudioConfig
	behavior?: SceneBehaviorConfig
	onCompleteCallback?: (success: boolean, result?: unknown) => string | undefined
	// Timing (all in ms)
	fadeInDuration?: number
	fadeOutDuration?: number
	cooldown?: number
}

// --- Scene block -----------------------------------------------------------

export interface SceneBlock {
	id: string
	type: string
	label?: string
	config: SceneConfig
}

// --- Session-level types ---------------------------------------------------

export interface SessionAsset {
	id: string
	kind: AssetKind
	key: string
	label?: string
	contentType?: string
	size?: number
	meta?: Record<string, unknown>
}

export interface SessionAudio {
	musicTrack?: string
	binaural?: SessionBinauralConfig
	soundboard?: SoundboardSample[]
}

export interface SessionSettings {
	spiralBackground?: string
	videoBackground?: string
	[key: string]: unknown
}

export interface Session {
	id: string
	owner: string
	slug: string
	title: string
	description: string
	status: SessionStatus
	visibility: SessionVisibility
	publishedAt: string | null
	audience: SessionAudience
	tags: string[]
	isAdult: boolean
	theme: ThemeConfig
	coverAssetId: string | null
	audio: SessionAudio
	elevenlabsVoiceId: string | null
	assets: SessionAsset[]
	scenes: SceneBlock[]
	settings: SessionSettings
	createdAt: string
	updatedAt: string
}

export interface SessionListResult {
	items: Session[]
	page: number
	limit: number
	total: number
	hasMore: boolean
}
