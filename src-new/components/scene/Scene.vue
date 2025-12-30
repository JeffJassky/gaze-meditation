<script setup lang="ts">
import { computed, inject, type Ref, ref, watch, onUnmounted } from 'vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { type Scene } from '@new/core/Scene'
import { type ThemeConfig } from '@/types'
import { DEFAULT_THEME } from '@/theme'
import { calculateDuration } from '@/utils/time'

interface Props {
	scene: Scene
	// layout configuration
	contentClass?: string
}

const props = defineProps<Props>()

// Theme can come from scene or injected from Theater
const resolvedTheme = inject<Ref<ThemeConfig>>('resolvedTheme')
const theme = computed(() => resolvedTheme?.value || props.scene.config.theme || DEFAULT_THEME)

const prompt = computed(() => {
	const text = props.scene.config.text
	if (!text) return ''
	return Array.isArray(text) ? text.join(' ~ ') : text
})

const splitPrompt = computed(() => {
	if (!prompt.value) return []
	return prompt.value
		.split('~')
		.map(s => s.trim())
		.filter(s => s)
})

// Use the progress from the scene instance
const progress = computed(() => props.scene.progress.value)
const showProgress = computed(
	() => props.scene.config.duration !== undefined || props.scene.behaviors.length > 0
)

// Text Sequencing Logic
const activeSegment = ref('')
const isTextVisible = ref(false)
let sequenceTimeout: number | null = null

const wait = (ms: number) => new Promise(resolve => {
	sequenceTimeout = window.setTimeout(resolve, ms)
})

const playSequence = async () => {
	if (sequenceTimeout) clearTimeout(sequenceTimeout)
	isTextVisible.value = false
	activeSegment.value = ''

	const segments = splitPrompt.value
	if (!segments.length) return

	// Small delay before starting
	await wait(300)

	for (const segment of segments) {
		activeSegment.value = segment
		isTextVisible.value = true
		
		// Calculate read time (minimum 1.5s for very short text)
		const duration = Math.max(calculateDuration(segment), 1500)
		
		await wait(duration)
		
		isTextVisible.value = false
		await wait(500) // Transition out time
	}
}

watch(splitPrompt, () => {
	playSequence()
}, { immediate: true })

onUnmounted(() => {
	if (sequenceTimeout) clearTimeout(sequenceTimeout)
})
</script>

<template>
	<div
		class="scene-container"
		:style="{
			color: theme.textColor,
			backgroundColor: theme.backgroundColor
		}"
	>
		<!-- Background Layer -->
		<div class="scene-layer background-layer">
			<slot name="background"></slot>
		</div>

		<!-- Main Content Layer -->
		<div class="scene-layer content-layer flex flex-col items-center justify-center p-8">
			<!-- Standardized Prompt Display -->
			<slot name="prompt">
				<div class="prompt-text mb-8 text-center z-10 h-32 flex items-center justify-center">
					<Transition
						enter-active-class="animate-in fade-in zoom-in duration-500 ease-out"
						leave-active-class="animate-out fade-out zoom-out duration-500 ease-in"
					>
						<span
							v-if="isTextVisible && activeSegment"
							class="inline-block max-w-4xl"
						>
							{{ activeSegment }}
						</span>
					</Transition>
				</div>
			</slot>

			<!-- Primary Interactive/Visual Element -->
			<div
				class="scene-content relative z-10"
				:class="contentClass"
			>
				<!-- Render Behaviors -->
				<div
					v-if="scene.behaviors.length > 0"
					class="flex flex-wrap justify-center gap-8"
				>
					<component
						v-for="(behavior, idx) in scene.behaviors"
						:key="idx"
						:is="behavior.component"
						v-bind="behavior.getVisualizerProps()"
						:theme="theme"
					/>
				</div>
				<slot></slot>
			</div>
		</div>

		<!-- UI Overlay Layer -->
		<div class="scene-layer overlay-layer pointer-events-none">
			<div
				v-if="showProgress"
				class="absolute bottom-12 left-1/2 -translate-x-1/2"
			>
				<ProgressBar
					:progress="progress"
					:size="60"
					:stroke-width="4"
					:fillColor="theme.accentColor || theme.textColor"
					trackColor="rgba(255,255,255,0.1)"
				/>
			</div>
			<slot name="overlay"></slot>
		</div>
	</div>
</template>

<style scoped>
.scene-container {
	position: absolute;
	inset: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.scene-layer {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
}

.background-layer {
	z-index: 0;
}

.content-layer {
	z-index: 10;
	pointer-events: auto;
}

.overlay-layer {
	z-index: 20;
}

.prompt-text {
	font-size: clamp(1.5rem, 4vw, 2.5rem);
	font-weight: 500;
	line-height: 1.4;
	max-width: 900px;
}
</style>
