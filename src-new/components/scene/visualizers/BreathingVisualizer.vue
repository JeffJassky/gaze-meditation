<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  signal: number // Breath signal value for scaling
  velocity: number // Breath velocity for text guidance
  theme: {
    positiveColor?: string
    secondaryTextColor?: string
    [key: string]: any
  }
  duration?: number // Optional duration for progress ring if needed, though Scene handles generic progress
}>()

const guideText = computed(() => {
  if (props.velocity > 0.005) return 'Breathe.' // or Inhale? Original said 'Breathe.' for all states but had conditional logic ready
  if (props.velocity < -0.005) return 'Breathe.'
  return 'Breathe.'
})

const circleColor = computed(() => props.theme.positiveColor || '#00ffff')
</script>

<template>
  <div class="breathing-visualizer">
    <div class="visualizer-container">
      <div class="guide-text">
        {{ guideText }}
      </div>
      
      <!-- Breath Circle -->
      <div 
        class="breath-circle"
        :style="{
          transform: `scale(${1 + signal * 0.3})`,
          backgroundColor: circleColor + '20', // Low opacity fill
          boxShadow: `
            0 0 40px ${circleColor}ff, 
            inset 0 0 60px ${circleColor}ff
          `,
          borderColor: circleColor
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.breathing-visualizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 300px;
  height: 300px;
}

.visualizer-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.breath-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid transparent; 
  transition: transform 0.1s linear, background-color 0.5s ease;
  will-change: transform;
}

.guide-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  z-index: 10;
  pointer-events: none;
}
</style>
