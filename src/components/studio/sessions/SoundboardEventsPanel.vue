<script setup lang="ts">
import { computed, inject } from 'vue'
import type { SceneConfig, SceneAudioConfig, SoundboardEvent } from '@shared/types'
import { SOUNDBOARD_SAMPLES_KEY } from './soundboardSamplesKey'

const config = defineModel<SceneConfig>({ required: true })
const sessionSamples = inject(SOUNDBOARD_SAMPLES_KEY, computed(() => []))

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

function addEvent() {
	const firstSample = sessionSamples.value[0]
	events.value = [
		...events.value,
		{ event: 'start', id: firstSample?.id ?? '' },
	]
}

function removeEvent(index: number) {
	const next = events.value.slice()
	next.splice(index, 1)
	events.value = next
}

function updateEvent(index: number, patch: Partial<SoundboardEvent>) {
	const next = events.value.slice()
	const current = next[index]
	if (!current) return
	next[index] = { ...current, ...patch }
	events.value = next
}

/** Get display name for a sample by its internal ID. */
function sampleDisplayName(id: string): string {
	const s = sessionSamples.value.find((s) => s.id === id)
	if (!s) return id || '(none)'
	if (!s.path) return '(no file)'
	const segments = s.path.split('/')
	return (segments[segments.length - 1] ?? s.path).replace(/\.[^.]+$/, '')
}
</script>

<template>
	<div>
		<div v-if="sessionSamples.length === 0" class="text-[11px] text-zinc-500 leading-relaxed">
			No samples defined yet. Add samples in the Settings panel's Soundboard section.
		</div>

		<template v-else>
			<div v-if="events.length === 0" class="text-[11px] text-zinc-500 mb-2">
				No events on this scene.
			</div>

			<div v-else class="space-y-1 mb-2">
				<div
					v-for="(ev, i) in events"
					:key="i"
					class="flex items-center gap-1.5 group">
					<!-- Start/Stop toggle -->
					<button
						type="button"
						class="shrink-0 text-[10px] font-semibold uppercase w-10 text-center py-0.5 rounded transition"
						:class="ev.event === 'start'
							? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
							: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'"
						v-tooltip="ev.event === 'start' ? 'Start playing this sample' : 'Stop this sample'"
						@click="updateEvent(i, { event: ev.event === 'start' ? 'stop' : 'start' })">
						{{ ev.event === 'start' ? '&#9654;' : '&#9632;' }}
					</button>

					<!-- Sample selector (shows filename) -->
					<div class="relative flex-1 min-w-0" v-tooltip="'Choose which sample to trigger'">
						<div class="text-[11px] text-zinc-300 truncate px-1.5 py-1 rounded bg-zinc-900/60 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
							{{ sampleDisplayName(ev.id) }}
						</div>
						<select
							class="absolute inset-0 opacity-0 cursor-pointer w-full"
							:value="ev.id"
							@change="(e) => updateEvent(i, { id: (e.target as HTMLSelectElement).value })">
							<option
								v-for="s in sessionSamples"
								:key="s.id"
								:value="s.id">
								{{ sampleDisplayName(s.id) }}{{ s.loop ? ' (loop)' : '' }}
							</option>
						</select>
					</div>

					<!-- Remove -->
					<button
						type="button"
						class="shrink-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-sm leading-none"
						@click="removeEvent(i)">
						&times;
					</button>
				</div>
			</div>

			<button
				type="button"
				class="w-full text-[11px] text-zinc-600 hover:text-zinc-300 py-1 transition text-center"
				v-tooltip="'Start or stop a soundboard sample at this scene'"
				@click="addEvent">
				+ Add event
			</button>
		</template>
	</div>
</template>
