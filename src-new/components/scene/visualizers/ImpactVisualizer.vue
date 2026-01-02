<script setup lang="ts">
import ProgressBar from '@/components/ProgressBar.vue'

const props = withDefaults(
	defineProps<{
		impactsCount: number
		impactsRequired: number
		display?: 'none' | 'progress' | 'dots'
		progress: number // 0-100
		theme: {
			positiveColor?: string
			negativeColor?: string
			textColor?: string
			[key: string]: any
		}
	}>(),
	{
		display: 'progress'
	}
)
</script>

<template>
	<div
		v-if="display !== 'none'"
		class="impact-visualizer fixed inset-x-0 top-1/2 transform translate-y-32 flex items-center justify-center pointer-events-none z-[100]"
	>
		<!-- Progress Ring Mode -->
		<ProgressBar
			v-if="display === 'progress'"
			:progress="progress"
			:size="300"
			:stroke-width="8"
			:fill-color="theme.positiveColor"
		/>

		<!-- Dots Mode -->
		<div
			v-if="display === 'dots'"
			class="flex gap-4 p-8 rounded-2xl bg-black/20 backdrop-blur-sm"
		>
			<div
				v-for="i in impactsRequired"
				:key="i"
				class="w-4 h-4 rounded-full transition-all duration-500 transform border-2"
				:class="i <= impactsCount ? 'scale-110' : 'scale-90 opacity-50'"
				:style="{
					backgroundColor: i <= impactsCount ? theme.textColor : 'transparent',
					borderColor: theme.textColor,
					boxShadow:
						i <= impactsCount ? `0 0 15px ${theme.textColor || '#ffffff'}80` : 'none'
				}"
			></div>
		</div>
	</div>
</template>

<style scoped>
.impact-visualizer {
	animation: fade-in 1s ease-out;
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.progress-ring-fill {
	filter: drop-shadow(0 0 8px currentColor);
}
</style>
