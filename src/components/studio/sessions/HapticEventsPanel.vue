<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { SceneConfig, SceneHapticsConfig, HapticEvent } from '@shared/types'
import {
	HAPTIC_PRESETS,
	HAPTIC_PRESET_CATEGORIES,
	type HapticPreset,
} from '@shared/constants/haptics'
import { SCENE_CONTEXT_KEY } from './sceneContextKey'

const config = defineModel<SceneConfig>({ required: true })

const haptics = computed<SceneHapticsConfig>({
	get: () => config.value.haptics ?? {},
	set: (v) => (config.value.haptics = v),
})

const events = computed<HapticEvent[]>({
	get: () => haptics.value.events ?? [],
	set: (v) => {
		config.value.haptics = { ...haptics.value, events: v.length > 0 ? v : undefined }
	},
})

// --- Helpers -----------------------------------------------------------------

function getPreset(key: string): HapticPreset | undefined {
	return HAPTIC_PRESETS.find(p => p.key === key)
}

function isLoopPreset(key: string): boolean {
	return getPreset(key)?.loop === true
}

/** Human-readable label for an event row. */
function eventLabel(ev: HapticEvent): string {
	const preset = getPreset(ev.id)
	const name = preset?.label ?? ev.id
	if (!preset?.loop) return `Once \u2014 ${name}`
	return ev.event === 'start' ? `Start \u2014 ${name}` : `Stop \u2014 ${name}`
}

function eventDuration(key: string): string {
	const p = getPreset(key)
	if (!p) return ''
	if (p.loop) return ''
	if (p.duration) return p.duration >= 1000 ? (p.duration / 1000) + 's' : p.duration + 'ms'
	return ''
}

// --- Preset picker -----------------------------------------------------------

const showPresetPicker = ref(false)

function presetsForCategory(cat: string): HapticPreset[] {
	return HAPTIC_PRESETS.filter(p => p.category === cat)
}

/**
 * Add a haptic event from a preset.
 * - Looping presets → 'start' event (user adds 'stop' on a later scene)
 * - One-shot presets → 'start' event (fires once, no stop needed)
 */
function addFromPreset(preset: HapticPreset) {
	events.value = [
		...events.value,
		{ event: 'start', id: preset.key },
	]
	showPresetPicker.value = false
}

/** Add a stop event for a continuous preset already started elsewhere. */
function addStopFor(key: string) {
	events.value = [
		...events.value,
		{ event: 'stop', id: key },
	]
}

function removeEvent(index: number) {
	const next = events.value.slice()
	next.splice(index, 1)
	events.value = next
}

/** Toggle a continuous event between start/stop. */
function toggleEvent(index: number) {
	const ev = events.value[index]
	if (!ev || !isLoopPreset(ev.id)) return
	const next = events.value.slice()
	next[index] = { ...ev, event: ev.event === 'start' ? 'stop' : 'start' }
	events.value = next
}

// --- Active continuous patterns (scan prior scenes for NLE state) ------------

const sceneCtx = inject(SCENE_CONTEXT_KEY, undefined)

/**
 * Looping preset keys that are currently "on" — started in a prior scene
 * and not yet stopped. Only these are offered in the "Stop" dropdown.
 */
const activeLoops = computed<string[]>(() => {
	if (!sceneCtx) return []
	const idx = sceneCtx.selectedIndex.value
	const scenes = sceneCtx.scenes.value
	const active = new Set<string>()
	for (let i = 0; i < idx; i++) {
		const evts = scenes[i]?.config?.haptics?.events
		if (!evts) continue
		for (const e of evts) {
			if (!isLoopPreset(e.id)) continue
			if (e.event === 'start') active.add(e.id)
			else if (e.event === 'stop') active.delete(e.id)
		}
	}
	return Array.from(active)
})

// --- Intensity Override -------------------------------------------------------

function setIntensityOverride(v: string) {
	const n = Number(v)
	if (Number.isNaN(n)) return
	config.value.haptics = { ...haptics.value, intensityOverride: n }
}

function clearIntensityOverride() {
	const next = { ...haptics.value }
	delete next.intensityOverride
	config.value.haptics = next
}

const hasOverride = computed(() => haptics.value.intensityOverride !== undefined)
</script>

<template>
	<div>
		<div v-if="events.length === 0 && !showPresetPicker" class="text-[11px] text-content-tertiary mb-2">
			No haptic events on this scene.
		</div>

		<!-- Event list -->
		<div v-if="events.length > 0" class="space-y-1 mb-2">
			<div
				v-for="(ev, i) in events"
				:key="i"
				class="flex items-center gap-1.5 group px-1.5 py-1 rounded-md transition"
				:class="ev.event === 'stop'
					? 'bg-danger/10'
					: 'bg-success/10'">
				<!-- Vibration icon -->
				<svg
					class="shrink-0"
					:class="ev.event === 'stop' ? 'text-danger' : 'text-success'"
					width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
					aria-hidden="true">
					<path d="M2 8v8"/><path d="M6 4v16"/><rect x="10" y="2" width="4" height="20" rx="1"/><path d="M18 4v16"/><path d="M22 8v8"/>
				</svg>

				<!-- Label (clickable to toggle start/stop for continuous) -->
				<button
					v-if="isLoopPreset(ev.id)"
					type="button"
					class="flex-1 min-w-0 text-left text-[11px] text-content-secondary truncate hover:text-content transition"
					@click="toggleEvent(i)">
					{{ eventLabel(ev) }}
				</button>
				<span v-else class="flex-1 min-w-0 text-[11px] text-content-secondary truncate">
					{{ eventLabel(ev) }}
				</span>

				<!-- Duration badge for one-shots -->
				<span
					v-if="eventDuration(ev.id)"
					class="text-[9px] text-content-tertiary tabular-nums shrink-0">
					{{ eventDuration(ev.id) }}
				</span>

				<!-- Remove -->
				<button
					type="button"
					class="shrink-0 text-content-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition text-sm leading-none"
					@click="removeEvent(i)">
					&times;
				</button>
			</div>
		</div>

		<!-- Add buttons -->
		<div v-if="!showPresetPicker" class="flex items-center gap-1.5">
			<button
				type="button"
				class="flex-1 text-[11px] text-content-tertiary hover:text-content-secondary py-1 transition text-center"
				@click="showPresetPicker = true">
				+ Add
			</button>
			<!-- Quick-stop for patterns actively running from prior scenes -->
			<div v-if="activeLoops.length > 0" class="relative flex-1">
				<button
					type="button"
					class="w-full text-[11px] text-content-tertiary hover:text-content-secondary py-1 transition text-center">
					+ Stop
				</button>
				<select
					class="absolute inset-0 opacity-0 cursor-pointer w-full"
					value=""
					@change="(e) => { const v = (e.target as HTMLSelectElement).value; if (v) addStopFor(v); (e.target as HTMLSelectElement).value = '' }">
					<option value="" disabled>Stop a pattern...</option>
					<option
						v-for="key in activeLoops"
						:key="key"
						:value="key">
						{{ getPreset(key)?.label ?? key }}
					</option>
				</select>
			</div>
		</div>

		<!-- Preset Picker -->
		<div v-if="showPresetPicker" class="rounded-lg border border-edge bg-surface-secondary/80 overflow-hidden mb-2">
			<div class="flex items-center justify-between px-2 py-1.5 border-b border-edge">
				<span class="text-[10px] uppercase tracking-wider text-content-tertiary">Choose a pattern</span>
				<button
					type="button"
					class="text-content-tertiary hover:text-content text-sm leading-none"
					@click="showPresetPicker = false">
					&times;
				</button>
			</div>
			<div class="max-h-48 overflow-y-auto">
				<template v-for="cat in HAPTIC_PRESET_CATEGORIES" :key="cat.key">
					<div
						v-if="presetsForCategory(cat.key).length > 0"
						class="px-2 pt-2 pb-1">
						<span class="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">{{ cat.label }}</span>
					</div>
					<button
						v-for="preset in presetsForCategory(cat.key)"
						:key="preset.key"
						type="button"
						class="w-full text-left px-2 py-1.5 hover:bg-surface-tertiary/60 transition flex items-center gap-2"
						@click="addFromPreset(preset)">
						<div class="flex-1 min-w-0">
							<div class="text-[11px] text-content truncate">
								{{ preset.loop ? 'Start' : 'Once' }} — {{ preset.label }}
							</div>
							<div class="text-[9px] text-content-tertiary truncate">{{ preset.description }}</div>
						</div>
						<span class="text-[10px] text-content-tertiary tabular-nums shrink-0">
							{{ Math.round(preset.intensity * 100) }}%
						</span>
						<span class="text-[9px] text-content-tertiary tabular-nums shrink-0 min-w-[2rem] text-right">
							{{ preset.loop ? 'on' : preset.duration ? (preset.duration >= 1000 ? (preset.duration / 1000) + 's' : preset.duration + 'ms') : '\u2014' }}
						</span>
					</button>
				</template>
			</div>
		</div>

		<!-- Intensity Override -->
		<div v-if="events.length > 0" class="border-t border-edge pt-2 mt-2">
			<div class="flex items-center gap-2 mb-1">
				<label class="flex items-center gap-1.5 text-[10px] text-content-secondary">
					<input
						type="checkbox"
						class="accent-content-secondary"
						:checked="hasOverride"
						@change="e => {
							if ((e.target as HTMLInputElement).checked) setIntensityOverride('0.5')
							else clearIntensityOverride()
						}" />
					Intensity override
				</label>
				<span v-if="hasOverride" class="text-[10px] text-content-tertiary tabular-nums ml-auto">
					{{ Math.round((haptics.intensityOverride ?? 1) * 100) }}%
				</span>
			</div>
			<input
				v-if="hasOverride"
				type="range"
				class="w-full h-1 rounded-full appearance-none cursor-pointer range-track"
				min="0" max="1" step="0.05"
				:value="haptics.intensityOverride ?? 1"
				@input="setIntensityOverride(($event.target as HTMLInputElement).value)" />
		</div>
	</div>
</template>

<style scoped>
.range-track {
	background: linear-gradient(to right, #3f3f46, #3f3f46);
}
.range-track::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #a1a1aa;
	cursor: pointer;
	border: none;
}
.range-track::-moz-range-thumb {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #a1a1aa;
	cursor: pointer;
	border: none;
}
</style>
