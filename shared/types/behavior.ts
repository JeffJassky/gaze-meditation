export type BehaviorType =
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
	| 'tongue:out'
	| 'form:submit'
	| 'motion:move'
	| 'motion:impact'
	| 'button:click'
	| 'speech:speak'

export interface BehaviorSuggestion {
	type: BehaviorType | (string & {})
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
