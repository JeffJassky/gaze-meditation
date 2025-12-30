<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  openness: number // 0 to ~1.0 (relative)
  threshold: number
  isHolding: boolean
  progress: number // 0-100
  theme: {
    accentColor: string
    textColor: string
    positiveColor?: string
    [key: string]: any
  }
}>()

const heightPercent = computed(() => {
  // Map 0-0.5 openness to 0-100% height visually
  return Math.min(100, Math.max(0, props.openness * 200))
})

const color = computed(() => {
  return props.isHolding ? (props.theme.positiveColor || '#4ade80') : props.theme.accentColor
})
</script>

<template>
  <div class="relax-jaw-visualizer flex flex-col items-center gap-4">
    <div class="h-[300px] w-[60px] bg-zinc-800/50 rounded-full border-2 border-zinc-700 relative overflow-hidden">
      <!-- Threshold Line -->
      <div 
        class="absolute w-full h-[2px] bg-white/50 z-10 border-t border-dashed border-black/50"
        :style="{ bottom: `${Math.min(100, threshold * 200)}%` }"
      ></div>

      <!-- Fill -->
      <div 
        class="absolute bottom-0 w-full transition-all duration-100 ease-out bg-opacity-80"
        :style="{ 
          height: `${heightPercent}%`,
          backgroundColor: color
        }"
      ></div>
    </div>

    <div class="text-sm font-mono opacity-50" :style="{ color: theme.textColor }">
      {{ isHolding ? 'HOLDING...' : 'RELAX JAW' }}
    </div>
  </div>
</template>
