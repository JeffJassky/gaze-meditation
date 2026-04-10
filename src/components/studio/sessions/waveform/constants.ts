/**
 * Tuning constants for the waveform timeline and silence-detection splitter.
 */

// --- Silence detection -----------------------------------------------------

/** RMS amplitude below this (in dB) is treated as silence. */
export const SILENCE_THRESHOLD_DB = -40

/** A silent gap must last at least this long (seconds) to count as a split point. */
export const SILENCE_MIN_DURATION = 0.3

/** Segments shorter than this (seconds) are merged with their neighbour. */
export const MIN_SEGMENT_DURATION = 0.5

// --- Timeline UI -----------------------------------------------------------

/** Default height of the waveform panel in pixels. */
export const WAVEFORM_HEIGHT = 70

/** Minimum region length in seconds — prevents zero-width drag accidents. */
export const MIN_REGION_DURATION = 0.1

/** Default (unselected) region colour — neutral grey. */
export const REGION_COLOR = 'hsla(0, 0%, 50%, 0.12)'

/** Active (selected) region colour. */
export const REGION_ACTIVE_COLOR = 'hsla(200, 60%, 55%, 0.35)'

// --- Per-scene duration estimation -----------------------------------------

/** Assumed speaking rate for estimating scene duration from text (words/min). */
export const ESTIMATED_WPM = 140

/** Default duration (seconds) for scenes with no voice text and no explicit duration. */
export const DEFAULT_SCENE_DURATION = 5

/** Minimum estimated duration (seconds) even for very short text. */
export const MIN_ESTIMATED_DURATION = 2
