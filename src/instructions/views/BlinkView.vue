<template>
  <div class="blink-view">
    <div class="eye-graphic" :class="{ 'eye-closed': instruction.isBlinking.value }">
      <div class="lid upper"></div>
      <div class="iris"></div>
      <div class="pupil"></div>
      <div class="lid lower"></div>
    </div>

    <div class="message">
      <h1 v-if="instruction.status.value === 'FAILED'">YOU BLINKED</h1>
      <h1 v-else-if="instruction.status.value === 'SUCCESS'">GOOD</h1>
      <h1 v-else>DO NOT BLINK</h1>
    </div>

    <div class="timer">
      {{ (instruction.timeLeft.value / 1000).toFixed(1) }}s
    </div>

    <div class="debug-stats">
        EAR: {{ instruction.ear.value.toFixed(3) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlinkInstruction } from '../BlinkInstruction';

defineProps<{
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
  background: black;
  color: white;
}

.eye-graphic {
  width: 300px;
  height: 150px;
  background: white;
  border-radius: 75% 15%; /* Eye shape rough approx */
  position: relative;
  overflow: hidden;
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iris {
  width: 100px;
  height: 100px;
  background: #33ccff;
  border-radius: 50%;
  position: absolute;
}

.pupil {
  width: 40px;
  height: 40px;
  background: black;
  border-radius: 50%;
  position: absolute;
  z-index: 10;
}

.lid {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  background: #222; /* Skin/Lid color context */
  transition: transform 0.1s;
  z-index: 20;
}

.lid.upper {
  top: 0;
  transform: translateY(-100%);
}

.lid.lower {
  bottom: 0;
  transform: translateY(100%);
}

/* Simulated Blink Visual Feedback */
.eye-graphic.eye-closed .lid.upper {
  transform: translateY(0);
}

.eye-graphic.eye-closed .lid.lower {
  transform: translateY(0);
}

.message h1 {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: #ff3333;
}

.timer {
  font-family: monospace;
  font-size: 2rem;
  margin-top: 20px;
  color: #666;
}

.debug-stats {
    position: absolute;
    bottom: 20px;
    right: 20px;
    font-family: monospace;
    color: #444;
}
</style>
