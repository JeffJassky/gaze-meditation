// Re-export shared domain types so existing `@/types` imports continue to work.
export type {
	ThemeConfig,
	BehaviorType,
	BehaviorOptionsMap,
	BehaviorSuggestion,
	BehaviorSuggestionOf,
	BehaviorOptionsOf,
	BehaviorSuggestionRaw,
	SoundboardSample,
	SoundboardEvent,
	SessionBinauralConfig,
	SceneAudioConfig,
	SceneBehaviorConfig,
	SceneConfig,
	SceneBlock,
	SessionAsset,
	SessionAudio,
	SessionSettings,
	Session,
	SessionListResult,
	SessionStatus,
	SessionVisibility,
	SessionAudience,
	AssetKind,
	PlaylistDoc,
	PlaylistVisibility,
	PlaylistListResult,
	SessionMetric,
	PhysiologicalSnapshot,
	BiometricSummary,
	SessionReport,
	FormField,
	FormSceneConfig,
} from '@shared/types'

export { FormFieldType } from '@shared/types'

// --- Client-only types (UI state, legacy models) ---------------------------

import type { SessionMetric, PhysiologicalSnapshot, BiometricSummary } from '@shared/types'

export enum SessionState {
	IDLE = 'IDLE',
	INITIALIZING = 'INITIALIZING',
	INSTRUCTING = 'INSTRUCTING',
	VALIDATING = 'VALIDATING',
	REINFORCING_POS = 'REINFORCING_POS',
	REINFORCING_NEG = 'REINFORCING_NEG',
	FINISHED = 'FINISHED',
	SELECTION = 'SELECTION'
}

export interface SessionLog {
	id: string
	subjectId: string
	programId: string
	startTime: string
	endTime?: string
	totalScore: number
	metrics: SessionMetric[]
	physiologicalData: PhysiologicalSnapshot[]
	biometrics?: BiometricSummary
}

export interface UserCalibration {
	blinkThreshold?: number
	gazeMinX?: number
	gazeMaxX?: number
	gazeMinY?: number
	gazeMaxY?: number
}

export interface User {
	id: string
	name: string
	totalScore: number
	history: string[]
	calibration?: UserCalibration
}
