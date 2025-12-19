<template>
	<div
		class="progress-track"
		:style="{ backgroundColor: trackColor || 'rgba(255, 255, 255, 0.2)' }"
	>
		<div
			class="progress-fill"
			:style="{
				width: Math.min(100, Math.max(0, progress)) + '%',
				backgroundColor: fillColor || 'rgba(255, 255, 255, 0.3)'
			}"
		></div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	progress: number
	trackColor?: string
	fillColor?: string
}>()
</script>

<style scoped>
.progress-track {
	height: 8px;
	border-radius: 4px;
	overflow: hidden;
	opacity: 0.5;
}

.progress-fill {
	height: 100%;
	transition: width 0.1s linear;
}
</style>
