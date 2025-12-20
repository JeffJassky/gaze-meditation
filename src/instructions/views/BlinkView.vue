<template>
	<div
		class="blink-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<EyeGraphic :openness="instruction.eyeOpennessNormalized.value * 100" />

		<div
			class="message"
			:style="{ opacity: Math.max(0, 0.8 - instruction.eyeOpennessNormalized.value) }"
		>
			<h1
				v-if="instruction.status.value === 'FAILED'"
				:style="{ color: instruction.resolvedTheme.negativeColor }"
			>
				YOU BLINKED
			</h1>

			<h1 v-else-if="instruction.status.value === 'SUCCESS'">GOOD</h1>

			<h1 v-else>Open your eyes wide</h1>
		</div>

		<div class="progress-container">
			<ProgressBar
				:progress="instruction.progress.value"
				:fillColor="instruction.resolvedTheme.textColor"
				:trackColor="instruction.resolvedTheme.secondaryTextColor + '33'"
			/>
		</div>

		<div
			class="debug-stats"
			:style="{ color: instruction.resolvedTheme.secondaryTextColor }"
		>
			EAR: {{ instruction.ear.value.toFixed(3) }}
		</div>
	</div>
</template>

<script setup lang="ts">
import type { BlinkInstruction } from '../BlinkInstruction'
import EyeGraphic from '../../components/EyeGraphic.vue' // Correct path
import ProgressBar from '../../components/ProgressBar.vue'

const props = defineProps<{
	instruction: BlinkInstruction
}>()
</script>

<style scoped>
.blink-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	/* color: white; is now set via inline style */
}

.message {
	transition: opacity 250ms ease-out;
}

.message h1 {
	font-size: 3rem;
	/* color: #ff3333; is now set via inline style for FAILED state */
}

.progress-container {
	margin-top: 40px;
}

.debug-stats {
	position: absolute;
	bottom: 20px;
	right: 20px;
	font-family: monospace;
	/* color: #444; is now set via inline style */
}
</style>
