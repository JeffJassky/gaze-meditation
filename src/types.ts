export interface BehaviorSuggestion {
	type:
		| 'head:still'
		| 'head:nod'
		| 'head:left'
		| 'head:right'
		| 'head:down'
		| 'head:up'
		| 'eyes:close'
		| 'eyes:open'
		| 'eyes:blink'
		| 'eyes:no-blink'
		| 'mouth:relax'
		| 'togue:out'
		| 'form:submit'
		| 'button:click'
		| 'speech:speak'
		| string
	options?: any // Other configuration options for the behavior (such as tolerance, etc)
	duration?: number // The duration the behavior must be held for
	failBehavor?: 'pause' | 'reset' // How to handle the duration timer when the suggestion fails
}

export interface SceneConfig {
	id?: string // Used for condtitional jumps / branching
	theme?: ThemeConfig // visual theming for the scene
	voice?: string | string[] // Text to be spoken during the scene
	text?: string | string[] // Text to be displayed during the scene
	duration?: number // Forced duration, by default, it's dynamic based on the text, voice audio duration, or maybe dependent on challenge completion
	audio?: {
		binaural?: SessionBinauralConfig
	}
	behavior?: {
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
	onCompleteCallback?: (success: boolean, result?: any) => string | undefined

	// Fade options
	fadeOutDuration?: number

	// Delay after completion before next instruction starts
	cooldown?: number
}

// Enums

export enum SessionState {
	IDLE = 'IDLE',
	INITIALIZING = 'INITIALIZING',
	INSTRUCTING = 'INSTRUCTING', // Prompt is visible, waiting for user to start
	VALIDATING = 'VALIDATING', // User is performing task, system checking
	REINFORCING_POS = 'REINFORCING_POS', // Success state
	REINFORCING_NEG = 'REINFORCING_NEG', // Failure state
	FINISHED = 'FINISHED',
	SELECTION = 'SELECTION'
}

export enum FormFieldType {
	TEXT = 'text',
	LONG_TEXT = 'longText',
	NUMBER = 'number',
	EMAIL = 'email',
	RADIO = 'radio',
	MULTISELECT = 'multiselect'
}

// Interfaces for Form Scene
export interface FormField {
	label: string
	type: FormFieldType
	name: string // The key for the field's value
	options?: string[] // For radio and multiselect
	required?: boolean // Optional: for validation
}

export interface FormSceneConfig extends SceneConfig {
	question: string
	fields: FormField[]
	autoContinue?: boolean
}

export interface ThemeConfig {
	textColor?: string
	positiveColor?: string
	negativeColor?: string
	backgroundColor?: string
	secondaryTextColor?: string
	accentColor?: string
	debugColor?: string
	tint?: {
		color: string // hex color
		opacity: number // 0-1
	}
}

export interface SessionBinauralConfig {
	hertz?: number // 6 by default
	volume?: number // 0.5 by default
}

// Data Models
export interface Session {
	id: string
	title: string
	isAdult?: boolean
	skipIntro?: boolean
	// experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
	description: string
	tags?: string[]
	audio?: {
		musicTrack?: string // Simulated audio track name
		binaural?: SessionBinauralConfig
	}
	videoBackground?: string
	spiralBackground?: string
	scenes: SceneConfig[] // All items use the unified Scene class
	theme?: ThemeConfig // Optional theme configuration for the program
}

export interface SessionMetric {
	sceneId: string
	success: boolean
	timestamp: number
	reactionTime: number
}

export interface PhysiologicalSnapshot {
	timestamp: number // Relative to session start (ms)
	blinkRate: number // Blinks per minute (rolling)
	blinkSpeed: number // Average blink duration in ms (rolling)
	breathRate: number // Estimated breaths per minute
	stillness: number // 0-1 score (1 = perfectly still)
	headYaw: number
	headPitch: number
	headRoll: number
	browRaise: number
	eyeOpenness: number
	mouthOpenness: number
}

export interface SessionLog {
	id: string
	subjectId: string
	programId: string
	startTime: string // ISO String
	endTime?: string
	totalScore: number
	metrics: SessionMetric[]
	physiologicalData: PhysiologicalSnapshot[]
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
	history: string[] // Array of SessionLog IDs
	calibration?: UserCalibration
}
