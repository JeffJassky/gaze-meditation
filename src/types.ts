import { type InstructionOptions, type Instruction } from './core/Instruction'
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

// Interfaces for Form Instruction
export interface FormField {
	label: string
	type: FormFieldType
	name: string // The key for the field's value
	options?: string[] // For radio and multiselect
	required?: boolean // Optional: for validation
}

export interface FormInstructionOptions extends InstructionOptions {
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

export interface ProgramBinauralConfig {
	hertz?: number // 6 by default
	volume?: number // 0.5 by default
}

// Data Models
export interface Program {
	id: string
	title: string
	isAdult?: boolean
	// experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
	description: string
	tags?: string[]
	audio?: {
		musicTrack?: string // Simulated audio track name
		binaural?: ProgramBinauralConfig
	}
	videoBackground?: string
	spiralBackground?: string
	instructions: Instruction[] // All instructions extend the base Instruction class
	theme?: ThemeConfig // Optional theme configuration for the program
}

export interface SessionMetric {
	instructionId: string
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
