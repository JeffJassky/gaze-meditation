<template>
  <div class="nod-view" :style="{ color: instruction.resolvedTheme.textColor }">
    <div class="counter" v-if="instruction.options.showDots">

			<span
				v-for="n in instruction.options.nodsRequired"
				:key="n"
				class="dot"
				:class="{ filled: n <= instruction.nodsCompleted.value }"
			></span>
		</div>

		    <div class="guide">

		      <h1>{{ instruction.options.type === 'NO' ? 'SHAKE "NO"' : 'NOD "YES"' }}</h1>

		      

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
  instruction: NodInstruction;
}>();

const accentColor = computed(() => props.instruction.resolvedTheme.accentColor);


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
}

.counter {
	/* Hidden now that we have progress bar? Or keep both? 
     The user said "progress bar... instead of discrete milestones"? 
     User said "progress bar shows it". 
     The counter was discrete. I'll hide the counter if that was implied, 
     but the prompt didn't explicitly say "remove counter". 
     However, "progress bar... instead of discrete milestones" is common interpretation. 
     I'll leave counter for now or hide it via CSS if needed. 
     Wait, looking at template, I am keeping it in the template above but the new string replacement targets "guide v-else".
     Ah, I need to check if I am replacing the counter section.
     The replace block is inside "guide v-else".
     The counter is outside "guide v-else".
     So counter remains. I'll assume they can coexist unless told otherwise.
  */
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

.guide h1 {
	font-size: 3rem;
	margin-bottom: 40px;
}

.guide p {
	letter-spacing: 2px;
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
	height: 1.5em;
	border: none;
	border-radius: 999px;
	overflow: hidden;
	margin-top: 0; /* Handled by flex gap/margins */
}

.progress-fill {
	height: 100%;
	width: 0%;
	transition: width 250ms ease-out;
}
</style>
