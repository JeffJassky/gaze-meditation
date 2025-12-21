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

const targetWords = computed(() => {
	const text = props.instruction.options.targetValue
	const transcript = props.instruction.currentTranscript.value.toLowerCase()
	const words = text.split(' ')
	
	let searchIndex = 0
	let sequenceBroken = false

	return words.map((word) => {
		// Clean word for matching (remove punctuation)
		const cleanWord = word.toLowerCase().replace(/[^\w\s]|_/g, "")
		
		if (!cleanWord) return { text: word, isSpoken: true }

		if (sequenceBroken) {
			return { text: word, isSpoken: false }
		}

		const foundIndex = transcript.indexOf(cleanWord, searchIndex)
		const isSpoken = foundIndex !== -1

		if (isSpoken) {
			searchIndex = foundIndex + cleanWord.length
		} else {
			sequenceBroken = true
		}

		return { text: word, isSpoken }
	})
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
		<div class="z-10 animate-in fade-in zoom-in duration-300 text-center px-8 relative">
			<p
				class="text-2xl font-medium mb-4"
				:style="{ color: instruction.resolvedTheme.textColor }"
			>
				{{ instruction.options.prompt }}
			</p>

			<div class="text-6xl font-bold tracking-tight drop-shadow-2xl relative inline-block">
				<span
					v-for="(word, index) in targetWords"
					:key="index"
					class="mx-2 inline-block"
					:style="{
						transition: 'color 500ms ease-in-out, opacity 500ms ease-in-out',
						color: word.isSpoken
							? instruction.resolvedTheme.accentColor
							: instruction.resolvedTheme.textColor,
						opacity: word.isSpoken ? 1 : 0.3,
					}"
				>
					{{ word.text }}
				</span>
        
        <!-- Completion Underline -->
        <div 
          class="absolute bottom-0 left-0 h-1 bg-current rounded-full w-full"
          :style="{
            opacity: targetWords.every(w => w.isSpoken) ? 1 : 0,
            backgroundColor: instruction.resolvedTheme.accentColor || '#fff',
            transform: 'translateY(10px)',
            transition: 'opacity 1.4s ease-out'
          }"
        ></div>
			</div>
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
