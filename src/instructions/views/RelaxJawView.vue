<template>
	<div
		class="relax-jaw-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<h1 class="prompt">
			<span
				v-for="(segment, index) in instruction.options.prompt.split('~')"
				:key="index"
				class="inline-block"
			>{{ segment }}&nbsp;</span>
		</h1>

		<!-- Visualizer hidden for now per user request -->

		<div
			v-if="instruction.options.duration && instruction.options.duration > 0"
			class="progress-container"
		>
			<ProgressBar
				:progress="instruction.progress.value"
				:size="240"
				:stroke-width="12"
				:track-color="instruction.resolvedTheme.positiveColor + '33'"
				:fill-color="instruction.resolvedTheme.positiveColor"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { RelaxJawInstruction } from '../RelaxJawInstruction'
import ProgressBar from '../../components/ProgressBar.vue'

const props = defineProps<{
	instruction: RelaxJawInstruction
}>()
</script>

<style scoped>
.relax-jaw-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
	position: relative;
}

.prompt {
	font-size: 2.5rem;
	font-weight: 300;
	text-align: center;
	z-index: 10;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 100%;
}

.progress-container {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	/* Ensure container doesn't block text selection if needed, though prompt is above */
	z-index: 0;
}
</style>
