<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'YES' | 'NO'
  pitchState?: number // -1, 0, 1 (for vertical/YES)
  yawState?: number // -1, 0, 1 (for horizontal/NO)
  nodsCompleted: number
  nodsRequired: number
  theme: {
    textColor: string
    accentColor: string
    secondaryTextColor?: string
    [key: string]: any
  }
}>()

// Clamping / Smoothing Logic
const CLAMP_PX = 110 

const verticalOffset = computed(() => {
  const state = props.pitchState || 0
  return state * CLAMP_PX
})

const horizontalOffset = computed(() => {
  const state = props.yawState || 0
  return state * CLAMP_PX
})

const accentColor = computed(() => props.theme.accentColor || '#ffffff')
</script>

<template>
  <div class="nod-visualizer">
    
    <!-- Repetition Counter Dots -->
    <div class="counter mb-12">
      <span
        v-for="n in nodsRequired"
        :key="n"
        class="dot"
        :class="{ filled: n <= nodsCompleted }"
        :style="{ 
          borderColor: theme.textColor,
          backgroundColor: n <= nodsCompleted ? accentColor : 'transparent',
          boxShadow: n <= nodsCompleted ? `0 0 10px ${accentColor}` : 'none'
        }"
      ></span>
    </div>

    <!-- Toggle Switch Visuals -->
    <div class="guide relative">
      <p class="action-text mb-8" :style="{ color: theme.secondaryTextColor }">
        {{ type === 'NO' ? 'Shake your head "no".' : 'Nod your head "yes".' }}
      </p>

      <!-- Vertical Layout (YES) -->
      <div
        v-if="type !== 'NO'"
        class="toggle-track vertical"
        :style="{ borderColor: theme.secondaryTextColor }"
      >
        <div
          class="toggle-thumb"
          :style="{
            transform: `translate(-50%, calc(-50% + ${verticalOffset}px))`,
            backgroundColor: theme.textColor
          }"
        ></div>
      </div>

      <!-- Horizontal Layout (NO) -->
      <div
        v-if="type === 'NO'"
        class="toggle-track horizontal"
        :style="{ borderColor: theme.secondaryTextColor }"
      >
        <div
          class="toggle-thumb"
          :style="{
            transform: `translate(calc(-50% + ${horizontalOffset}px), -50%)`,
            backgroundColor: theme.textColor
          }"
        ></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.nod-visualizer {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.counter {
  display: flex;
  gap: 20px;
}

.dot {
  width: 20px;
  height: 20px;
  border: 2px solid;
  border-radius: 50%;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.action-text {
  font-size: 1.2rem;
  opacity: 0.8;
  text-align: center;
}

.toggle-track {
  position: relative;
  border-width: 4px;
  border-style: solid;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.toggle-track.vertical {
  width: 100px;
  height: 350px;
}

.toggle-track.horizontal {
  width: 350px;
  height: 100px;
}

.toggle-thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  transition: transform 0.25s ease-out;
}
</style>
