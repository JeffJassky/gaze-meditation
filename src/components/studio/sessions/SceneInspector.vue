<script setup lang="ts">
import { computed, inject } from 'vue'
import InspectorSection from './InspectorSection.vue'
import SceneBinauralPanel from './SceneBinauralPanel.vue'
import SoundboardEventsPanel from './SoundboardEventsPanel.vue'
import SceneBehaviorPanel from './SceneBehaviorPanel.vue'
import SceneThemePanel from './SceneThemePanel.vue'
import SceneTimingPanel from './SceneTimingPanel.vue'
import { VOICES_KEY } from './voicesKey'
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


const behaviorCount = computed(() => {
	const b = scene.value.config?.behavior
	return Array.isArray(b?.suggestions) ? b.suggestions.length : 0
})

const voicesState = inject(VOICES_KEY, undefined)
const sessionBinauralEnabled = computed(() => voicesState?.binauralEnabled.value ?? true)

const hasSoundboard = computed(() =>
	(scene.value.config?.audio?.soundboard?.length ?? 0) > 0,
)
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

			<InspectorSection
				v-if="sessionBinauralEnabled"
				title="Binaural"
				storage-key="binaural"
				:default-open="false">
				<SceneBinauralPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection
				title="Soundboard"
				storage-key="soundboard"
				:default-open="hasSoundboard"
				:badge="hasSoundboard ? scene.config?.audio?.soundboard?.length : undefined">
				<SoundboardEventsPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection
				title="Timing"
				storage-key="timing"
				:default-open="false">
				<SceneTimingPanel v-model="configModel" />
			</InspectorSection>

			<InspectorSection
				title="Colors"
				storage-key="theme"
				:default-open="false">
				<SceneThemePanel v-model="configModel" />
			</InspectorSection>
		</div>
	</aside>
</template>
