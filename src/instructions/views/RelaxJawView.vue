<template>
	<div
		class="relax-jaw-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<h1 class="prompt">{{ instruction.options.prompt }}</h1>

		<!-- Visualizer hidden for now per user request -->

		<div
			v-if="instruction.options.duration && instruction.options.duration > 0"
			class="progress-container"
		>
			<ProgressBar
				:progress="instruction.progress.value"
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
}

.progress-container {
	width: 300px;
}
</style>
