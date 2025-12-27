<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  openness: number // 0 to 100
  color?: string
}>()

// Simplified version of the EyeGraphic, adapted for the new structure
// Assuming we might want to pass the color from the theme
</script>

<template>
  <div class="eye-graphic-container">
    <div 
      class="eye-graphic"
      :style="{
        '--openness': `${openness}%`,
        '--color': color || 'currentColor'
      }"
    >
      <!-- Upper Lid -->
      <div class="lid upper"></div>
      <!-- Lower Lid -->
      <div class="lid lower"></div>
      <!-- Iris/Pupil -->
      <div class="iris"></div>
    </div>
  </div>
</template>

<style scoped>
.eye-graphic-container {
  width: 200px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-graphic {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* Masking to create eye shape */
  clip-path: ellipse(50% 50% at 50% 50%);
  background: rgba(255, 255, 255, 0.1);
}

.iris {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: var(--color);
  border-radius: 50%;
  box-shadow: 0 0 20px var(--color);
}

.lid {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  background: #000; /* Or background color of the scene? */
  transition: transform 0.1s ease-out;
  z-index: 10;
}

.lid.upper {
  top: 0;
  transform: translateY(calc((100% - var(--openness)) * -1));
}

.lid.lower {
  bottom: 0;
  transform: translateY(calc(100% - var(--openness)));
}
</style>
