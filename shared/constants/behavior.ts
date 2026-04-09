/**
 * Default timing and threshold values for behaviors.
 * Individual behavior constructors spread these before user-supplied options,
 * so any per-scene override still wins.
 */

/** Default duration (ms) for action-style behaviors (gaze, eyes, stillness). */
export const BEHAVIOR_DURATION_DEFAULT = 5000

/** Longer timeout (ms) for open/close eye behaviors. */
export const BEHAVIOR_DURATION_LONG = 8000

/** Default timeout (ms) for speech matching. */
export const SPEECH_DURATION_DEFAULT = 10000

/** Default timeout (ms) for tongue-out detection. */
export const TONGUE_DURATION_DEFAULT = 2000

/** Head stillness drift tolerance (0–1 normalised). */
export const STILLNESS_TOLERANCE_DEFAULT = 0.05

/** Mouth / tongue detection threshold (0–1 normalised). */
export const MOUTH_THRESHOLD_DEFAULT = 0.15
