<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
  isCorrect: boolean
  score: number // 0-100
  theme: {
    accentColor: string
    positiveColor?: string
    negativeColor?: string
    [key: string]: any
  }
}>()

const accentColor = computed(() => props.theme.accentColor || '#ffffff')
const positiveColor = computed(() => props.theme.positiveColor || '#4ade80')
const negativeColor = computed(() => props.theme.negativeColor || '#f87171')

const arrowRotation = computed(() => {
  switch (props.direction) {
    case 'UP': return '0deg'
    case 'RIGHT': return '90deg'
    case 'DOWN': return '180deg'
    case 'LEFT': return '270deg'
    default: return '0deg'
  }
})
</script>

<template>
  <div class="directional-gaze-visualizer flex flex-col items-center gap-12">
    <!-- Direction Indicator -->
    <div 
      class="direction-arrow text-8xl transition-all duration-500"
      :style="{ 
        transform: `rotate(${arrowRotation}) scale(${isCorrect ? 1.2 : 1})`,
        color: isCorrect ? positiveColor : accentColor,
        filter: isCorrect ? `drop-shadow(0 0 20px ${positiveColor})` : 'none'
      }"
    >
      ↑
    </div>

    <!-- Scoring Progress -->
    <div class="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
      <div 
        class="h-full transition-all duration-300"
        :style="{ 
          width: `${score}%`,
          backgroundColor: score > 50 ? positiveColor : accentColor
        }"
      ></div>
    </div>

    <div class="text-xs font-mono uppercase tracking-widest opacity-50">
      Hold Gaze {{ direction }}
    </div>
  </div>
</template>

<style scoped>
.direction-arrow {
  line-height: 1;
}
</style>
