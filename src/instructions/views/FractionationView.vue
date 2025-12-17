<template>
  <div class="fractionation-view" :class="{ 'eyes-closed': instruction.status.value === 'CLOSED' }">
    <div class="content">
      <h1 v-if="instruction.status.value === 'OPEN'">OPEN</h1>
      <h1 v-else-if="instruction.status.value === 'CLOSED'">CLOSE</h1>
      <h1 v-else-if="instruction.status.value === 'FINISHED'">COMPLETE</h1>
      <h1 v-else>PREPARE</h1>

      <p class="cycle-info">Cycle {{ instruction.currentCycle.value + 1 }} / {{ instruction.options.cycles }}</p>
      
      <div class="visual-eye">
          <div class="lid" :style="{ height: instruction.status.value === 'CLOSED' ? '50%' : '0%' }"></div>
          <div class="lid bottom" :style="{ height: instruction.status.value === 'CLOSED' ? '50%' : '0%' }"></div>
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

.fractionation-view.eyes-closed {
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

.lid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: #000;
    transition: height 0.5s ease-in-out;
    border-bottom: 1px solid #333;
}

.lid.bottom {
    top: auto;
    bottom: 0;
    border-bottom: none;
    border-top: 1px solid #333;
}
</style>
