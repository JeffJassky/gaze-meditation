<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  targetPosition: { x: number, y: number }
  isSuccess: boolean
  displayNumber: number
  theme: {
    textColor: string
    accentColor: string
    positiveColor?: string
    [key: string]: any
  }
}>()

const bgColor = computed(() => {
  return props.isSuccess 
    ? (props.theme.positiveColor || 'green') 
    : (props.theme.accentColor || 'blue')
})
</script>

<template>
  <div class="calibration-visualizer absolute inset-0 pointer-events-none">
    <!-- Single Moving Target -->
    <div
      class="target-dot absolute w-24 h-24 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-500 ease-in-out"
      :style="{ 
        left: `${targetPosition.x}%`, 
        top: `${targetPosition.y}%`, 
        transform: 'translate(-50%, -50%)',
        backgroundColor: bgColor
      }"
    >
      <div
        v-if="!isSuccess"
        class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"
      ></div>

      <span class="text-4xl font-mono font-bold drop-shadow-lg z-10" :style="{ color: theme.textColor }">
        {{ isSuccess ? '✓' : displayNumber }}
      </span>
    </div>
  </div>
</template>
