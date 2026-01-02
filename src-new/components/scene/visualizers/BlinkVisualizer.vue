<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	openness: number // 0-100 range
	theme: {
		accentColor: string
		textColor: string
		[key: string]: any
	}
}>()

const normalizedOpenness = computed(() => props.openness / 100) // Convert to 0-1 range

const lidMovement = computed(() => {
	// 0 = closed, 1 = open
	const openness = normalizedOpenness.value
	// When eye is fully open (1), lids are moved out of frame
	// When eye is fully closed (0), lids meet in the middle
	const upperOffset = openness * -100
	const lowerOffset = openness * 100

	return {
		upper: `translateY(${upperOffset}%)`,
		lower: `translateY(${lowerOffset}%)`
	}
})

const upperLidTransform = computed(() => ({
	transform: lidMovement.value.upper
}))

const lowerLidTransform = computed(() => ({
	transform: lidMovement.value.lower
}))
</script>

<template>
	<div class="fixed inset-0 pointer-events-none z-[100]">
		<div
			class="lid upper absolute inset-x-0 h-screen transition-transform duration-200"
			:style="upperLidTransform"
		></div>
		<div
			class="lid lower absolute inset-x-0 h-screen transition-transform duration-200"
			:style="lowerLidTransform"
		></div>
	</div>
</template>

<style scoped>
.lid.upper {
	width: 100vw;
	top: 0;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 1) 0%,
		rgba(0, 0, 0, 1) 80%,
		rgba(0, 0, 0, 0) 100%
	);
}

.lid.lower {
	width: 100vw;
	bottom: 0;
	background: linear-gradient(
		to top,
		rgba(0, 0, 0, 1) 0%,
		rgba(0, 0, 0, 1) 80%,
		rgba(0, 0, 0, 0) 100%
	);
}
</style>
