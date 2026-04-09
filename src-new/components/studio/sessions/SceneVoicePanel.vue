<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { su } from '@new/components/ui/studioUi'
import { VOICES_KEY } from './voicesKey'

/**
 * Per-scene ElevenLabs voice override. Reads the voice catalog from the
 * VOICES_KEY context the editor view provides on mount. Auditioning a voice
 * uses the catalog's `preview_url` — there is no live TTS endpoint yet.
 */
const config = defineModel<Record<string, unknown>>({ required: true })
const voicesCtx = inject(VOICES_KEY)

const voiceId = computed<string | undefined>({
	get: () => config.value.elevenlabsVoiceId as string | undefined,
	set: (v) => {
		if (v) config.value.elevenlabsVoiceId = v
		else delete (config.value as Record<string, unknown>).elevenlabsVoiceId
	},
})

const currentVoice = computed(() =>
	voicesCtx?.voices.value.find((v) => v.voice_id === voiceId.value),
)

const audioRef = ref<HTMLAudioElement | null>(null)
function playPreview() {
	const url = currentVoice.value?.preview_url
	if (!url) return
	if (!audioRef.value) audioRef.value = new Audio(url)
	else audioRef.value.src = url
	audioRef.value.play().catch(() => {})
}
</script>

<template>
	<div>
		<label :class="su.label">Voice override</label>
		<div v-if="voicesCtx?.enabled.value" class="flex items-center gap-2">
			<select v-model="voiceId" :class="[su.select, '!py-1.5 text-sm']">
				<option :value="undefined">Use session default</option>
				<option
					v-for="v in voicesCtx.voices.value"
					:key="v.voice_id"
					:value="v.voice_id">
					{{ v.name }}
				</option>
			</select>
			<button
				v-if="currentVoice?.preview_url"
				type="button"
				class="text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-900 text-sm shrink-0"
				@click="playPreview"
				title="Preview voice">
				▶
			</button>
		</div>
		<p v-else class="text-xs text-zinc-500">
			Connect ElevenLabs in account settings to choose voices.
		</p>
	</div>
</template>
