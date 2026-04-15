// ---------------------------------------------------------------------------
// Haptics — Buttplug.io device integration types
// ---------------------------------------------------------------------------

/** Device capability a haptic pattern targets. */
export type HapticFeature = 'vibrate' | 'rotate' | 'linear'

/**
 * Session-level haptic pattern definition.
 * Analogous to SoundboardSample — a named preset that scenes reference.
 */
export interface HapticPattern {
	id: string
	/** Human-readable label for the studio UI. */
	label?: string
	/** Target device features. Defaults to ['vibrate']. */
	features?: HapticFeature[]
	/** Static intensity (0.0–1.0). Used when `curve` is absent. */
	intensity: number
	/**
	 * Intensity curve for ramping / pulsing.
	 * Array of {time, intensity} points, linearly interpolated.
	 * When present, overrides `intensity`. Repeats if the pattern loops.
	 */
	curve?: HapticCurvePoint[]
	/** Total duration in ms. Required for curve-based patterns and loops. */
	duration?: number
	/** Whether this pattern loops until explicitly stopped. */
	loop?: boolean
	/** Ramp time in ms to reach target intensity from 0. */
	rampUp?: number
	/** Ramp time in ms to fade from current intensity to 0. */
	rampDown?: number
}

export interface HapticCurvePoint {
	/** Time offset in ms from pattern start. */
	time: number
	/** Intensity 0.0–1.0 */
	intensity: number
}

/**
 * Scene-level haptic event — starts or stops a pattern.
 * Structurally identical to SoundboardEvent.
 */
export interface HapticEvent {
	event: 'start' | 'stop'
	/** References HapticPattern.id from session-level config. */
	id: string
}

/** Scene-level haptic config. */
export interface SceneHapticsConfig {
	/** Start/stop events for session-level patterns. */
	events?: HapticEvent[]
	/** Scene-level intensity multiplier (0.0–1.0). Scales all active patterns. */
	intensityOverride?: number
}

/** Haptic pulse triggered by behavior success or failure. */
export interface BehaviorHapticResponse {
	/** Which pattern to fire. References HapticPattern.id. */
	patternId: string
	/** Duration override in ms for this one-shot response. */
	duration?: number
	/** Intensity override (0.0–1.0) for this one-shot response. */
	intensity?: number
}

/** Session-level haptics configuration. Analogous to SessionAudio. */
export interface SessionHaptics {
	/** Named patterns that scenes can trigger. */
	patterns?: HapticPattern[]
	/** Default intensity multiplier for the whole session (0.0–1.0). */
	masterIntensity?: number
	/** Haptic response fired on any behavior success. */
	onBehaviorSuccess?: BehaviorHapticResponse
	/** Haptic response fired on any behavior failure. */
	onBehaviorFail?: BehaviorHapticResponse
}
