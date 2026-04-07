<script setup lang="ts">
import { ref } from 'vue'
import { su } from '@new/components/ui/studioUi'
import SceneCard from './SceneCard.vue'
import SceneImportFromText from './SceneImportFromText.vue'
import type { SceneBlock, SessionAsset } from '@/services/sessions'

/**
 * The ordered list of scenes in the editor. Drag-and-drop reordering is
 * native HTML5 (no deps). We track the dragged index in a ref and splice
 * the array on drop — order is reflected in the parent's bound array.
 */
const scenes = defineModel<SceneBlock[]>({ required: true })
defineProps<{ audioAssets: SessionAsset[] }>()

const dragIndex = ref<number | null>(null)
const showImport = ref(false)

function onDragStart(i: number) {
	dragIndex.value = i
}
function onDrop(target: number) {
	const src = dragIndex.value
	if (src === null || src === target) return
	const arr = scenes.value.slice()
	const [moved] = arr.splice(src, 1)
	if (!moved) return
	arr.splice(target, 0, moved)
	scenes.value = arr
	dragIndex.value = null
}
function onDragEnd() {
	dragIndex.value = null
}

function addScene() {
	scenes.value = [
		...scenes.value,
		{ id: crypto.randomUUID(), type: 'scene', label: '', config: {} },
	]
}

function duplicate(i: number) {
	const src = scenes.value[i]
	if (!src) return
	const copy: SceneBlock = {
		id: crypto.randomUUID(),
		type: src.type,
		label: src.label,
		// Deep clone via JSON — scene config is plain data by design.
		config: JSON.parse(JSON.stringify(src.config)),
	}
	const next = scenes.value.slice()
	next.splice(i + 1, 0, copy)
	scenes.value = next
}

function remove(i: number) {
	const next = scenes.value.slice()
	next.splice(i, 1)
	scenes.value = next
}

function onImport(imported: SceneBlock[]) {
	scenes.value = [...scenes.value, ...imported]
}
</script>

<template>
	<section :class="su.card">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h2 :class="su.h2">Scenes</h2>
				<p class="text-xs text-zinc-500 mt-1">
					Drag to reorder. Expand a scene to edit its text, audio, behaviors, and theme.
				</p>
			</div>
			<div class="flex items-center gap-2">
				<button :class="su.btnSecondary" type="button" @click="showImport = true">
					Import from text
				</button>
				<button :class="su.btn" type="button" @click="addScene">+ Add scene</button>
			</div>
		</div>

		<div
			v-if="scenes.length === 0"
			class="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-lg">
			No scenes yet. Add one or import from a script.
		</div>

		<div v-else class="grid gap-3">
			<SceneCard
				v-for="(scene, i) in scenes"
				:key="scene.id"
				:model-value="scene"
				@update:model-value="(v) => (scenes[i] = v)"
				:index="i"
				:audio-assets="audioAssets"
				@remove="remove(i)"
				@duplicate="duplicate(i)"
				@dragstart="onDragStart(i)"
				@drop="onDrop(i)"
				@dragend="onDragEnd" />
		</div>

		<SceneImportFromText
			v-if="showImport"
			@import="onImport"
			@close="showImport = false" />
	</section>
</template>
