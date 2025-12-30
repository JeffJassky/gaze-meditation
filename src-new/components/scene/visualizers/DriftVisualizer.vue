<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  driftX: number
  driftY: number
  driftRatio: number // 0 to 1 (amount of drift relative to tolerance)
  size?: number
  theme: {
    positiveColor?: string
    negativeColor?: string
    [key: string]: any
  }
  tolerance?: number // To calculate scaling logic if needed, but driftRatio might be enough
}>(), {
  size: 300
})

const OUTER_SIZE = props.size
const DISC_RATIO = 0.9
const BORDER_WIDTH = 8

const radius = OUTER_SIZE / 2 - 4

function hexToRgb(hex: string) {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
	hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
			r: parseInt(result[1]!, 16),
			g: parseInt(result[2]!, 16),
			b: parseInt(result[3]!, 16)
		  }
		: { r: 0, g: 0, b: 0 }
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(c1.r + factor * (c2.r - c1.r))
  const g = Math.round(c1.g + factor * (c2.g - c1.g))
  const b = Math.round(c1.b + factor * (c2.b - c1.b))
  return `rgb(${r}, ${g}, ${b})`
}

const indicatorColor = computed(() => {
  const startColor = props.theme.positiveColor || '#ffffff'
  const endColor = props.theme.negativeColor || '#ff0000'
  const factor = Math.min(1, Math.max(0, props.driftRatio))
  return interpolateColor(startColor, endColor, factor)
})

const cursorStyle = computed(() => {
  const boundaryDiameter = OUTER_SIZE - BORDER_WIDTH * 2
  const discDiameter = boundaryDiameter * DISC_RATIO
  const maxTravel = (boundaryDiameter - discDiameter) / 2
  
  // If we assume driftX/Y are standardized or raw, we need to know how to map them.
  // The original component had complex logic mapping driftX/Y + driftXPos/YPos.
  // Here we assume the parent passes us the FINAL calculated offset in pixels or a normalized unit.
  // To keep it simple for now, let's assume driftX/Y are passed in as "normalized drift" where 1.0 = tolerance.
  // So we multiply by maxTravel.
  
  const x = props.driftX * maxTravel
  const y = props.driftY * maxTravel

  return {
    width: `${discDiameter}px`,
    height: `${discDiameter}px`,
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
    opacity: 0.8,
    backgroundColor: indicatorColor.value,
    filter: `drop-shadow(0 0 8px ${indicatorColor.value})`
  }
})
</script>

<template>
  <div class="drift-visualizer">
    <svg :width="OUTER_SIZE" :height="OUTER_SIZE" class="progress-ring">
      <circle
        class="progress-ring-fill"
        :cx="OUTER_SIZE / 2"
        :cy="OUTER_SIZE / 2"
        :r="radius"
        :stroke-width="BORDER_WIDTH"
        :stroke="indicatorColor"
        fill="none"
        stroke-linecap="round"
        :style="{ filter: `drop-shadow(0 0 8px ${indicatorColor})` }"
      />
    </svg>
    
    <div class="cursor" :style="cursorStyle"></div>
  </div>
</template>

<style scoped>
.drift-visualizer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px; /* Match OUTER_SIZE */
  height: 300px;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

.progress-ring-fill {
  transition: stroke 0.5s ease-in-out;
}

.cursor {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transition: transform 0.1s ease-out, background-color 0.2s ease-out;
}
</style>
