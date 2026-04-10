<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InspectorSection from './InspectorSection.vue'
import SceneAudioPanel from './SceneAudioPanel.vue'
import SceneBehaviorPanel from './SceneBehaviorPanel.vue'
import SceneThemePanel from './SceneThemePanel.vue'
import SceneTimingPanel from './SceneTimingPanel.vue'
import type { SceneBlock } from '@/api/sessions'

/**
 * Right pane: collapsible inspector sections weighted by usage frequency.
 * Voice and Behaviors open by default; Audio opens when the scene already
 * has audio configured; Theme override defaults closed and is gated by an
 * explicit checkbox so an empty `theme: {}` object never sneaks in.
 */
const scene = defineModel<SceneBlock>({ required: true })

const configModel = computed({
	get: () => scene.value.config ?? {},
	set: (v) => (scene.value.config = v),
})

const themeOverrideEnabled = ref(
	!!scene.value.config?.theme &&
		Object.keys(scene.value.config.theme).length > 0,
)

watch(
	() => scene.value.id,
	() => {
		const t = scene.value.config?.theme
		themeOverrideEnabled.value = !!t && Object.keys(t).length > 0
	},
)

watch(themeOverrideEnabled, (v) => {
	if (!v && scene.value.config?.theme !== undefined) {
		delete scene.value.config.theme
	} else if (v && !scene.value.config?.theme) {
		scene.value.config.theme = {}
	}
})

const behaviorCount = computed(() => {
	const b = scene.value.config?.behavior
	return Array.isArray(b?.suggestions) ? b.suggestions.length : 0
})

const hasAudio = computed(() => {
	const a = scene.value.config?.audio
	return !!(a?.binaural || a?.fx?.path)
})
</script>

<template>
	<aside class="overflow-y-auto min-h-0">
		<div>
			<InspectorSection
				title="Behaviors"
				storage-key="behaviors"
				:default-open="true"
				:badge="behaviorCount || undefined">
				<SceneBehaviorPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection title="Audio" storage-key="audio" :default-open="hasAudio">
				<SceneAudioPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection
				title="Timing"
				storage-key="timing"
				:default-open="false">
				<SceneTimingPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection
				title="Theme override"
				storage-key="theme"
				:default-open="false">
				<label class="flex items-center gap-2 text-xs text-zinc-400 mb-3">
					<input type="checkbox" v-model="themeOverrideEnabled" />
					Override session theme for this scene
				</label>
				<SceneThemePanel v-if="themeOverrideEnabled" v-model="configModel" />
			</InspectorSection>
		</div>
	</aside>
</template>
