import type { HapticPattern } from '../types/haptics.js'

// ---------------------------------------------------------------------------
// Haptic pattern preset library
// ---------------------------------------------------------------------------

export interface HapticPreset extends Omit<HapticPattern, 'id'> {
	/** Unique key for the preset (used as ID when added to a session). */
	key: string
	/** Category for grouping in the UI. */
	category: HapticPresetCategory
	/** Short description shown in the picker. */
	description: string
}

export type HapticPresetCategory = 'vibration' | 'rotation' | 'linear' | 'combo'

export const HAPTIC_PRESET_CATEGORIES: { key: HapticPresetCategory; label: string }[] = [
	{ key: 'vibration', label: 'Vibration' },
	{ key: 'rotation', label: 'Rotation' },
	{ key: 'linear', label: 'Linear' },
	{ key: 'combo', label: 'Multi-Feature' },
]

/**
 * Built-in haptic pattern presets.
 * Authors pick from this list instead of manually configuring patterns.
 */
export const HAPTIC_PRESETS: HapticPreset[] = [
	// --- Constant (flat intensity, no ramp) ------------------------------------

	{
		key: 'constant-10',
		label: 'Constant 10%',
		category: 'vibration',
		description: 'Flat 10% vibration. Barely perceptible.',
		features: ['vibrate'],
		intensity: 0.1,
		loop: true,
	},
	{
		key: 'constant-25',
		label: 'Constant 25%',
		category: 'vibration',
		description: 'Flat 25% vibration. Subtle background.',
		features: ['vibrate'],
		intensity: 0.25,
		loop: true,
	},
	{
		key: 'constant-50',
		label: 'Constant 50%',
		category: 'vibration',
		description: 'Flat 50% vibration. Moderate.',
		features: ['vibrate'],
		intensity: 0.5,
		loop: true,
	},
	{
		key: 'constant-75',
		label: 'Constant 75%',
		category: 'vibration',
		description: 'Flat 75% vibration. Strong.',
		features: ['vibrate'],
		intensity: 0.75,
		loop: true,
	},
	{
		key: 'constant-100',
		label: 'Constant 100%',
		category: 'vibration',
		description: 'Flat maximum vibration.',
		features: ['vibrate'],
		intensity: 1.0,
		loop: true,
	},

	// --- Vibration patterns ---------------------------------------------------

	{
		key: 'gentle-pulse',
		label: 'Gentle Pulse',
		category: 'vibration',
		description: 'Soft, slow pulsing. Good for ambient background.',
		features: ['vibrate'],
		intensity: 0.3,
		curve: [
			{ time: 0, intensity: 0.1 },
			{ time: 1000, intensity: 0.3 },
			{ time: 2000, intensity: 0.1 },
		],
		duration: 2000,
		loop: true,
	},
	{
		key: 'steady-low',
		label: 'Steady Low',
		category: 'vibration',
		description: 'Constant low-intensity vibration.',
		features: ['vibrate'],
		intensity: 0.25,
		loop: true,
		rampUp: 500,
		rampDown: 500,
	},
	{
		key: 'steady-medium',
		label: 'Steady Medium',
		category: 'vibration',
		description: 'Constant medium-intensity vibration.',
		features: ['vibrate'],
		intensity: 0.5,
		loop: true,
		rampUp: 300,
		rampDown: 500,
	},
	{
		key: 'steady-high',
		label: 'Steady High',
		category: 'vibration',
		description: 'Constant high-intensity vibration.',
		features: ['vibrate'],
		intensity: 0.8,
		loop: true,
		rampUp: 200,
		rampDown: 500,
	},
	{
		key: 'heartbeat',
		label: 'Heartbeat',
		category: 'vibration',
		description: 'Double-pulse heartbeat rhythm.',
		features: ['vibrate'],
		intensity: 0.6,
		curve: [
			{ time: 0, intensity: 0 },
			{ time: 50, intensity: 0.6 },
			{ time: 150, intensity: 0 },
			{ time: 250, intensity: 0.4 },
			{ time: 350, intensity: 0 },
			{ time: 800, intensity: 0 },
		],
		duration: 800,
		loop: true,
	},
	{
		key: 'wave',
		label: 'Wave',
		category: 'vibration',
		description: 'Smooth sine-wave-like ramp up and down.',
		features: ['vibrate'],
		intensity: 0.6,
		curve: [
			{ time: 0, intensity: 0.1 },
			{ time: 1500, intensity: 0.6 },
			{ time: 3000, intensity: 0.1 },
		],
		duration: 3000,
		loop: true,
	},
	{
		key: 'escalate',
		label: 'Escalate',
		category: 'vibration',
		description: 'Gradually increases intensity over 10 seconds.',
		features: ['vibrate'],
		intensity: 0.8,
		curve: [
			{ time: 0, intensity: 0.1 },
			{ time: 10000, intensity: 0.8 },
		],
		duration: 10000,
		loop: false,
	},
	{
		key: 'tease',
		label: 'Tease',
		category: 'vibration',
		description: 'Short bursts with pauses. Unpredictable feel.',
		features: ['vibrate'],
		intensity: 0.5,
		curve: [
			{ time: 0, intensity: 0 },
			{ time: 100, intensity: 0.5 },
			{ time: 300, intensity: 0 },
			{ time: 800, intensity: 0 },
			{ time: 900, intensity: 0.7 },
			{ time: 1000, intensity: 0 },
			{ time: 2000, intensity: 0 },
		],
		duration: 2000,
		loop: true,
	},
	{
		key: 'buzz-short',
		label: 'Quick Buzz',
		category: 'vibration',
		description: 'Short 500ms vibration burst. Good for feedback.',
		features: ['vibrate'],
		intensity: 0.6,
		duration: 500,
		loop: false,
		rampDown: 100,
	},
	{
		key: 'buzz-strong',
		label: 'Strong Buzz',
		category: 'vibration',
		description: 'Strong 300ms pulse. Ideal for behavior rewards.',
		features: ['vibrate'],
		intensity: 0.9,
		duration: 300,
		loop: false,
	},
	{
		key: 'flutter',
		label: 'Flutter',
		category: 'vibration',
		description: 'Rapid on/off flutter pattern.',
		features: ['vibrate'],
		intensity: 0.4,
		curve: [
			{ time: 0, intensity: 0.4 },
			{ time: 100, intensity: 0 },
			{ time: 200, intensity: 0.4 },
			{ time: 300, intensity: 0 },
			{ time: 400, intensity: 0.4 },
			{ time: 500, intensity: 0 },
		],
		duration: 500,
		loop: true,
	},

	// --- Rotation patterns ----------------------------------------------------

	{
		key: 'slow-spin',
		label: 'Slow Spin',
		category: 'rotation',
		description: 'Gentle constant rotation. For devices with rotation.',
		features: ['rotate'],
		intensity: 0.3,
		loop: true,
		rampUp: 1000,
		rampDown: 1000,
	},
	{
		key: 'spin-pulse',
		label: 'Spin Pulse',
		category: 'rotation',
		description: 'Rotation that pulses in intensity.',
		features: ['rotate'],
		intensity: 0.5,
		curve: [
			{ time: 0, intensity: 0.2 },
			{ time: 1000, intensity: 0.5 },
			{ time: 2000, intensity: 0.2 },
		],
		duration: 2000,
		loop: true,
	},

	// --- Linear patterns ------------------------------------------------------

	{
		key: 'slow-stroke',
		label: 'Slow Stroke',
		category: 'linear',
		description: 'Slow linear movement cycle. For stroker/positional devices.',
		features: ['linear'],
		intensity: 0.5,
		curve: [
			{ time: 0, intensity: 0 },
			{ time: 2000, intensity: 1.0 },
			{ time: 4000, intensity: 0 },
		],
		duration: 4000,
		loop: true,
	},
	{
		key: 'fast-stroke',
		label: 'Fast Stroke',
		category: 'linear',
		description: 'Faster linear movement cycle.',
		features: ['linear'],
		intensity: 0.7,
		curve: [
			{ time: 0, intensity: 0 },
			{ time: 500, intensity: 1.0 },
			{ time: 1000, intensity: 0 },
		],
		duration: 1000,
		loop: true,
	},

	// --- Multi-feature patterns -----------------------------------------------

	{
		key: 'vibe-and-spin',
		label: 'Vibe + Spin',
		category: 'combo',
		description: 'Vibration and rotation together. For dual-motor devices.',
		features: ['vibrate', 'rotate'],
		intensity: 0.4,
		loop: true,
		rampUp: 500,
		rampDown: 500,
	},
	{
		key: 'full-intensity',
		label: 'Full Intensity',
		category: 'combo',
		description: 'All features at maximum. Use sparingly.',
		features: ['vibrate', 'rotate', 'linear'],
		intensity: 1.0,
		loop: true,
		rampUp: 300,
		rampDown: 1000,
	},
]

/** Look up a preset by key. */
export function getHapticPreset(key: string): HapticPreset | undefined {
	return HAPTIC_PRESETS.find(p => p.key === key)
}

/** Convert a preset into a session HapticPattern (assigns a unique ID). */
export function presetToPattern(preset: HapticPreset): HapticPattern {
	const { key, category, description, ...pattern } = preset
	return {
		...pattern,
		id: `${key}-${crypto.randomUUID().slice(0, 4)}`,
	}
}
