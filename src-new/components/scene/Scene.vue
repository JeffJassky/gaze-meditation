<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { type Scene } from '@new/core/Scene'
import { type ThemeConfig } from '@/types'
import { DEFAULT_THEME } from '@/theme'

interface Props {
	scene: Scene
	// layout configuration
	contentClass?: string
}

const props = defineProps<Props>()

// Theme can come from scene or injected from Theater
const resolvedTheme = inject<Ref<ThemeConfig>>('resolvedTheme')
const theme = computed(() => resolvedTheme?.value || props.scene.config.theme || DEFAULT_THEME)

// Use the progress and text state from the scene instance
const progress = computed(() => props.scene.progress.value)
const showProgress = computed(
	() =>
		props.scene.config.duration !== undefined ||
		props.scene.behaviors.some(b => b.hasExplicitDuration)
)

const activeText = computed(() => props.scene.activeText.value)
const isTextVisible = computed(() => props.scene.isTextVisible.value)
</script>

<template>
	<div
		class="scene-container"
		:style="{ color: theme.textColor }"
	>
		<!-- Background Layer -->
		<div class="scene-layer background-layer">
			<slot name="background"></slot>
		</div>

		<!-- Main Content Layer -->
		<div class="scene-layer content-layer flex flex-col items-center justify-center p-8">
			<!-- Central Text Display -->
			<div class="prompt-text relative mb-12 text-center z-10 h-48 flex items-center justify-center w-full">
				<Transition
					name="glacial"
					mode="out-in"
				>
					<span
						v-if="isTextVisible && activeText"
						:key="activeText"
						class="absolute inset-0 flex items-center justify-center px-4 leading-relaxed"
						:style="{ color: theme.secondaryTextColor || theme.textColor }"
					>
						<span class="max-w-4xl">{{ activeText }}</span>
					</span>
				</Transition>
			</div>

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
				class="absolute inset-0 flex items-center justify-center"
			>
				<ProgressBar
					:progress="progress"
					:size="180"
					:stroke-width="8"
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
	background-color: transparent; /* Ensure Theater background is visible */
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
	max-width: 900px;
}

/* Glacial Transition Styles */
.glacial-enter-active,
.glacial-leave-active {
	transition: opacity calc(2s / var(--speed-factor, 1)) ease-in-out,
		transform calc(2s / var(--speed-factor, 1)) ease-in-out;
}

.glacial-enter-from {
	opacity: 0;
	transform: scale(1.1);
}

.glacial-leave-to {
	opacity: 0;
	transform: scale(0.95);
}
</style>
