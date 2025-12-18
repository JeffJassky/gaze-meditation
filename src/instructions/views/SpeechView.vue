<script setup lang="ts">
import { computed } from 'vue'
import type { SpeechInstruction } from '../SpeechInstruction'

const props = defineProps<{
	instruction: SpeechInstruction
}>()

const timerWipeColor = computed(() => {
	return props.instruction.resolvedTheme.accentColor
		? `${props.instruction.resolvedTheme.accentColor}50`
		: 'rgba(8,145,178,0.5)' // Add 50% opacity
})

const timerShadowColor = computed(() => {
	return props.instruction.resolvedTheme.accentColor
		? `0 0 50px ${props.instruction.resolvedTheme.accentColor}80`
		: '0 0 50px rgba(8,145,178,0.5)' // Add opacity
})

const pulseShadowColor = computed(() => {
	return props.instruction.resolvedTheme.negativeColor
		? `0 0 10px ${props.instruction.resolvedTheme.negativeColor}`
		: '0 0 10px red'
})
</script>

<template>
	<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
		<!-- Timer Wipe Background -->
		<div
			v-if="instruction.options.timeout"
			class="absolute inset-0 -z-5"
		>
			<div
				class="h-full mix-blend-screen w-0"
				:style="{
					animation: `wipe ${instruction.options.timeout}ms linear forwards`,
					backgroundColor: timerWipeColor,
					boxShadow: timerShadowColor
				}"
			></div>
		</div>

		<!-- Instructions -->
		<div class="z-10 animate-in fade-in zoom-in duration-300 text-center">
			<h1
				class="text-5xl font-bold mb-4 drop-shadow-xl"
				:style="{ color: instruction.resolvedTheme.textColor }"
			>
				{{ instruction.options.prompt }}
			</h1>
		</div>
	</div>
</template>

<style>
@keyframes wipe {
	0% {
		width: 0%;
	}
	100% {
		width: 100%;
	}
}
</style>
