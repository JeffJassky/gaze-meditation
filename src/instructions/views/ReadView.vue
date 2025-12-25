<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { ReadInstruction } from '../ReadInstruction'

interface ReadViewProps {
	instruction: ReadInstruction
}

const props = defineProps<ReadViewProps>()

onMounted(() => {
	console.log(`[ReadView] Mounted. ID: ${props.instruction.id}`)
	// Watch the text for changes to debug
	watch(() => props.instruction.currentText.value, (newVal) => {
		console.log(`[ReadView] Text changed to: "${newVal}"`)
	}, { immediate: true })
})
</script>

<template>
	<div class="instruction-view read-view">
		<!-- Prompt (Title) -->
		<div
			v-if="instruction.options.prompt"
			class="prompt-text"
			:style="{ color: instruction.resolvedTheme.textColor || '#ffffff' }"
		>
			{{ instruction.options.prompt }}
		</div>

		<!-- Main Text Content -->
		<Transition
			name="read-segment"
			mode="out-in"
		>
			<div
				:key="instruction.currentIndex.value"
				class="read-content leading-relaxed"
				:style="{ color: instruction.resolvedTheme.secondaryTextColor || '#e4e4e7' }"
			>
				<span
					v-for="(segment, index) in (instruction.currentText.value || '').split('~')"
					:key="index"
					class="inline-block"
					>{{ segment.trim() }}&nbsp;</span
				>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.instruction-view {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	text-align: center;
	padding: 2rem;
	position: relative;
}

.prompt-text {
	font-size: clamp(1.5rem, 5vw, 4rem);
	font-weight: bold;
	margin-bottom: 2rem;
	z-index: 10;
}

.read-content {
	font-size: clamp(1rem, 3vw, 2.5rem);
	max-width: 800px;
	width: 100%;
}

/* Internal transition for text segments */
.read-segment-enter-active,
.read-segment-leave-active {
	transition: opacity calc(2s / var(--speed-factor, 1)) ease-in-out, transform calc(2s / var(--speed-factor, 1)) ease-in-out;
}

.read-segment-enter-from {
	opacity: 0;
	transform: scale(1.15);
}

.read-segment-leave-to {
	opacity: 0;
	transform: scale(0.93);
}
</style>
