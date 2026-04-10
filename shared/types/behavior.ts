import type { FormField } from './form.js'

export type BehaviorType =
	| 'head:still'
	| 'head:nod'
	| 'head:shake'
	| 'head:left'
	| 'head:right'
	| 'head:down'
	| 'head:up'
	| 'eyes:close'
	| 'eyes:open'
	| 'eyes:blink'
	| 'eyes:no-blink'
	| 'mouth:relax'
	| 'tongue:out'
	| 'form:submit'
	| 'motion:move'
	| 'motion:impact'
	| 'button:click'
	| 'speech:speak'
	| 'type'

/**
 * Maps each known behavior type to the shape of its type-specific options.
 * These are the fields unique to each behavior — the common fields
 * (duration, failBehavior) live on BehaviorSuggestion directly.
 */
export interface BehaviorOptionsMap {
	'head:still': { tolerance?: number }
	'head:nod': { type?: 'YES' | 'NO' }
	'head:shake': { type?: 'YES' | 'NO' }
	'head:left': Record<string, never>
	'head:right': Record<string, never>
	'head:down': Record<string, never>
	'head:up': Record<string, never>
	'eyes:close': { threshold?: number }
	'eyes:open': { threshold?: number }
	'eyes:blink': Record<string, never>
	'eyes:no-blink': Record<string, never>
	'mouth:relax': { threshold?: number }
	'tongue:out': { threshold?: number }
	'form:submit': { question: string; fields: FormField[]; autoContinue?: boolean }
	'motion:move': Record<string, never>
	'motion:impact': { impacts?: number; display?: 'none' | 'progress' | 'dots' }
	'button:click': Record<string, never>
	'speech:speak': { targetValue: string }
	'type': { targetPhrase: string }
}

/** Type-safe behavior config, discriminated on `type`. */
export type BehaviorSuggestion = {
	[T in BehaviorType]: {
		type: T
		options?: BehaviorOptionsMap[T]
		duration?: number
		failBehavior?: 'pause' | 'reset'
	}
}[BehaviorType]

/** Extract a single variant from the BehaviorSuggestion union. */
export type BehaviorSuggestionOf<T extends BehaviorType> = Extract<BehaviorSuggestion, { type: T }>

/** Shorthand for the options shape of a specific behavior type. */
export type BehaviorOptionsOf<T extends BehaviorType> = BehaviorOptionsMap[T]

/**
 * Loose shape for code that manipulates suggestions generically
 * (editor patches, JSON deserialization, unknown/custom behavior types).
 * Every BehaviorSuggestion is assignable to this type.
 */
export interface BehaviorSuggestionRaw {
	type: string
	options?: Record<string, unknown>
	duration?: number
	failBehavior?: 'pause' | 'reset'
}

export interface SoundboardSample {
	id: string
	path: string
	volume?: number
	loop?: boolean | number
	fadeInDuration?: number
	fadeOutDuration?: number
}

export interface SoundboardEvent {
	event: 'start' | 'stop'
	id: string
}
