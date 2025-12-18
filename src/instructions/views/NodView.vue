<template>
  <div class="nod-view" :style="{ color: instruction.resolvedTheme.textColor }">
    <div class="counter" v-if="instruction.currentStage.value !== 'CALIBRATING'">
      <span v-for="n in instruction.options.nodsRequired" :key="n" 
            class="dot" :class="{ filled: n <= instruction.nodsCompleted.value }"></span>
    </div>

    <div class="guide" v-if="instruction.currentStage.value === 'CALIBRATING'">
      <h1 class="blink">CALIBRATING...</h1>
      <p :style="{ color: instruction.resolvedTheme.secondaryTextColor }">LOOK STRAIGHT AHEAD</p>
    </div>

    <div class="guide" v-else>
      <h1>NOD "YES"</h1>
      <div class="arrow-container">
        <!-- Visual guide based on relative pitch -->
        <div class="arrow up" :class="{ active: instruction.relativePitch.value < instruction.UP_THRESH }">▲</div>
        
        <!-- Normalize position: Pitch / Threshold * Range (e.g. 130px) -->
        <!-- UP (negative pitch) -> moves Up (negative Y) -->
        <!-- DOWN (positive pitch) -> moves Down (positive Y) -->
        <div class="head-dot" :style="{ transform: `translateY(${ (instruction.relativePitch.value / instruction.DOWN_THRESH) * 130 }px)`, backgroundColor: instruction.resolvedTheme.textColor }"></div>
        
        <div class="arrow down" :class="{ active: instruction.relativePitch.value > instruction.DOWN_THRESH }">▼</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NodInstruction } from '../NodInstruction';
import { computed } from 'vue';

const props = defineProps<{
  instruction: NodInstruction;
}>();

const accentColor = computed(() => props.instruction.resolvedTheme.accentColor);
const secondaryTextColor = computed(() => props.instruction.resolvedTheme.secondaryTextColor);

</script>

<style scoped>
.nod-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  /* color: white; is now set via inline style */
}

.counter {
  display: flex;
  gap: 20px;
  margin-bottom: 50px;
}

.dot {
  width: 20px;
  height: 20px;
  border: 2px solid v-bind('instruction.resolvedTheme.textColor');
  border-radius: 50%;
  transition: background 0.3s;
}

.dot.filled {
  background: v-bind(accentColor);
  box-shadow: 0 0 10px v-bind(accentColor);
}

.guide h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.guide p {
    /* color: #888; is now set via inline style */
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
  border-left: 2px dashed v-bind(secondaryTextColor);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.arrow {
  font-size: 2rem;
  color: v-bind(secondaryTextColor);
}

.arrow.active {
  color: v-bind(accentColor);
  text-shadow: 0 0 10px v-bind(accentColor);
}

.head-dot {
  position: absolute;
  top: 50%;
  left: -10px;
  width: 20px;
  height: 20px;
  /* background: white; is now set via inline style */
  border-radius: 50%;
  transition: transform 0.05s linear;
}
</style>
