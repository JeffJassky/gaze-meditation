<script setup lang="ts">
import { toRefs, onMounted } from 'vue'
import { ReadInstruction } from '../ReadInstruction'

interface ReadViewProps {
	instruction: ReadInstruction
}

const props = defineProps<ReadViewProps>()
const { instruction } = toRefs(props)

onMounted(() => {
	console.log(`ReadInstruction mounted with text: ${instruction.value.currentText.value}`)
})
</script>

<template>
	<div class="instruction-view read-view">
		<div
			v-if="instruction.options.prompt"
			class="prompt-text"
			:style="{ color: instruction.resolvedTheme.textColor }"
		>
			{{ instruction.options.prompt }}
		</div>

		<Transition
			name="read-segment"
			mode="out-in"
		>
			<div
				:key="instruction.currentIndex.value"
				class="read-content leading-relaxed"
				:style="{ color: instruction.resolvedTheme.secondaryTextColor }"
			>
				<span
					v-for="(segment, index) in instruction.currentText.value.split('~')"
					:key="index"
					class="inline-block"
					>{{ segment }}</span
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
	transition: opacity 2s ease-in-out, transform 2s ease-in-out;
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
