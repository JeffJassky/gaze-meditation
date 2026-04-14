<script setup lang="ts">
import { computed } from 'vue'
import type { SceneConfig, SceneAudioConfig } from '@shared/types'

const config = defineModel<SceneConfig>({ required: true })

const audio = computed<SceneAudioConfig>({
	get: () => config.value.audio ?? {},
	set: (v) => (config.value.audio = v),
})

function ensure(path: string[]): Record<string, any> {
	let cur = audio.value as Record<string, any>
	for (const key of path) {
		if (!cur[key]) cur[key] = {}
		cur = cur[key]
	}
	config.value.audio = audio.value
	return cur
}

const binaural = computed(() => (audio.value.binaural as Record<string, any>) ?? {})
const hasHz = computed(() => typeof binaural.value.hertz === 'number')

function setBinauralHz(v: string) {
	const hz = Number(v)
	if (Number.isNaN(hz)) return
	ensure(['binaural']).hertz = hz
	config.value.audio = audio.value
}

function clearHz() {
	if (audio.value.binaural) {
		delete (audio.value.binaural as any).hertz
		// Clean up empty binaural object
		if (Object.keys(audio.value.binaural).length === 0) {
			delete (audio.value as any).binaural
		}
		config.value.audio = { ...audio.value }
	}
}
</script>

<template>
	<div>
		<div class="flex items-center justify-between mb-2">
			<label class="text-[10px] uppercase tracking-wider text-content-tertiary">Frequency</label>
			<span
				v-if="hasHz"
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-[10px] tabular-nums leading-tight">
				<svg
					width="10" height="10" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 14v-3a9 9 0 0 1 18 0v3" />
					<path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" />
					<path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" />
				</svg>
				{{ binaural.hertz }} Hz
				<button
					type="button"
					class="text-brand hover:text-brand transition ml-0.5"
					v-tooltip="'Reset to session default'"
					@click.stop="clearHz">
					&times;
				</button>
			</span>
			<span v-else class="text-[10px] text-content-tertiary">default</span>
		</div>
		<input
			type="range"
			class="w-full h-1 rounded-full appearance-none cursor-pointer binaural-slider"
			min="2" max="18" step="0.5"
			:value="binaural.hertz ?? 6"
			@input="(e) => setBinauralHz((e.target as HTMLInputElement).value)" />
	</div>
</template>

<style scoped>
.binaural-slider { background: #3f3f46; }
.binaural-slider::-webkit-slider-thumb {
	-webkit-appearance: none; width: 10px; height: 10px;
	border-radius: 50%; background: #a1a1aa; cursor: pointer; border: none;
}
.binaural-slider::-moz-range-thumb {
	width: 10px; height: 10px;
	border-radius: 50%; background: #a1a1aa; cursor: pointer; border: none;
}
</style>
