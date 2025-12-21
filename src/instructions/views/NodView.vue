<template>
	<div
		class="nod-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<div
			class="prompt-text leading-relaxed mb-8"
			v-if="instruction.options.prompt"
			:style="{ color: instruction.resolvedTheme.textColor }"
		>
			{{ instruction.options.prompt }}
		</div>

		<div
			class="counter"
			v-if="instruction.options.showDots"
		>
			<span
				v-for="n in instruction.options.nodsRequired"
				:key="n"
				class="dot"
				:class="{ filled: n <= instruction.nodsCompleted.value }"
			></span>
		</div>

		<div class="guide">
			<p
				class="action-text mb-12"
				:style="{ color: instruction.resolvedTheme.secondaryTextColor }"
			>
				{{
					instruction.options.type === 'NO'
						? 'Shake your head "no".'
						: 'Nod your head "yes".'
				}}
			</p>

			<!-- Vertical Layout (YES) -->

			<div
				class="toggle-track vertical"
				v-if="instruction.options.type !== 'NO' && instruction.options.showSwitch"
				:style="{ borderColor: instruction.resolvedTheme.secondaryTextColor }"
			>
				<div
					class="toggle-thumb"
					:style="{
						transform: `translate(-50%, calc(-50% + ${verticalOffset}px))`,
						backgroundColor: instruction.resolvedTheme.textColor
					}"
				></div>
			</div>

			<!-- Horizontal Layout (NO) -->
			<div
				class="toggle-track horizontal"
				v-if="instruction.options.type === 'NO' && instruction.options.showSwitch"
				:style="{ borderColor: instruction.resolvedTheme.secondaryTextColor }"
			>
				<div
					class="toggle-thumb"
					:style="{
						transform: `translate(calc(-50% + ${horizontalOffset}px), -50%)`,
						backgroundColor: instruction.resolvedTheme.textColor
					}"
				></div>
			</div>

			<!-- Progress Bar -->
			<div
				v-if="instruction.options.showProgress"
				class="progress-container"
				:style="{ backgroundColor: instruction.resolvedTheme.accentColor + '1A' }"
			>
				<div
					class="progress-fill"
					:style="{
						width: instruction.totalProgress.value + '%',
						backgroundColor: instruction.resolvedTheme.accentColor
					}"
				></div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { NodInstruction } from '../NodInstruction'
import { computed } from 'vue'

const props = defineProps<{
	instruction: NodInstruction
}>()

const accentColor = computed(() => props.instruction.resolvedTheme.accentColor)

// Clamping / Smoothing Logic
const CLAMP_PX = 110 // Max pixels from center (track is ~300px total, so +/- 150px minus padding)

const verticalOffset = computed(() => {
	const state = props.instruction.pitchState.value // -1, 0, 1
	return state * CLAMP_PX
})

const horizontalOffset = computed(() => {
	const state = props.instruction.yawState.value // -1, 0, 1
	return state * CLAMP_PX
})
</script>

<style scoped>
.nod-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	text-align: center;
	padding: 2rem;
}

.prompt-text {
	font-size: clamp(1.5rem, 4vw, 3rem);
	font-weight: 300;
}

.action-text {
	font-size: 1.2rem;
	opacity: 0.8;
}

.counter {
	display: flex;
	gap: 20px;
	margin-bottom: 50px;
}

.dot {
	width: 20px;
	height: 20px;
	border: 2px solid v-bind('instruction.resolvedTheme.textColor');
	border-radius: 50%;
	transition: background 0.3s;
}

.dot.filled {
	background: v-bind(accentColor);
	box-shadow: 0 0 10px v-bind(accentColor);
}

.guide {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
}

.blink {
	animation: blink 1s infinite;
}

@keyframes blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

/* Toggle Switch Styling */
.toggle-track {
	position: relative;
	border-width: 4px;
	border-style: solid;
	border-radius: 9999px; /* Pill shape */
	background: rgba(0, 0, 0, 0.3); /* Subtle background */
	box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
	margin-bottom: 60px; /* More space for progress bar */
}

.toggle-track.vertical {
	width: 100px;
	height: 350px;
}

.toggle-track.horizontal {
	width: 350px;
	height: 100px;
}

.toggle-thumb {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 80px;
	height: 80px;
	border-radius: 50%;
	box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
	transition: transform 0.25s ease-out; /* Smooth interaction */
}

/* Progress Bar */
.progress-container {
	width: 450px;
	max-width: 90vw;
	height: 8px;
	border: none;
	border-radius: 999px;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	width: 0%;
	transition: width 250ms ease-out;
}
</style>
