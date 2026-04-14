<script setup lang="ts">
import { ref } from 'vue'
import { su } from '@/components/ui/studioUi'
import type { SceneBlock } from '@/api/sessions'

/**
 * "Paste a script and auto-create blocks." We split the input on blank lines
 * into paragraphs; each paragraph becomes one scene where the paragraph text
 * is used as both the on-screen text and the spoken voice line. The user
 * can always refine scenes afterwards.
 *
 * This is intentionally simple — sophisticated parsing (detecting stage
 * directions, behavior cues, etc.) can be layered on later.
 */
const emit = defineEmits<{
	import: [scenes: SceneBlock[]]
	close: []
}>()

const text = ref('')

function parse(): SceneBlock[] {
	const paragraphs = text.value
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)

	return paragraphs.map((p) => {
		const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
		const content: string | string[] = lines.length > 1 ? lines : p
		return {
			id: crypto.randomUUID(),
			type: 'scene',
			label: '',
			config: { text: content, voice: content },
		}
	})
}

function apply() {
	const scenes = parse()
	if (scenes.length > 0) emit('import', scenes)
	emit('close')
}
</script>

<template>
	<div class="fixed inset-0 z-30 bg-black/70 flex items-center justify-center p-6">
		<div class="bg-surface-secondary border border-edge rounded-2xl p-6 w-full max-w-2xl">
			<h2 :class="[su.h2, 'mb-1']">Import from text</h2>
			<p class="text-sm text-content-secondary mb-4">
				Paste a script. Each paragraph (separated by blank lines) becomes one scene.
			</p>
			<textarea
				v-model="text"
				:class="[su.textarea, 'min-h-[260px] mb-4']"
				placeholder="Paragraph 1 becomes scene 1.\n\nParagraph 2 becomes scene 2.\n\n…" />
			<div class="flex justify-end gap-2">
				<button :class="su.btnSecondary" type="button" @click="emit('close')">Cancel</button>
				<button :class="su.btn" type="button" @click="apply">Import as scenes</button>
			</div>
		</div>
	</div>
</template>
