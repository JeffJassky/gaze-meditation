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
		<!-- 1. Background Layer (z-0) -->
		<div class="scene-layer background-layer z-0">
			<slot name="background"></slot>
		</div>

		<!-- 2. Progress Layer (z-10) - Back -->
		<div class="scene-layer progress-layer z-10 pointer-events-none flex items-center justify-center">
			<ProgressBar
				v-if="showProgress"
				:progress="progress"
				:size="180"
				:stroke-width="8"
				:fillColor="theme.accentColor || theme.textColor"
				trackColor="rgba(255,255,255,0.1)"
			/>
		</div>

		<!-- 3. Behavior Layer (z-20) - Middle -->
		<div class="scene-layer behavior-layer z-20 pointer-events-auto flex items-center justify-center p-8">
			<div
				class="scene-content relative flex items-center justify-center"
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

		<!-- 4. Text Layer (z-30) - Top -->
		<div class="scene-layer text-layer z-30 pointer-events-none flex items-center justify-center p-8">
			<div class="prompt-text relative text-center flex items-center justify-center w-full max-w-4xl">
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
						<span>{{ activeText }}</span>
					</span>
				</Transition>
			</div>
		</div>

		<!-- 5. Overlay Layer (z-40) - Highest -->
		<div class="scene-layer overlay-layer z-40 pointer-events-none">
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

.prompt-text {
	font-size: clamp(1.5rem, 4vw, 2.5rem);
	font-weight: 500;
	/* Removed fixed height/margins to allow overlap */
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
