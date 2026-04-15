<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { SceneConfig, SceneAudioConfig, SoundboardEvent } from '@shared/types'
import { SOUNDBOARD_SAMPLES_KEY } from './soundboardSamplesKey'
import { SCENE_CONTEXT_KEY } from './sceneContextKey'

const config = defineModel<SceneConfig>({ required: true })
const sessionSamples = inject(SOUNDBOARD_SAMPLES_KEY, computed(() => []))
const sceneCtx = inject(SCENE_CONTEXT_KEY, undefined)

const audio = computed<SceneAudioConfig>({
	get: () => config.value.audio ?? {},
	set: (v) => (config.value.audio = v),
})

const events = computed<SoundboardEvent[]>({
	get: () => audio.value.soundboard ?? [],
	set: (v) => {
		config.value.audio = { ...audio.value, soundboard: v.length > 0 ? v : undefined }
	},
})

// --- Helpers -----------------------------------------------------------------

function isLoopSample(id: string): boolean {
	return sessionSamples.value.find(s => s.id === id)?.loop === true
}

function sampleDisplayName(id: string): string {
	const s = sessionSamples.value.find(s => s.id === id)
	if (!s) return id || '(none)'
	if (!s.path) return '(no file)'
	const segments = s.path.split('/')
	return (segments[segments.length - 1] ?? s.path).replace(/\.[^.]+$/, '')
}

function eventLabel(ev: SoundboardEvent): string {
	const name = sampleDisplayName(ev.id)
	if (!isLoopSample(ev.id)) return `Once \u2014 ${name}`
	return ev.event === 'start' ? `Start \u2014 ${name}` : `Stop \u2014 ${name}`
}

// --- Event management --------------------------------------------------------

function addEvent(sampleId: string, eventType: 'start' | 'stop' = 'start') {
	events.value = [...events.value, { event: eventType, id: sampleId }]
}

function removeEvent(index: number) {
	const next = events.value.slice()
	next.splice(index, 1)
	events.value = next
}

function toggleEvent(index: number) {
	const ev = events.value[index]
	if (!ev || !isLoopSample(ev.id)) return
	const next = events.value.slice()
	next[index] = { ...ev, event: ev.event === 'start' ? 'stop' : 'start' }
	events.value = next
}

// --- Active loops from prior scenes (NLE scan) -------------------------------

const activeLoops = computed<string[]>(() => {
	if (!sceneCtx) return []
	const idx = sceneCtx.selectedIndex.value
	const scenes = sceneCtx.scenes.value
	const active = new Set<string>()
	for (let i = 0; i < idx; i++) {
		const evts = scenes[i]?.config?.audio?.soundboard
		if (!evts) continue
		for (const e of evts) {
			if (!isLoopSample(e.id)) continue
			if (e.event === 'start') active.add(e.id)
			else if (e.event === 'stop') active.delete(e.id)
		}
	}
	return Array.from(active)
})

// --- Sample picker -----------------------------------------------------------

const showPicker = ref(false)

function sampleVolume(id: string): string {
	const s = sessionSamples.value.find(s => s.id === id)
	if (!s || s.volume === undefined || s.volume === 1) return ''
	return `${Math.round(s.volume * 100)}%`
}
</script>

<template>
	<div>
		<div v-if="sessionSamples.length === 0" class="text-[11px] text-content-tertiary leading-relaxed">
			No samples defined yet. Add samples in the Settings panel's Soundboard section.
		</div>

		<template v-else>
			<div v-if="events.length === 0" class="text-[11px] text-content-tertiary mb-2">
				No soundboard events on this scene.
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
					<!-- Speaker icon -->
					<svg
						class="shrink-0"
						:class="ev.event === 'stop' ? 'text-danger' : 'text-success'"
						width="12" height="12" viewBox="0 0 24 24" fill="none"
						stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
						aria-hidden="true">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
					</svg>

					<!-- Label (clickable to toggle start/stop for loops) -->
					<button
						v-if="isLoopSample(ev.id)"
						type="button"
						class="flex-1 min-w-0 text-left text-[11px] text-content-secondary truncate hover:text-content transition"
						@click="toggleEvent(i)">
						{{ eventLabel(ev) }}
					</button>
					<span v-else class="flex-1 min-w-0 text-[11px] text-content-secondary truncate">
						{{ eventLabel(ev) }}
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
			<div v-if="!showPicker" class="flex items-center gap-1.5">
				<button
					type="button"
					class="flex-1 text-[11px] text-content-tertiary hover:text-content-secondary py-1 transition text-center"
					@click="showPicker = true">
					+ Add
				</button>
				<div v-if="activeLoops.length > 0" class="relative flex-1">
					<button
						type="button"
						class="w-full text-[11px] text-content-tertiary hover:text-content-secondary py-1 transition text-center">
						+ Stop
					</button>
					<select
						class="absolute inset-0 opacity-0 cursor-pointer w-full"
						value=""
						@change="(e) => { const v = (e.target as HTMLSelectElement).value; if (v) addEvent(v, 'stop'); (e.target as HTMLSelectElement).value = '' }">
						<option value="" disabled>Stop a sample...</option>
						<option
							v-for="key in activeLoops"
							:key="key"
							:value="key">
							{{ sampleDisplayName(key) }}
						</option>
					</select>
				</div>
			</div>

			<!-- Sample Picker -->
			<div v-if="showPicker" class="rounded-lg border border-edge bg-surface-secondary/80 overflow-hidden mb-2">
				<div class="flex items-center justify-between px-2 py-1.5 border-b border-edge">
					<span class="text-[10px] uppercase tracking-wider text-content-tertiary">Choose a sample</span>
					<button
						type="button"
						class="text-content-tertiary hover:text-content text-sm leading-none"
						@click="showPicker = false">
						&times;
					</button>
				</div>
				<div class="max-h-48 overflow-y-auto">
					<button
						v-for="s in sessionSamples"
						:key="s.id"
						type="button"
						class="w-full text-left px-2 py-1.5 hover:bg-surface-tertiary/60 transition flex items-center gap-2"
						@click="addEvent(s.id); showPicker = false">
						<div class="flex-1 min-w-0">
							<div class="text-[11px] text-content truncate">
								{{ s.loop ? 'Start' : 'Once' }} — {{ sampleDisplayName(s.id) }}
							</div>
							<div class="text-[9px] text-content-tertiary truncate">
								{{ s.loop ? 'Loops until stopped' : 'Plays once' }}
								<template v-if="sampleVolume(s.id)"> · Vol {{ sampleVolume(s.id) }}</template>
								<template v-if="s.fadeInDuration"> · {{ s.fadeInDuration }}s fade in</template>
							</div>
						</div>
						<span class="text-[9px] text-content-tertiary tabular-nums shrink-0 min-w-[2rem] text-right">
							{{ s.loop ? 'on' : '\u2014' }}
						</span>
					</button>
				</div>
			</div>
		</template>
	</div>
</template>
