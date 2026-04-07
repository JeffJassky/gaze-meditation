<script setup lang="ts">
import { computed, inject } from 'vue'
import { su } from '@new/components/ui/studioUi'
import { VOICES_KEY } from './voicesKey'

/**
 * SceneTextPanel edits the "what the user sees and hears" parts of a scene:
 * on-screen text and spoken voice lines. Both fields accept multiple lines;
 * the stored shape is `string | string[]` matching the existing SceneConfig.
 */
const config = defineModel<Record<string, unknown>>({ required: true })

function toText(v: unknown): string {
	if (Array.isArray(v)) return v.join('\n')
	if (typeof v === 'string') return v
	return ''
}

/**
 * Normalize multiline input: if more than one non-empty line, store as an
 * array so the runtime treats each line as a separate beat; otherwise store
 * as a plain string.
 */
function fromText(v: string): string | string[] {
	const lines = v.split('\n').map((l) => l.trimEnd())
	const meaningful = lines.filter((l) => l.length > 0)
	return meaningful.length > 1 ? lines : v
}

const textModel = computed({
	get: () => toText(config.value.text),
	set: (v) => (config.value.text = fromText(v)),
})
const voiceModel = computed({
	get: () => toText(config.value.voice),
	set: (v) => (config.value.voice = fromText(v)),
})

// Per-scene ElevenLabs voice override. Falls back to the session-level
// default when unset. Injected voices list is optional.
const voicesState = inject(VOICES_KEY, undefined)
const voiceOverrideId = computed({
	get: () => (config.value.elevenlabsVoiceId as string | undefined) ?? '',
	set: (v: string) => {
		if (v) config.value.elevenlabsVoiceId = v
		else delete (config.value as Record<string, unknown>).elevenlabsVoiceId
	},
})
</script>

<template>
	<div :class="su.subCard">
		<h3 :class="[su.h3, 'mb-3']">Text & voice</h3>
		<div class="grid gap-3">
			<div>
				<label :class="su.label">On-screen text</label>
				<textarea
					v-model="textModel"
					:class="[su.textarea, 'min-h-[80px]']"
					placeholder="Line 1\nLine 2 (blank between paragraphs)" />
			</div>
			<div>
				<label :class="su.label">Voice (spoken)</label>
				<textarea
					v-model="voiceModel"
					:class="[su.textarea, 'min-h-[80px]']"
					placeholder="What the narrator says" />
			</div>

			<div v-if="voicesState?.enabled.value">
				<label :class="su.label">Scene voice override (ElevenLabs)</label>
				<select v-model="voiceOverrideId" :class="su.select">
					<option value="">— use session default —</option>
					<option
						v-for="v in voicesState.voices.value"
						:key="v.voice_id"
						:value="v.voice_id">
						{{ v.name }}{{ v.category ? ` (${v.category})` : '' }}
					</option>
				</select>
			</div>
		</div>
	</div>
</template>
