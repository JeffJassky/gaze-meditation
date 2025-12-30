<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number // 0 to 1
  isDetected: boolean
  progress: number // 0-100
  theme: {
    accentColor: string
    positiveColor?: string
    [key: string]: any
  }
}>()

const accentColor = computed(() => props.theme.accentColor || '#ffffff')
const positiveColor = computed(() => props.theme.positiveColor || '#4ade80')
</script>

<template>
  <div class="tongue-out-visualizer flex flex-col items-center gap-8">
    <div class="relative w-48 h-48 flex items-center justify-center">
      <!-- Progress Ring -->
      <svg class="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="80"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          class="opacity-10"
        />
        <circle
          cx="96"
          cy="96"
          r="80"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-dasharray="502.6"
          :stroke-dashoffset="502.6 * (1 - progress / 100)"
          stroke-linecap="round"
          class="transition-all duration-300"
          :style="{ color: isDetected ? positiveColor : accentColor }"
        />
      </svg>

      <!-- Emoji/Icon -->
      <div 
        class="text-8xl transition-all duration-300"
        :style="{ 
          opacity: isDetected ? 1 : 0.2,
          transform: isDetected ? 'scale(1.1)' : 'scale(1)'
        }"
      >
        👅
      </div>
    </div>

    <div class="text-sm font-mono uppercase tracking-widest opacity-50">
      {{ isDetected ? 'HOLDING...' : 'STICK OUT TONGUE' }}
    </div>
  </div>
</template>
