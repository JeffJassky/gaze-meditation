<template>
  <div class="fractionation-view" :class="{ 'eyes-closed-bg': instruction.status.value === 'CLOSED' }">
    <div class="content">
      <h1 v-if="instruction.status.value === 'READY'">GET READY</h1>
      <h1 v-else-if="instruction.status.value === 'OBSERVING'">OBSERVING...</h1>
      <h1 v-else-if="instruction.status.value === 'WAITING_FOR_OPEN'">OPEN EYES</h1>
      <h1 v-else-if="instruction.status.value === 'OPEN'">OPEN</h1>
      <h1 v-else-if="instruction.status.value === 'WAITING_FOR_CLOSED'">CLOSE EYES</h1>
      <h1 v-else-if="instruction.status.value === 'CLOSED'">CLOSE</h1>
      <h1 v-else-if="instruction.status.value === 'FINISHED'">COMPLETE</h1>

      <p class="cycle-info" v-if="instruction.status.value !== 'READY' && instruction.status.value !== 'FINISHED' && instruction.status.value !== 'OBSERVING'">
        Cycle {{ instruction.currentCycle.value + 1 }} / {{ instruction.options.cycles }}
      </p>
      
      <p v-if="instruction.status.value === 'OBSERVING'">Please look at the screen naturally.</p>

      <div class="visual-eye" :class="{ blink: instruction.status.value === 'WAITING_FOR_OPEN' || instruction.status.value === 'WAITING_FOR_CLOSED' }">
          <div class="lid upper" :style="{ height: instruction.status.value === 'CLOSED' ? '50%' : '0%' }"></div>
          <div class="lid lower" :style="{ height: instruction.status.value === 'CLOSED' ? '50%' : '0%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FractionationInstruction } from '../FractionationInstruction';

defineProps<{
  instruction: FractionationInstruction;
}>();
</script>

<style scoped>
.fractionation-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  transition: background 1s;
}

.fractionation-view.eyes-closed-bg {
    background: #000;
}

.content {
    z-index: 10;
    text-align: center;
}

h1 {
  font-size: 5rem;
  letter-spacing: 10px;
  font-weight: 100;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.cycle-info {
    color: #555;
    font-family: monospace;
}

.visual-eye {
    width: 200px;
    height: 200px;
    border: 2px solid #333;
    border-radius: 50%;
    margin-top: 50px;
    position: relative;
    overflow: hidden;
    background: #111;
}
/* Re-style lids to be upper/lower for consistency */
.lid {
    position: absolute;
    left: 0;
    width: 100%;
    background: #000;
    transition: height 0.5s ease-in-out;
    border-bottom: 1px solid #333;
}

.lid.upper {
    top: 0;
}

.lid.lower {
    top: auto;
    bottom: 0;
    border-bottom: none;
    border-top: 1px solid #333;
}

/* Blink animation for waiting state */
.visual-eye.blink .lid.upper,
.visual-eye.blink .lid.lower {
    animation: pulse-lids 1.5s infinite alternate;
}

@keyframes pulse-lids {
    0% { height: 0%; }
    100% { height: 10%; } /* Slight closing effect */
}
</style>
