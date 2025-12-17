<template>
  <div class="nod-view">
    <div class="counter" v-if="instruction.currentStage.value !== 'CALIBRATING'">
      <span v-for="n in instruction.options.nodsRequired" :key="n" 
            class="dot" :class="{ filled: n <= instruction.nodsCompleted.value }"></span>
    </div>

    <div class="guide" v-if="instruction.currentStage.value === 'CALIBRATING'">
      <h1 class="blink">CALIBRATING...</h1>
      <p>LOOK STRAIGHT AHEAD</p>
    </div>

    <div class="guide" v-else>
      <h1>NOD "YES"</h1>
      <div class="arrow-container">
        <!-- Visual guide based on relative pitch -->
        <div class="arrow up" :class="{ active: instruction.relativePitch.value < -0.08 }">▲</div>
        <div class="head-dot" :style="{ transform: `translateY(${instruction.relativePitch.value * 300}px)` }"></div>
        <div class="arrow down" :class="{ active: instruction.relativePitch.value > 0.08 }">▼</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NodInstruction } from '../NodInstruction';

defineProps<{
  instruction: NodInstruction;
}>();
</script>

<style scoped>
.nod-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.counter {
  display: flex;
  gap: 20px;
  margin-bottom: 50px;
}

.dot {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-radius: 50%;
  transition: background 0.3s;
}

.dot.filled {
  background: cyan;
  box-shadow: 0 0 10px cyan;
}

.guide h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.guide p {
    color: #888;
    letter-spacing: 2px;
}

.blink {
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.arrow-container {
  position: relative;
  height: 300px;
  width: 100px;
  border-left: 2px dashed #555;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.arrow {
  font-size: 2rem;
  color: #333;
}

.arrow.active {
  color: cyan;
  text-shadow: 0 0 10px cyan;
}

.head-dot {
  position: absolute;
  top: 50%;
  left: -10px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.05s linear;
}
</style>
