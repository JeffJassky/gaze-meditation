<script setup lang="ts">
import { computed, ref } from 'vue'
import { su } from '@new/components/ui/studioUi'
import SceneTextPanel from './SceneTextPanel.vue'
import SceneAudioPanel from './SceneAudioPanel.vue'
import SceneBehaviorPanel from './SceneBehaviorPanel.vue'
import SceneThemePanel from './SceneThemePanel.vue'
import SceneTimingPanel from './SceneTimingPanel.vue'
import type { SceneBlock, SessionAsset } from '@/services/sessions'

/**
 * A single scene block in the editor list.
 *
 * Renders a compact header (drag handle, type, label, delete) plus an
 * expandable body that hosts the specialized panels for text/voice, audio,
 * behaviors, theme, and timing. Collapsed by default so long sessions stay
 * navigable.
 */
const scene = defineModel<SceneBlock>({ required: true })

defineProps<{
	index: number
	audioAssets: SessionAsset[]
}>()

const emit = defineEmits<{
	remove: []
	duplicate: []
	dragstart: [e: DragEvent]
	dragover: [e: DragEvent]
	drop: [e: DragEvent]
	dragend: [e: DragEvent]
}>()

const expanded = ref(false)

const SCENE_TYPES = ['scene', 'intro', 'outro', 'form', 'selection']

const summary = computed(() => {
	const cfg = scene.value?.config
	if (!cfg) return ''
	const text = cfg.text
	if (typeof text === 'string' && text.trim()) return text.slice(0, 80)
	if (Array.isArray(text) && text.length) return String(text[0]).slice(0, 80)
	const voice = cfg.voice
	if (typeof voice === 'string' && voice.trim()) return voice.slice(0, 80)
	if (Array.isArray(voice) && voice.length) return String(voice[0]).slice(0, 80)
	return ''
})

// Proxy model binding into the nested config object so panels can update
// scene.config.<whatever> directly without passing a bunch of handlers.
// Old sessions may have scenes without a `config` object — default to {} so
// child panels can write into it safely.
const configModel = computed({
	get: () => scene.value.config ?? {},
	set: (v) => (scene.value.config = v),
})
</script>

<template>
	<div
		class="bg-zinc-900/80 border border-zinc-800 rounded-xl"
		:draggable="true"
		@dragstart="(e) => emit('dragstart', e)"
		@dragover.prevent="(e) => emit('dragover', e)"
		@drop.prevent="(e) => emit('drop', e)"
		@dragend="(e) => emit('dragend', e)">
		<!-- Header -->
		<div class="flex items-center gap-3 p-3">
			<span
				class="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 select-none"
				title="Drag to reorder">
				⋮⋮
			</span>
			<span class="text-xs font-mono text-zinc-500 w-6 text-right">{{ index + 1 }}</span>

			<select v-model="scene.type" :class="[su.select, '!py-1 !px-2 !w-auto text-sm']">
				<option v-for="t in SCENE_TYPES" :key="t" :value="t">{{ t }}</option>
			</select>

			<input
				v-model="scene.label"
				:class="[su.input, '!py-1 !px-2 flex-1']"
				placeholder="Scene label (optional)" />

			<button
				:class="su.btnGhost"
				type="button"
				@click="expanded = !expanded">
				{{ expanded ? 'Collapse' : 'Expand' }}
			</button>
			<button :class="su.btnGhost" type="button" @click="emit('duplicate')">Duplicate</button>
			<button :class="su.btnDanger" type="button" @click="emit('remove')">×</button>
		</div>

		<!-- Collapsed summary -->
		<div
			v-if="!expanded && summary"
			class="px-3 pb-3 -mt-1 text-sm text-zinc-400 truncate pl-14">
			{{ summary }}
		</div>

		<!-- Expanded body -->
		<div v-if="expanded" class="border-t border-zinc-800 p-4 grid gap-4">
			<SceneTextPanel v-model="configModel" />
			<SceneAudioPanel v-model="configModel" :audio-assets="audioAssets" />
			<SceneBehaviorPanel v-model="configModel" />
			<SceneThemePanel v-model="configModel" />
			<SceneTimingPanel v-model="configModel" />
		</div>
	</div>
</template>
