<script setup lang="ts">
import { computed } from 'vue'
import type { DirectionalGazeInstruction } from '../DirectionalGazeInstruction'
import ProgressBar from '../../components/ProgressBar.vue'

const props = defineProps<{
	instruction: DirectionalGazeInstruction
}>()

const isVideo = (src?: string) => {
	if (!src) return false
	return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm')
}

const textColor = computed(() => props.instruction.resolvedTheme.textColor)
const secondaryTextColor = computed(() => props.instruction.resolvedTheme.secondaryTextColor)
const accentColor = computed(() => props.instruction.resolvedTheme.accentColor)
const positiveColor = computed(() => props.instruction.resolvedTheme.positiveColor)
const negativeColor = computed(() => props.instruction.resolvedTheme.negativeColor)

const correctFeedbackBorder = computed(() => {
	return positiveColor.value ? `${positiveColor.value}80` : 'rgba(16,185,129,0.5)' // 50% opacity (emerald-500)
})

const incorrectFeedbackBorder = computed(() => {
	return negativeColor.value ? `${negativeColor.value}33` : 'rgba(239,68,68,0.2)' // 20% opacity (red-500)
})
</script>

<template>
	<div class="absolute inset-0 pointer-events-none">
		<!-- Split Screen Content -->
		<div class="absolute inset-0 flex">
			<!-- Left Side -->
			<div class="w-1/2 h-full relative overflow-hidden flex items-center justify-center">
				<template v-if="instruction.options.leftSrc">
					<video
						v-if="isVideo(instruction.options.leftSrc)"
						:src="instruction.options.leftSrc"
						autoplay
						loop
						muted
						class="w-full h-full object-cover"
					></video>
					<img
						v-else
						:src="instruction.options.leftSrc"
						class="w-full h-full object-cover"
					/>
				</template>
			</div>

			<!-- Right Side -->
			<div class="w-1/2 h-full relative overflow-hidden flex items-center justify-center">
				<template v-if="instruction.options.rightSrc">
					<video
						v-if="isVideo(instruction.options.rightSrc)"
						:src="instruction.options.rightSrc"
						autoplay
						loop
						muted
						class="w-full h-full object-cover"
					></video>
					<img
						v-else
						:src="instruction.options.rightSrc"
						class="w-full h-full object-cover"
					/>
				</template>
			</div>
		</div>

		<!-- Overlays -->
		<div
			class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-8 text-center"
		>
			<!-- Instruction Text -->
			<div
				v-if="instruction.options.prompt"
				class="prompt-text fade-in mb-8"
				:style="{ color: textColor }"
			>
				{{ instruction.options.prompt }}
			</div>

			<ProgressBar
				v-if="instruction.options.duration && instruction.options.duration > 0"
				:progress="instruction.score.value"
				:track-color="secondaryTextColor + '33'"
				:fill-color="accentColor"
			/>
		</div>

		<!-- Feedback / Reward Visual -->
		<div
			v-if="instruction.isCorrect.value"
			class="absolute inset-0 border-[12px] transition-colors z-20"
			:style="{ borderColor: correctFeedbackBorder }"
		></div>
		<div
			v-else
			class="absolute inset-0 border-[12px] transition-colors z-20"
			:style="{ borderColor: incorrectFeedbackBorder }"
		></div>
	</div>
</template>

<style scoped>
.prompt-text {
	font-size: clamp(1.5rem, 5vw, 4rem); /* Responsive font size */
	font-weight: bold;
}

.fade-in {
	animation: fadeIn 1s ease-out forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
