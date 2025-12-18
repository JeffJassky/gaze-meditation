<template>
  <div class="blink-view" :style="{ color: instruction.resolvedTheme.textColor }">
    <EyeGraphic :openness="instruction.eyeOpennessNormalized.value * 100" />

    <div
      class="message"
      :style="{opacity: 0.8 - instruction.eyeOpennessNormalized.value}"
    >
      <h1 v-if="instruction.status.value === 'FAILED'" :style="{ color: instruction.resolvedTheme.negativeColor }">YOU BLINKED</h1>
      <h1 v-else-if="instruction.status.value === 'SUCCESS'">GOOD</h1>
      <h1 v-else>EYES WIDE</h1>
    </div>

    <div class="timer" :style="{ color: instruction.resolvedTheme.secondaryTextColor }">
      {{ (instruction.timeLeft.value / 1000).toFixed(1) }}s
    </div>

    <div class="debug-stats" :style="{ color: instruction.resolvedTheme.secondaryTextColor }">EAR: {{ instruction.ear.value.toFixed(3) }}</div>
  </div>
</template>

<script setup lang="ts">
import type { BlinkInstruction } from '../BlinkInstruction';
import EyeGraphic from '../../components/EyeGraphic.vue'; // Correct path

const props = defineProps<{
  instruction: BlinkInstruction;
}>();
</script>

<style scoped>
.blink-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  /* color: white; is now set via inline style */
}



.message h1 {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  /* color: #ff3333; is now set via inline style for FAILED state */
}

.timer {
  font-family: monospace;
  font-size: 2rem;
  margin-top: 20px;
  /* color: #666; is now set via inline style */
}

.debug-stats {
    position: absolute;
    bottom: 20px;
    right: 20px;
    font-family: monospace;
    /* color: #444; is now set via inline style */
}
</style>
