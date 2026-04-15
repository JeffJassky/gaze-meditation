<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Session } from '@/api/sessions'
import type { HapticPattern, SessionHaptics } from '@shared/types'
import {
	HAPTIC_PRESETS,
	HAPTIC_PRESET_CATEGORIES,
	presetToPattern,
	type HapticPreset,
} from '@shared/constants/haptics'

const session = defineModel<Session>({ required: true })

const haptics = computed<SessionHaptics>({
	get: () => session.value.haptics ?? {},
	set: v => (session.value.haptics = v),
})

const patterns = computed<HapticPattern[]>({
	get: () => haptics.value.patterns ?? [],
	set: v => {
		session.value.haptics = { ...haptics.value, patterns: v.length > 0 ? v : undefined }
	},
})

const expandedIndex = ref<number | null>(null)
function toggleExpanded(i: number) {
	expandedIndex.value = expandedIndex.value === i ? null : i
}

// --- Preset picker -----------------------------------------------------------

const showPresetPicker = ref(false)

function presetsForCategory(cat: string): HapticPreset[] {
	return HAPTIC_PRESETS.filter(p => p.category === cat)
}

function addFromPreset(preset: HapticPreset) {
	const pattern = presetToPattern(preset)
	patterns.value = [...patterns.value, pattern]
	expandedIndex.value = patterns.value.length - 1
	showPresetPicker.value = false
}

function removePattern(index: number) {
	const next = patterns.value.slice()
	next.splice(index, 1)
	patterns.value = next
	if (expandedIndex.value === index) expandedIndex.value = null
	else if (expandedIndex.value !== null && expandedIndex.value > index) expandedIndex.value--
}

function updatePattern(index: number, patch: Partial<HapticPattern>) {
	const next = patterns.value.slice()
	const current = next[index]
	if (!current) return
	next[index] = { ...current, ...patch }
	patterns.value = next
}

// --- Behavior haptic responses -----------------------------------------------

function setBehaviorResponse(key: 'onBehaviorSuccess' | 'onBehaviorFail', patternId: string | null) {
	const next = { ...haptics.value }
	if (patternId) {
		next[key] = { patternId, duration: 500 }
	} else {
		delete next[key]
	}
	session.value.haptics = next
}

// --- Master intensity --------------------------------------------------------

function setMasterIntensity(v: string) {
	const n = Number(v)
	if (Number.isNaN(n)) return
	session.value.haptics = { ...haptics.value, masterIntensity: n }
}
</script>

<template>
	<div>
		<!-- Master Intensity -->
		<div class="mb-3">
			<div class="flex items-center justify-between mb-1">
				<span class="text-[10px] uppercase tracking-wider text-content-tertiary">Master Intensity</span>
				<span class="text-[10px] text-content-tertiary tabular-nums">{{ Math.round((haptics.masterIntensity ?? 1) * 100) }}%</span>
			</div>
			<input
				type="range"
				class="w-full h-1 rounded-full appearance-none cursor-pointer range-track"
				min="0" max="1" step="0.05"
				:value="haptics.masterIntensity ?? 1"
				@input="setMasterIntensity(($event.target as HTMLInputElement).value)" />
		</div>

		<!-- Patterns list -->
		<div v-if="patterns.length === 0 && !showPresetPicker" class="text-center py-3">
			<p class="text-[11px] text-content-tertiary mb-3 leading-relaxed">
				Add haptic patterns from the library. Scenes can start/stop these during playback.
			</p>
			<button
				type="button"
				class="text-xs text-content-secondary hover:text-content border border-edge-secondary hover:border-edge-secondary rounded-lg px-3 py-1.5 transition"
				@click="showPresetPicker = true">
				+ Add pattern
			</button>
		</div>

		<template v-else>
			<!-- Active patterns -->
			<div v-if="patterns.length > 0" class="space-y-px mb-2">
				<div
					v-for="(p, i) in patterns"
					:key="p.id"
					class="rounded-lg transition-colors overflow-hidden"
					:class="expandedIndex === i
						? 'bg-surface-secondary/80 ring-1 ring-edge'
						: 'hover:bg-surface-secondary/30'">
					<!-- Header -->
					<button
						type="button"
						class="w-full flex items-center gap-2 px-2 py-1.5 text-left"
						@click="toggleExpanded(i)">
						<span class="flex-1 min-w-0 text-[11px] text-content truncate">
							{{ p.label || `Pattern ${p.id}` }}
						</span>
						<span class="text-[10px] text-content-tertiary tabular-nums shrink-0">
							{{ Math.round(p.intensity * 100) }}%
						</span>
						<span class="text-[9px] text-content-tertiary tabular-nums shrink-0 min-w-[2rem] text-right">
							{{ p.loop ? 'on' : p.duration ? (p.duration >= 1000 ? (p.duration / 1000) + 's' : p.duration + 'ms') : '\u2014' }}
						</span>
						<svg
							width="10" height="10" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
							class="text-content-tertiary transition-transform duration-150 shrink-0"
							:class="expandedIndex === i ? 'rotate-180' : ''">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>

					<!-- Expanded — intensity/duration overrides + remove -->
					<div v-if="expandedIndex === i" class="px-2 pb-2 pt-1 space-y-2.5">
						<!-- Intensity -->
						<div>
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-[10px] text-content-tertiary">Intensity</span>
								<span class="text-[10px] text-content-tertiary tabular-nums">{{ Math.round(p.intensity * 100) }}%</span>
							</div>
							<input
								type="range"
								class="w-full h-1 rounded-full appearance-none cursor-pointer range-track"
								min="0" max="1" step="0.05"
								:value="p.intensity"
								@input="e => updatePattern(i, { intensity: Number((e.target as HTMLInputElement).value) })" />
						</div>

						<!-- Loop + Duration row -->
						<div class="flex items-center gap-2">
							<button
								type="button"
								class="shrink-0 text-[10px] px-2 py-1 rounded transition flex items-center gap-1"
								:class="p.loop
									? 'bg-info/15 text-info ring-1 ring-info/30'
									: 'bg-surface-tertiary/60 text-content-tertiary ring-1 ring-edge-secondary/40 hover:text-content-secondary'"
								@click="updatePattern(i, { loop: !p.loop })">
								{{ p.loop ? 'Loop' : 'One-shot' }}
							</button>
							<div class="flex items-center gap-1 flex-1">
								<span class="text-[9px] text-content-tertiary shrink-0">Duration</span>
								<input
									class="w-full bg-surface border border-edge rounded px-1.5 py-0.5 text-[10px] text-content-secondary tabular-nums focus:outline-none focus:border-edge-secondary transition text-center"
									type="number"
									min="0" step="100"
									placeholder="ms"
									:value="p.duration ?? ''"
									@input="e => updatePattern(i, { duration: Number((e.target as HTMLInputElement).value) || undefined })" />
							</div>
						</div>

						<!-- Features (read-only display) -->
						<div class="flex items-center gap-1.5">
							<span
								v-for="f in (p.features ?? ['vibrate'])"
								:key="f"
								class="text-[9px] px-1.5 py-0.5 rounded bg-surface-tertiary/60 text-content-tertiary ring-1 ring-edge-secondary/30 capitalize">
								{{ f }}
							</span>
						</div>

						<!-- Delete -->
						<div class="flex justify-end">
							<button
								type="button"
								class="text-[10px] text-content-tertiary hover:text-danger transition"
								@click="removePattern(i)">
								Remove
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Add pattern button -->
			<button
				v-if="!showPresetPicker"
				type="button"
				class="w-full text-[11px] text-content-tertiary hover:text-content-secondary py-1.5 transition text-center"
				@click="showPresetPicker = true">
				+ Add pattern
			</button>
		</template>

		<!-- Preset Picker Dropdown -->
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
			<div class="max-h-64 overflow-y-auto">
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
							<div class="text-[11px] text-content truncate">{{ preset.label }}</div>
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

		<!-- Behavior Responses -->
		<template v-if="patterns.length > 0">
			<div class="border-t border-edge pt-2.5 space-y-2">
				<span class="text-[10px] uppercase tracking-wider text-content-tertiary block">Behavior Responses</span>

				<!-- On Success -->
				<div class="flex items-center gap-2">
					<span class="text-[10px] text-content-secondary shrink-0 w-14">Success</span>
					<div class="relative flex-1 min-w-0">
						<div class="text-[11px] text-content-secondary truncate px-1.5 py-1 rounded bg-surface-secondary/60 border border-edge cursor-pointer hover:border-edge-secondary transition">
							{{ haptics.onBehaviorSuccess
								? (patterns.find(p => p.id === haptics.onBehaviorSuccess?.patternId)?.label ?? haptics.onBehaviorSuccess.patternId)
								: '(none)' }}
						</div>
						<select
							class="absolute inset-0 opacity-0 cursor-pointer w-full"
							:value="haptics.onBehaviorSuccess?.patternId ?? ''"
							@change="e => setBehaviorResponse('onBehaviorSuccess', (e.target as HTMLSelectElement).value || null)">
							<option value="">None</option>
							<option v-for="p in patterns" :key="p.id" :value="p.id">{{ p.label || p.id }}</option>
						</select>
					</div>
				</div>

				<!-- On Failure -->
				<div class="flex items-center gap-2">
					<span class="text-[10px] text-content-secondary shrink-0 w-14">Failure</span>
					<div class="relative flex-1 min-w-0">
						<div class="text-[11px] text-content-secondary truncate px-1.5 py-1 rounded bg-surface-secondary/60 border border-edge cursor-pointer hover:border-edge-secondary transition">
							{{ haptics.onBehaviorFail
								? (patterns.find(p => p.id === haptics.onBehaviorFail?.patternId)?.label ?? haptics.onBehaviorFail.patternId)
								: '(none)' }}
						</div>
						<select
							class="absolute inset-0 opacity-0 cursor-pointer w-full"
							:value="haptics.onBehaviorFail?.patternId ?? ''"
							@change="e => setBehaviorResponse('onBehaviorFail', (e.target as HTMLSelectElement).value || null)">
							<option value="">None</option>
							<option v-for="p in patterns" :key="p.id" :value="p.id">{{ p.label || p.id }}</option>
						</select>
					</div>
				</div>
			</div>
		</template>
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
