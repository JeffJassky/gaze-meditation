<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

/**
 * Pure text fields for a scene: voice (spoken narration) and on-screen text.
 * Typography differentiates the two — no labels, no borders, no field
 * backgrounds. Voice reads as serif dialogue; on-screen text reads as a
 * stage direction (italic, dim, indented). Everything chrome-related
 * (voice chip, counters) lives one level up in SceneStackItem so the text
 * surface itself is truly bare.
 *
 * Storage shape is unchanged: `string | string[]`. Multi-line input gets
 * normalized to an array on set so the runtime can treat each line as a beat.
 */
import type { SceneConfig } from '@shared/types'

const config = defineModel<SceneConfig>({ required: true })
defineProps<{
	/** Optional override for the voice textarea color (scene.theme.uiTextColor). */
	voiceColor?: string
	/** Optional override for the on-screen text color (scene.theme.promptTextColor). */
	textColor?: string
}>()
const emit = defineEmits<{
	advance: []
	/**
	 * User hit backspace/delete on an empty scene (both voice and text
	 * textareas are empty). The parent should remove this scene and focus
	 * the previous scene's last non-empty field.
	 */
	deleteBackward: []
}>()

function toText(v: unknown): string {
	if (Array.isArray(v)) return v.join('\n')
	if (typeof v === 'string') return v
	return ''
}

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

// --- Autosize ---------------------------------------------------------------
const voiceRef = ref<HTMLTextAreaElement | null>(null)
const textRef = ref<HTMLTextAreaElement | null>(null)

function autosize(el: HTMLTextAreaElement | null) {
	if (!el) return
	el.style.height = 'auto'
	el.style.height = el.scrollHeight + 'px'
}

onMounted(() => {
	nextTick(() => {
		autosize(voiceRef.value)
		autosize(textRef.value)
	})
})

watch(voiceModel, () => nextTick(() => autosize(voiceRef.value)))
watch(textModel, () => nextTick(() => autosize(textRef.value)))

// Enter advances to the next field: voice → on-screen text → new scene.
// Shift+Enter still inserts a literal newline for intentional multi-line beats.
function onVoiceEnter(e: KeyboardEvent) {
	if (e.shiftKey) return
	e.preventDefault()
	textRef.value?.focus()
}
function onTextEnter(e: KeyboardEvent) {
	if (e.shiftKey) return
	e.preventDefault()
	emit('advance')
}

// Backspace collapses upward through the scene structure:
//   text (empty) + backspace  →  focus voice (cursor at end)
//   voice (empty, text also empty) + backspace  →  delete the whole scene
//     and focus the previous scene's last non-empty field
// Anything else: default textarea behaviour.
function placeCaretAtEnd(el: HTMLTextAreaElement | null) {
	if (!el) return
	const len = el.value.length
	el.setSelectionRange(len, len)
}
function onTextBackspace(e: KeyboardEvent) {
	if (textModel.value.length === 0) {
		e.preventDefault()
		voiceRef.value?.focus()
		nextTick(() => placeCaretAtEnd(voiceRef.value))
	}
}
function onVoiceBackspace(e: KeyboardEvent) {
	if (voiceModel.value.length === 0 && textModel.value.length === 0) {
		e.preventDefault()
		emit('deleteBackward')
	}
}
</script>

<template>
	<div>
		<!-- Voice: the hero. Serif dialogue, no chrome. -->
		<textarea
			ref="voiceRef"
			v-model="voiceModel"
			data-field="voice"
			placeholder="What the narrator says…"
			class="w-full bg-transparent border-0 outline-none resize-none px-0 py-1 text-content placeholder-content-tertiary font-serif text-[17px] leading-[1.6] min-h-[2em]"
			:style="{
				'field-sizing': 'content',
				...(voiceColor ? { color: voiceColor } : {}),
			}"
			@input="autosize(voiceRef)"
			@keydown.enter="onVoiceEnter"
			@keydown.backspace="onVoiceBackspace"
			@keydown.delete="onVoiceBackspace" />

		<!-- On-screen text: subordinate stage direction. Italic, dim, indented. -->
		<textarea
			ref="textRef"
			v-model="textModel"
			data-field="text"
			placeholder="On-screen text…"
			class="w-full bg-transparent border-0 outline-none resize-none px-0 py-0.5 mt-1 text-content-tertiary placeholder-content-tertiary placeholder:italic italic text-[16px] leading-[1.6] min-h-[1.5em]"
			:style="{
				'field-sizing': 'content',
				...(textColor ? { color: textColor } : {}),
			}"
			@input="autosize(textRef)"
			@keydown.enter="onTextEnter"
			@keydown.backspace="onTextBackspace"
			@keydown.delete="onTextBackspace" />
	</div>
</template>
