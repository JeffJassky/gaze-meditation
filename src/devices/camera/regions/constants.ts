/**
 * Named constants for camera region signal processing.
 *
 * All thresholds were tuned empirically against MediaPipe Face Mesh
 * keypoints running at 640×480. Values are expressed in the native
 * coordinate space of each signal (radians, normalised ratios, etc.)
 * unless otherwise noted.
 */

// =============================================================================
// Head Region
// =============================================================================

/** Offset (rad) subtracted from raw pitch to account for a natural neutral head tilt. */
export const HEAD_PITCH_NEUTRAL_OFFSET = 0.15

// --- Movement detection ---

/** Normalised nose-position delta that counts as intentional head movement. */
export const HEAD_MOVE_THRESHOLD = 0.005

// --- Adaptive centering ---

/**
 * Lerp rate for centering when the head is stable.
 * Fast adaptation re-centres on a new comfortable position.
 */
export const HEAD_CENTER_ALPHA_STABLE = 0.1

/**
 * Lerp rate for centering when the head is moving.
 * Slow adaptation holds the centre so we can measure deviation magnitude.
 */
export const HEAD_CENTER_ALPHA_MOVING = 0.001

// --- Stability ---

/**
 * Multiplier applied to per-frame velocity before mapping to a 0–1
 * stability score.  Higher values make the score more sensitive to
 * movement.  The raw stability is `max(0, 1 - velocity * GAIN)`.
 */
export const HEAD_STABILITY_VELOCITY_GAIN = 20

/**
 * Multiplier applied to positional (x/y) deltas relative to rotational
 * deltas when computing head velocity.  Positional jitter in normalised
 * screen coords is typically smaller than rotational jitter in radians,
 * so this brings them onto a comparable scale.
 */
export const HEAD_POSITION_VELOCITY_WEIGHT = 2

/**
 * Weight applied to positional drift (x/y) relative to rotational drift
 * (yaw/pitch) when computing the overall drift magnitude.  Position is
 * in normalised [0,1] coords while rotation is in radians, so the weight
 * compensates for the scale difference.
 */
export const HEAD_POSITION_DRIFT_WEIGHT = 1.5

/** Lerp rate for the smoothed stability score (prevents jagged graph). */
export const HEAD_STABILITY_SMOOTH_ALPHA = 0.1

/**
 * Hysteresis thresholds for the stable ↔ unstable transition.
 * The gap between them prevents rapid toggling at the boundary.
 */
export const HEAD_STABLE_THRESHOLD = 0.5
export const HEAD_UNSTABLE_THRESHOLD = 0.4

// --- Velocity-based gesture detection ---

/** Lerp rate for the smoothed velocity signal used in gesture detection. */
export const HEAD_GESTURE_VELOCITY_SMOOTH = 0.2

/**
 * Minimum smoothed velocity (rad/frame) to register as a deliberate
 * gesture rather than tracker noise.  Acts as a dead zone.
 */
export const HEAD_GESTURE_VELOCITY_THRESHOLD = 0.004

/** Minimum ms between consecutive gesture events (debounce). */
export const HEAD_GESTURE_DEBOUNCE_MS = 300

// --- Nod / shake oscillation detection ---

/**
 * Pitch deviation (rad) from adaptive centre required to enter the
 * "down" or "up" excursion state for nod detection.
 */
export const HEAD_NOD_DOWN_THRESHOLD = 0.010
export const HEAD_NOD_UP_THRESHOLD = -0.010

/**
 * Pitch deviation (rad) within which the nod state returns to centre.
 * Tighter than the entry thresholds to create a hysteresis gap.
 */
export const HEAD_NOD_RETURN_THRESHOLD = 0.002

/**
 * Yaw deviation (rad) thresholds for shake detection.
 * Negative = left turn, positive = right turn (in the raw coordinate space).
 */
export const HEAD_SHAKE_LEFT_THRESHOLD = -0.009
export const HEAD_SHAKE_RIGHT_THRESHOLD = 0.009

/** Yaw return-to-centre dead zone for shake state reset. */
export const HEAD_SHAKE_RETURN_THRESHOLD = 0.002

// =============================================================================
// Eyes Region
// =============================================================================

/** Default eye-aspect-ratio floor for 0–1 normalisation. */
export const EYES_MIN_OPEN = 0.15

/** Default eye-aspect-ratio ceiling for 0–1 normalisation. */
export const EYES_MAX_OPEN = 0.35

/** Normalised openness below which a blink is detected. */
export const EYES_BLINK_THRESHOLD = 0.1

/** Minimum blink duration (ms) to filter out tracker twitches. */
export const EYES_BLINK_MIN_DURATION_MS = 100

/**
 * EAR deviation below baseline to register a close event.
 * Negative because closing reduces EAR.
 */
export const EYES_CLOSE_DEVIATION = -0.04

/**
 * EAR deviation above which the eyes are considered open again.
 * Slightly less negative than CLOSE_DEVIATION for hysteresis.
 */
export const EYES_OPEN_DEVIATION = -0.035

/**
 * Normalised openness above which the eyes are always considered open
 * regardless of adaptive baseline.
 */
export const EYES_FORCE_OPEN_THRESHOLD = 0.3

/** Minimum raw EAR before the adaptive baseline initialises. */
export const EYES_INIT_EAR_THRESHOLD = 0.15

/** Lerp rate for adapting baseline openness when eyes widen quickly. */
export const EYES_BASELINE_FAST_ALPHA = 0.1

/** Lerp rate for slow baseline drift toward current EAR when open. */
export const EYES_BASELINE_SLOW_ALPHA = 0.005

/** Lerp rate for smoothing the delta-EAR signal (droop detection). */
export const EYES_DELTA_SMOOTH_ALPHA = 0.2

/** Smoothed delta-EAR below which a droop event fires. */
export const EYES_DROOP_THRESHOLD = -0.003

/** Minimum ms between consecutive droop events. */
export const EYES_DROOP_DEBOUNCE_MS = 300

// --- Gaze screen mapping (default calibration) ---

export const EYES_GAZE_MIN_X = -0.2
export const EYES_GAZE_MAX_X = 0.2
export const EYES_GAZE_MIN_Y = -0.1
export const EYES_GAZE_MAX_Y = 0.3

// =============================================================================
// Mouth Region
// =============================================================================

/** Openness delta from baseline required to consider the mouth "open". */
export const MOUTH_OPEN_THRESHOLD = 0.03

/** Lerp rate for adapting the mouth openness baseline. */
export const MOUTH_ADAPTATION_RATE = 0.05

/** Openness delta noise window — values within this of baseline still adapt. */
export const MOUTH_ADAPTATION_WINDOW = 0.01

/** Lerp rate for adapting the chin distance baseline. */
export const MOUTH_CHIN_BASELINE_ALPHA = 0.05

/**
 * Tongue-out detection fires when chinDist / baselineChinDist drops
 * below this ratio (chin shortening indicates tongue protrusion).
 */
export const MOUTH_TONGUE_METRIC_THRESHOLD = 0.8

/** Minimum ms between consecutive tongue events. */
export const MOUTH_TONGUE_DEBOUNCE_MS = 300

// =============================================================================
// Breath Region
// =============================================================================

/** Number of frames kept in the rolling statistics buffer (~5 s at 60 fps). */
export const BREATH_HISTORY_SIZE = 300

/** Shortest plausible breath period in ms (~40 breaths/min). */
export const BREATH_MIN_PERIOD_MS = 1500

/** Longest plausible breath period in ms (~6 breaths/min). */
export const BREATH_MAX_PERIOD_MS = 10000

/** Mouth openness above which the breath signal is vetoed (talking/yawning). */
export const BREATH_MOUTH_VETO_THRESHOLD = 0.15

/**
 * Minimum channel reliability (0–1) for a supervisor to participate
 * in the consensus fusion.
 */
export const BREATH_CHANNEL_MIN_RELIABILITY = 0.3

/**
 * Short-term noise window size (frames) used by ChannelSupervisor
 * for SNR calculation (~0.5 s at 60 fps).
 */
export const BREATH_SHORT_WINDOW = 30

/** Signal-power dead-zone for standard channels (pitch, lift). */
export const BREATH_DEAD_THRESHOLD = 0.002

/** Signal-power dead-zone for the scale channel (pixel-based). */
export const BREATH_SCALE_DEAD_THRESHOLD = 0.5

/** Noise-ratio above which channel reliability decreases. */
export const BREATH_NOISE_RATIO_THRESHOLD = 0.6

/** Per-frame reliability increase/decrease step. */
export const BREATH_RELIABILITY_STEP = 0.05

/**
 * Maximum per-frame change in the fused signal (slew limiter).
 * Prevents sudden jumps from corrupting the breath waveform.
 */
export const BREATH_SLEW_LIMIT = 0.5

/** Lerp rate for smoothing the fused breath signal. */
export const BREATH_SIGNAL_SMOOTH_ALPHA = 0.1

/** Lerp rate for decaying the signal toward zero when disturbed/calibrating. */
export const BREATH_DECAY_ALPHA = 0.05

/** Lerp rate for smoothing breath depth. */
export const BREATH_DEPTH_SMOOTH_ALPHA = 0.05

/**
 * Schmitt-trigger thresholds for breath-cycle detection.
 * The signal must cross UPPER to register an inhale and LOWER
 * to register an exhale, preventing jitter at zero crossings.
 */
export const BREATH_SCHMITT_UPPER = 0.2
export const BREATH_SCHMITT_LOWER = -0.2

/** Maximum recent breath periods retained for rate averaging. */
export const BREATH_RATE_WINDOW = 5

// =============================================================================
// Session Tracker — Biometric Summary
// =============================================================================

/** Sampling interval (ms) for physiological snapshots (2 Hz). */
export const TRACKER_SAMPLE_INTERVAL_MS = 500

/** Rolling window (ms) for blink rate and duration calculations. */
export const TRACKER_BLINK_WINDOW_MS = 60_000

/** Minimum blink duration (ms) to include in rolling average. */
export const TRACKER_BLINK_MIN_DURATION_MS = 50

/** Minimum snapshots required before generating a biometric summary. */
export const TRACKER_MIN_SNAPSHOTS = 10

/**
 * Baseline window: first 60 s of session (120 samples at 2 Hz),
 * or 20% of total snapshots, whichever is smaller.
 */
export const TRACKER_BASELINE_MAX_SAMPLES = 120
export const TRACKER_BASELINE_FRACTION = 0.2

/** Sliding window size for "deepest state" detection (60 samples = 30 s). */
export const TRACKER_DEEP_WINDOW_SAMPLES = 60

/**
 * Blink rate (BPM) used as the normalisation ceiling when computing
 * the blink-rate sub-score of the coherence metric.  A rate at or
 * above this value maps to a sub-score of 0.
 */
export const TRACKER_BLINK_RATE_CEILING = 30

/**
 * Coherence score weights for the "deepest state" detection.
 * Stillness is weighted highest because it's the most reliable
 * indicator of somatic absorption; blink rate and facial tension
 * are secondary signals that are noisier but still informative.
 */
export const TRACKER_COHERENCE_WEIGHT_STILLNESS = 0.4
export const TRACKER_COHERENCE_WEIGHT_BLINK = 0.3
export const TRACKER_COHERENCE_WEIGHT_TENSION = 0.3

/** Minimum seconds elapsed before blink-rate metric is reported. */
export const TRACKER_BLINK_RATE_MIN_SECONDS = 5
