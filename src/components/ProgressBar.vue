<template>
	<div class="progress-container">
		<svg
			:width="size"
			:height="size"
			class="progress-ring"
		>
			<circle
				class="progress-ring-track"
				:cx="size / 2"
				:cy="size / 2"
				:r="radius"
				fill="none"
				:stroke="trackColor || 'rgba(255, 255, 255, 0.1)'"
				:stroke-width="strokeWidth"
			/>
			<circle
				class="progress-ring-fill"
				:cx="size / 2"
				:cy="size / 2"
				:r="radius"
				fill="none"
				:stroke="fillColor || 'rgba(255, 255, 255, 0.8)'"
				:stroke-width="strokeWidth"
				stroke-linecap="round"
				:stroke-dasharray="circumference"
				:style="fillStyle"
			/>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
	defineProps<{
		progress: number
		size?: number
		strokeWidth?: number
		trackColor?: string
		fillColor?: string
	}>(),
	{
		size: 120,
		strokeWidth: 6
	}
)

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(
	() => circumference.value - (props.progress / 100) * circumference.value
)

const fillStyle = computed(() => ({
	strokeDashoffset: dashOffset.value,
	transform: 'rotate(-90deg)',
	transformOrigin: '50% 50%',
	transition: 'stroke-dashoffset calc(0.4s / var(--speed-factor, 1)) ease-out',
	filter: `drop-shadow(0 0 8px ${props.fillColor || 'rgba(255, 255, 255, 0.8)'})`
}))
</script>

<style scoped>
.progress-container {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: none;
}

.progress-ring {
	overflow: visible;
}
</style>