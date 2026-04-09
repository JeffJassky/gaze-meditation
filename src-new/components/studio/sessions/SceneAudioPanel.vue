<script setup lang="ts">
import { computed } from 'vue'
import { su } from '@new/components/ui/studioUi'
import type { SessionAsset } from '@/services/sessions'

const config = defineModel<Record<string, unknown>>({ required: true })
const props = defineProps<{ audioAssets: SessionAsset[] }>()

/**
 * Read-or-create an audio subobject. Returning a computed that always has
 * the nested shape lets the template bind to fields without guards.
 */
const audio = computed<Record<string, any>>({
	get: () => (config.value.audio as Record<string, any>) ?? {},
	set: (v) => (config.value.audio = v),
})

function ensure(path: string[]): Record<string, any> {
	let cur = audio.value as Record<string, any>
	for (const key of path) {
		if (!cur[key]) cur[key] = {}
		cur = cur[key]
	}
	// Writing back triggers reactivity when the root was empty.
	config.value.audio = audio.value
	return cur
}

function setBinauralHz(v: string) {
	const hz = Number(v)
	if (Number.isNaN(hz)) return
	ensure(['binaural']).hertz = hz
	config.value.audio = audio.value
}
function setBinauralVol(v: string) {
	const vol = Number(v)
	if (Number.isNaN(vol)) return
	ensure(['binaural']).volume = vol
	config.value.audio = audio.value
}
function setFxAsset(v: string) {
	const asset = props.audioAssets.find((a) => a.id === v)
	if (!asset) {
		delete audio.value.fx
	} else {
		// Write both `assetId` (the preferred reference going forward) and
		// `path` (the S3 key, still what the runtime reads to fetch the
		// file). Keeping both lets the editor survive key renames via the
		// stable id while the runtime remains unchanged.
		const fx = ensure(['fx'])
		fx.assetId = asset.id
		fx.path = asset.key
	}
	config.value.audio = audio.value
}
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

const binaural = computed(() => (audio.value.binaural as Record<string, any>) ?? {})
const fx = computed(() => (audio.value.fx as Record<string, any>) ?? {})

const fxAssetId = computed({
	get: () => {
		// Prefer the explicit assetId if present (new data), else resolve by
		// matching the stored path against an asset's key (legacy data).
		const storedId = fx.value.assetId as string | undefined
		if (storedId) {
			const match = props.audioAssets.find((a) => a.id === storedId)
			if (match) return match.id
		}
		const path = fx.value.path as string | undefined
		if (path) {
			return props.audioAssets.find((a) => a.key === path)?.id ?? ''
		}
		return ''
	},
	set: (v) => setFxAsset(v),
})
</script>

<template>
	<div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label :class="su.label">Binaural Hz</label>
				<input
					:class="su.input"
					type="number"
					step="0.1"
					:value="binaural.hertz ?? ''"
					placeholder="6"
					@input="(e) => setBinauralHz((e.target as HTMLInputElement).value)" />
			</div>
			<div>
				<label :class="su.label">Binaural volume (0–1)</label>
				<input
					:class="su.input"
					type="number"
					step="0.05"
					min="0"
					max="1"
					:value="binaural.volume ?? ''"
					placeholder="0.5"
					@input="(e) => setBinauralVol((e.target as HTMLInputElement).value)" />
			</div>

			<div class="md:col-span-2">
				<label :class="su.label">FX audio</label>
				<select v-model="fxAssetId" :class="su.select">
					<option value="">— none —</option>
					<option v-for="a in audioAssets" :key="a.id" :value="a.id">
						{{ a.label || a.key }}
					</option>
				</select>
			</div>

			<template v-if="fx.path">
				<div>
					<label :class="su.label">FX volume (0–1)</label>
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
							class="w-4 h-4 accent-zinc-200"
							:checked="!!fx.loop"
							@change="(e) => setFxLoop((e.target as HTMLInputElement).checked)" />
						<span class="text-sm text-zinc-300">Loop</span>
					</label>
				</div>
			</template>
		</div>
	</div>
</template>
