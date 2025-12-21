<template>
	<div
		class="type-view"
		:style="{
			opacity: instruction.isComplete.value ? 1 : 1 - instruction.progress.value / 100,
			color: instruction.resolvedTheme.textColor
		}"
		@click="focusInput"
	>
		<div class="prompt">
			<p :style="{ color: instruction.resolvedTheme.secondaryTextColor }">
				Type the following:
			</p>
			<h1
				:style="{
					color: instruction.resolvedTheme.accentColor,
					textShadow: `0 0 10px ${instruction.resolvedTheme.accentColor}`
				}"
			>
				{{ instruction.target.value }}
			</h1>
		</div>

		<!-- Hidden input to capture mobile keyboard events -->
		<input
			ref="hiddenInput"
			type="text"
			class="hidden-input"
			:value="instruction.input.value"
			@input="handleInput"
			@blur="refocus"
			autofocus
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
		/>

		<div
			class="input-area"
			:class="{ error: hasError, success: instruction.isComplete.value }"
			:style="inputAreaStyles"
		>
			{{ instruction.input.value }}<span class="cursor">|</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { TypeInstruction } from '../TypeInstruction'

const props = defineProps<{
	instruction: TypeInstruction
}>()

const hiddenInput = ref<HTMLInputElement | null>(null)

const hasError = computed(() => {
	const current = props.instruction.input.value
	const target = props.instruction.target.value
	// Check if current input matches the start of target
	return !target.startsWith(current)
})

const inputAreaStyles = computed(() => {
	let borderColor = props.instruction.resolvedTheme.secondaryTextColor
	let textColor = props.instruction.resolvedTheme.textColor

	if (props.instruction.isComplete.value) {
		borderColor = props.instruction.resolvedTheme.positiveColor
		textColor = props.instruction.resolvedTheme.positiveColor
	} else if (hasError.value) {
		borderColor = props.instruction.resolvedTheme.negativeColor
		textColor = props.instruction.resolvedTheme.negativeColor
	}

	return {
		borderColor: borderColor,
		color: textColor
	}
})

const handleInput = (e: Event) => {
	const target = e.target as HTMLInputElement
	props.instruction.handleInputUpdate(target.value)
}

const focusInput = () => {
	hiddenInput.value?.focus()
}

const refocus = () => {
	if (!props.instruction.isComplete.value) {
		setTimeout(() => {
			hiddenInput.value?.focus()
		}, 10)
	}
}

onMounted(() => {
	focusInput()
})
</script>

<style scoped>
.type-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	transition: opacity 0.5s;
	cursor: text;
}

.hidden-input {
	position: absolute;
	opacity: 0;
	pointer-events: none;
	z-index: -1;
}

.prompt p {
	letter-spacing: 2px;
	margin-bottom: 10px;
}

.prompt h1 {
	font-size: 2.5rem;
	margin: 0;
	letter-spacing: 1px;
}

.input-area {
	font-size: 3rem;
	border-bottom: 2px solid;
	min-width: 50%;
	text-align: center;
	padding-bottom: 10px;
	word-break: break-all;
}

.cursor {
	animation: blink 1s infinite;
	opacity: 0.7;
}

@keyframes blink {
	0%,
	100% {
		opacity: 0;
	}
	50% {
		opacity: 1;
	}
}
</style>
