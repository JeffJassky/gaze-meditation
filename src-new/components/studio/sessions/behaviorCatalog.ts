/**
 * Catalog of known behavior types and their configurable options.
 *
 * The scene editor uses this registry to:
 *   1. Render a grouped dropdown of available behaviors
 *   2. Show a human-friendly form for each behavior's options
 *      (no raw JSON)
 *   3. Seed sensible defaults when a new behavior is selected
 *
 * Adding a new behavior is a matter of appending an entry here — the
 * editor UI picks it up automatically.
 */

export type BehaviorFieldType = 'number' | 'text' | 'longText' | 'select'

export interface BehaviorOptionField {
	/** Key inside the suggestion's `options` object. */
	key: string
	/** Human-readable label shown next to the field. */
	label: string
	type: BehaviorFieldType
	/** Optional helper text rendered under the field. */
	help?: string
	/** Default value used when a user first picks this behavior. */
	default?: string | number
	/** For `number` fields. */
	min?: number
	max?: number
	step?: number
	/** For `select` fields. */
	choices?: { value: string; label: string }[]
}

export interface BehaviorDefinition {
	type: string
	label: string
	category: 'Head' | 'Eyes' | 'Mouth' | 'Body' | 'Input'
	description: string
	/** Config fields specific to this behavior (in addition to duration/failBehavor). */
	fields: BehaviorOptionField[]
}

/**
 * Common "tolerance" field shape used by several behaviors, factored out so
 * tweaks apply consistently.
 */
const toleranceField: BehaviorOptionField = {
	key: 'tolerance',
	label: 'Tolerance',
	type: 'number',
	help: 'How much drift before the behavior fails. Lower is stricter.',
	default: 0.05,
	min: 0,
	max: 1,
	step: 0.01,
}

const thresholdField = (
	defaultValue: number,
	label = 'Detection threshold',
	help = 'Score required before the behavior is considered active. Higher is stricter.',
): BehaviorOptionField => ({
	key: 'threshold',
	label,
	type: 'number',
	help,
	default: defaultValue,
	min: 0,
	max: 1,
	step: 0.01,
})

export const BEHAVIOR_CATALOG: BehaviorDefinition[] = [
	// --- Head ---
	{
		type: 'head:still',
		label: 'Hold head still',
		category: 'Head',
		description: 'User must keep their head motionless for the duration.',
		fields: [toleranceField],
	},
	{
		type: 'head:nod',
		label: 'Nod head',
		category: 'Head',
		description: 'Detects a nodding motion.',
		fields: [
			{
				key: 'type',
				label: 'Nod direction',
				type: 'select',
				help: 'YES = up/down, NO = side to side.',
				default: 'YES',
				choices: [
					{ value: 'YES', label: 'YES (up / down)' },
					{ value: 'NO', label: 'NO (left / right)' },
				],
			},
		],
	},
	{ type: 'head:left', label: 'Look left', category: 'Head', description: 'Gaze to the left.', fields: [] },
	{ type: 'head:right', label: 'Look right', category: 'Head', description: 'Gaze to the right.', fields: [] },
	{ type: 'head:up', label: 'Look up', category: 'Head', description: 'Gaze upward.', fields: [] },
	{ type: 'head:down', label: 'Look down', category: 'Head', description: 'Gaze downward.', fields: [] },

	// --- Eyes ---
	{
		type: 'eyes:close',
		label: 'Close eyes',
		category: 'Eyes',
		description: 'User must keep their eyes closed.',
		fields: [thresholdField(0.2, 'Closed threshold', 'Eye openness below this counts as closed.')],
	},
	{
		type: 'eyes:open',
		label: 'Keep eyes open',
		category: 'Eyes',
		description: 'User must keep their eyes open.',
		fields: [thresholdField(0.4, 'Open threshold', 'Eye openness above this counts as open.')],
	},
	{
		type: 'eyes:blink',
		label: 'Blink',
		category: 'Eyes',
		description: 'Detects a blink.',
		fields: [],
	},
	{
		type: 'eyes:no-blink',
		label: "Don't blink",
		category: 'Eyes',
		description: 'User must avoid blinking for the duration.',
		fields: [],
	},

	// --- Mouth ---
	{
		type: 'mouth:relax',
		label: 'Relax jaw',
		category: 'Mouth',
		description: 'Detects relaxed / slightly open jaw.',
		fields: [thresholdField(0.15, 'Openness threshold', 'Jaw openness required to count as relaxed.')],
	},
	{
		type: 'tongue:out',
		label: 'Stick tongue out',
		category: 'Mouth',
		description: 'Detects tongue protruding.',
		fields: [thresholdField(0.15)],
	},

	// --- Body / motion ---
	{
		type: 'motion:move',
		label: 'Move',
		category: 'Body',
		description: 'Any accelerometer motion satisfies the condition.',
		fields: [],
	},
	{
		type: 'motion:impact',
		label: 'Impact / strike',
		category: 'Body',
		description: 'Counts physical impacts (taps) via accelerometer.',
		fields: [
			{
				key: 'impacts',
				label: 'Impacts required',
				type: 'number',
				default: 1,
				min: 1,
				max: 100,
				step: 1,
			},
			{
				key: 'display',
				label: 'Progress display',
				type: 'select',
				default: 'progress',
				choices: [
					{ value: 'none', label: 'None' },
					{ value: 'progress', label: 'Progress bar' },
					{ value: 'dots', label: 'Dots' },
				],
			},
		],
	},

	// --- Input ---
	{
		type: 'button:click',
		label: 'Click button',
		category: 'Input',
		description: 'Waits for the user to click the on-screen button.',
		fields: [],
	},
	{
		type: 'speech:speak',
		label: 'Speak phrase',
		category: 'Input',
		description: "Detects the user speaking the target phrase.",
		fields: [
			{
				key: 'targetValue',
				label: 'Target phrase',
				type: 'text',
				help: 'The words the user must say. Case-insensitive.',
				default: '',
			},
		],
	},
	{
		type: 'form:submit',
		label: 'Submit form',
		category: 'Input',
		description: 'Waits for form submission. Configure fields on the scene.',
		fields: [],
	},
]

/** Map for O(1) lookup by type string. */
export const BEHAVIOR_BY_TYPE: Record<string, BehaviorDefinition> = Object.fromEntries(
	BEHAVIOR_CATALOG.map((b) => [b.type, b]),
)

/** Group the catalog by category for the dropdown's <optgroup>s. */
export function groupedBehaviors(): Record<string, BehaviorDefinition[]> {
	const groups: Record<string, BehaviorDefinition[]> = {}
	for (const b of BEHAVIOR_CATALOG) {
		if (!groups[b.category]) groups[b.category] = []
		groups[b.category]!.push(b)
	}
	return groups
}

/**
 * Produce the default options object for a given behavior type, using each
 * field's declared default. Unknown types return {}.
 */
export function defaultOptionsFor(type: string): Record<string, unknown> {
	const def = BEHAVIOR_BY_TYPE[type]
	if (!def) return {}
	const out: Record<string, unknown> = {}
	for (const f of def.fields) {
		if (f.default !== undefined) out[f.key] = f.default
	}
	return out
}
