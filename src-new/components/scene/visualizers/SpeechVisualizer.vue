<script setup lang="ts">
import { computed } from 'vue'

interface WordStatus {
  text: string
  isSpoken: boolean
}

const props = defineProps<{
  words: WordStatus[]
  isComplete?: boolean
  theme: {
    textColor: string
    accentColor: string
    [key: string]: any
  }
}>()

const accentColor = computed(() => props.theme.accentColor || '#ffffff')
const textColor = computed(() => props.theme.textColor || '#ffffff')
</script>

<template>
  <div class="speech-visualizer text-6xl font-bold tracking-tight drop-shadow-2xl relative inline-block text-center">
    <span
      v-for="(word, index) in words"
      :key="index"
      class="mx-2 inline-block transition-all duration-500"
      :style="{
        color: word.isSpoken ? accentColor : textColor,
        opacity: word.isSpoken ? 1 : 0.3
      }"
    >
      {{ word.text }}
    </span>

    <!-- Completion Underline -->
    <div
      class="absolute bottom-0 left-0 h-1 bg-current rounded-full w-full"
      :style="{
        opacity: isComplete ? 1 : 0,
        backgroundColor: accentColor,
        transform: 'translateY(10px)',
        transition: 'opacity 1.4s ease-out'
      }"
    ></div>
  </div>
</template>
