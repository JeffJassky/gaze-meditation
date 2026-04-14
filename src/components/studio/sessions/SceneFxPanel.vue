<script setup lang="ts">
import { computed } from 'vue'
import { su } from '@/components/ui/studioUi'
import type { SceneConfig, SceneAudioConfig } from '@shared/types'
import AssetPicker from './AssetPicker.vue'

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

const fx = computed(() => (audio.value.fx as Record<string, any>) ?? {})

function setFxVolume(v: string) {
	const vol = Number(v)
	if (Number.isNaN(vol)) return
	ensure(['fx']).volume = vol
	config.value.audio = audio.value
}
function setFxLoop(v: boolean) {
	ensure(['fx']).loop = v
	config.value.audio = audio.value
}

const fxKey = computed({
	get: () => (fx.value.path as string) ?? null,
	set: (v: string | null) => {
		if (!v) {
			delete audio.value.fx
			config.value.audio = audio.value
		} else {
			config.value.audio = { ...audio.value, fx: { path: v } }
		}
	},
})
</script>

<template>
	<div class="space-y-3">
		<AssetPicker
			v-model="fxKey"
			kind="fx"
			placeholder="None" />

		<template v-if="fx.path">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label :class="su.label">Volume (0-1)</label>
					<input
						:class="su.input"
						type="number"
						step="0.05"
						min="0"
						max="1"
						:value="fx.volume ?? ''"
						@input="(e) => setFxVolume((e.target as HTMLInputElement).value)" />
				</div>
				<div class="flex items-end">
					<label class="flex items-center gap-2 pb-2">
						<input
							type="checkbox"
							class="w-4 h-4 accent-content-secondary"
							:checked="!!fx.loop"
							@change="(e) => setFxLoop((e.target as HTMLInputElement).checked)" />
						<span class="text-sm text-content-secondary">Loop</span>
					</label>
				</div>
			</div>
		</template>
	</div>
</template>
