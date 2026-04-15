<script setup lang="ts">
import { computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import type { SceneConfig } from '@shared/types'
import SceneBehaviorPanel from './SceneBehaviorPanel.vue'
import SceneBinauralPanel from './SceneBinauralPanel.vue'
import SoundboardEventsPanel from './SoundboardEventsPanel.vue'
import HapticEventsPanel from './HapticEventsPanel.vue'
import { HAPTIC_PRESETS } from '@shared/constants/haptics'
import { BEHAVIOR_BY_TYPE } from './behaviorCatalog'
import { SOUNDBOARD_SAMPLES_KEY } from './soundboardSamplesKey'
import { inject } from 'vue'

const config = defineModel<SceneConfig>({ required: true })

const sessionSamples = inject(SOUNDBOARD_SAMPLES_KEY, computed(() => []))

// --- Feature state -----------------------------------------------------------

const behaviorCount = computed(() => config.value.behavior?.suggestions?.length ?? 0)
const behaviorSummary = computed(() => {
	const sugs = config.value.behavior?.suggestions
	if (!sugs || sugs.length === 0) return ''
	return sugs.map(s => BEHAVIOR_BY_TYPE[s.type]?.label ?? s.type).join(' + ')
})
const hasBinaural = computed(() => {
	const hz = config.value.audio?.binaural?.hertz
	return typeof hz === 'number' && Number.isFinite(hz)
})
const binauralHz = computed(() => {
	const hz = config.value.audio?.binaural?.hertz
	return typeof hz === 'number' && Number.isFinite(hz) ? hz : null
})
const soundboardCount = computed(() => config.value.audio?.soundboard?.length ?? 0)
const hapticCount = computed(() => config.value.haptics?.events?.length ?? 0)

// --- Summaries for row values ------------------------------------------------

const soundboardEventsList = computed(() => {
	const evts = config.value.audio?.soundboard
	if (!evts || evts.length === 0) return []
	return evts.map(e => {
		const sample = sessionSamples.value.find(s => s.id === e.id)
		const name = sample?.path
			? (sample.path.split('/').pop() ?? sample.id).replace(/\.[^.]+$/, '')
			: e.id
		return { event: e.event, name }
	})
})

const hapticEventsList = computed(() => {
	const evts = config.value.haptics?.events
	if (!evts || evts.length === 0) return []
	return evts.map(e => {
		const preset = HAPTIC_PRESETS.find(p => p.key === e.id)
		return { event: e.event, name: preset?.label ?? e.id }
	})
})
</script>

<template>
	<div class="flex flex-col gap-1">
		<!-- FX Soundboard row -->
		<VDropdown placement="bottom-start" :distance="4" theme="feature-bar">
			<button
				type="button"
				class="w-full flex items-start gap-2 px-2 py-1 rounded-md transition-colors text-left hover:bg-surface-tertiary/60">
				<svg class="shrink-0 mt-[2px]" :class="soundboardCount > 0 ? 'text-success w-3' : 'text-content-tertiary w-3'" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
					<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] mt-px" :class="soundboardCount > 0 ? 'text-success' : 'text-content-tertiary opacity-50'">FX Soundboard</span>
				<div v-if="soundboardCount > 0" class="flex-1 min-w-0 flex flex-col">
					<span v-for="(ev, i) in soundboardEventsList" :key="i"
						class="text-[11px] truncate"
						:class="ev.event === 'start' ? 'text-success' : 'text-danger'">{{ ev.event === 'start' ? '▶' : '■' }} {{ ev.name }}</span>
				</div>
			</button>
			<template #popper>
				<div class="bg-surface-secondary border border-edge-secondary rounded-xl shadow-theme-lg w-[360px] max-h-[80vh] overflow-y-auto">
					<div class="px-4 py-2.5 border-b border-edge text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
						FX Soundboard
					</div>
					<div class="p-4">
						<SoundboardEventsPanel v-model="config" />
					</div>
				</div>
			</template>
		</VDropdown>

		<!-- Haptics row -->
		<VDropdown placement="bottom-start" :distance="4" theme="feature-bar">
			<button
				type="button"
				class="w-full flex items-start gap-2 px-2 py-1 rounded-md transition-colors text-left hover:bg-surface-tertiary/60">
				<svg class="shrink-0 w-3 mt-[2px]" :class="hapticCount > 0 ? 'text-warning' : 'text-content-tertiary'" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 8v8" /><path d="M6 4v16" /><rect x="10" y="2" width="4" height="20" rx="1" /><path d="M18 4v16" /><path d="M22 8v8" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] mt-px" :class="hapticCount > 0 ? 'text-warning' : 'text-content-tertiary opacity-50'">Haptics</span>
				<div v-if="hapticCount > 0" class="flex-1 min-w-0 flex flex-col">
					<span v-for="(ev, i) in hapticEventsList" :key="i"
						class="text-[11px] truncate"
						:class="ev.event === 'start' ? 'text-success' : 'text-danger'">{{ ev.event === 'start' ? '▶' : '■' }} {{ ev.name }}</span>
				</div>
			</button>
			<template #popper>
				<div class="bg-surface-secondary border border-edge-secondary rounded-xl shadow-theme-lg w-[360px] max-h-[80vh] overflow-y-auto">
					<div class="px-4 py-2.5 border-b border-edge text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
						Haptics
					</div>
					<div class="p-4">
						<HapticEventsPanel v-model="config" />
					</div>
				</div>
			</template>
		</VDropdown>

		<!-- Binaural row -->
		<VDropdown placement="bottom-start" :distance="4" theme="feature-bar">
			<button
				type="button"
				class="w-full flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-left hover:bg-surface-tertiary/60">
				<svg class="shrink-0 w-3" :class="hasBinaural ? 'text-brand' : 'text-content-tertiary'" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 14v-3a9 9 0 0 1 18 0v3" />
					<path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" />
					<path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px]" :class="hasBinaural ? 'text-brand' : 'text-content-tertiary opacity-50'">Binaural</span>
				<span v-if="hasBinaural" class="flex-1 min-w-0 text-[11px] text-brand">
					{{ binauralHz }} Hz
				</span>
			</button>
			<template #popper>
				<div class="bg-surface-secondary border border-edge-secondary rounded-xl shadow-theme-lg w-[360px] max-h-[80vh] overflow-y-auto">
					<div class="px-4 py-2.5 border-b border-edge text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
						Binaural Override
					</div>
					<div class="p-4">
						<SceneBinauralPanel v-model="config" />
					</div>
				</div>
			</template>
		</VDropdown>

		<!-- Behaviors row -->
		<VDropdown placement="bottom-start" :distance="4" theme="feature-bar">
			<button
				type="button"
				class="w-full flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-left hover:bg-surface-tertiary/60">
				<svg class="shrink-0 w-3" :class="behaviorCount > 0 ? 'text-info' : 'text-content-tertiary'" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="8" r="5" />
					<path d="M20 21a8 8 0 0 0-16 0" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px]" :class="behaviorCount > 0 ? 'text-info' : 'text-content-tertiary opacity-50'">Behaviors</span>
				<span v-if="behaviorCount > 0" class="flex-1 min-w-0 text-[11px] text-info truncate">
					{{ behaviorSummary }}
				</span>
				<span
					v-if="behaviorCount > 0"
					class="shrink-0 text-[9px] bg-info/20 text-info rounded-full px-1.5 py-px font-semibold">
					{{ behaviorCount }}
				</span>
			</button>
			<template #popper>
				<div class="bg-surface-secondary border border-edge-secondary rounded-xl shadow-theme-lg w-[360px] max-h-[80vh] overflow-y-auto">
					<div class="px-4 py-2.5 border-b border-edge text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
						Behaviors
					</div>
					<div class="p-4">
						<SceneBehaviorPanel v-model="config" />
					</div>
				</div>
			</template>
		</VDropdown>
	</div>
</template>

<style>
/* Strip floating-vue's default theme for feature bar popovers */
.v-popper--theme-feature-bar .v-popper__inner {
	background: transparent;
	border: none;
	border-radius: 0;
	padding: 0;
	box-shadow: none;
}
.v-popper--theme-feature-bar .v-popper__arrow-container {
	display: none;
}
</style>
