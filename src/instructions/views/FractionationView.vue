<template>
  <div
    class="fractionation-view"
    :class="{ 'eyes-closed-bg': instruction.status.value === 'CLOSED' }"
  >
    <div class="content">
      <h1 v-if="instruction.status.value === 'READY'">GET READY</h1>
      <h1 v-else-if="instruction.status.value === 'OBSERVING'">OBSERVING...</h1>
      <h1 v-else-if="instruction.status.value === 'WAITING_FOR_OPEN'">
        OPEN EYES
      </h1>
      <h1 v-else-if="instruction.status.value === 'OPEN'">OPEN</h1>
      <h1 v-else-if="instruction.status.value === 'WAITING_FOR_CLOSED'">
        CLOSE EYES
      </h1>
      <h1 v-else-if="instruction.status.value === 'CLOSED'">CLOSE</h1>
      <h1 v-else-if="instruction.status.value === 'FINISHED'">COMPLETE</h1>

      <p
        class="cycle-info"
        v-if="instruction.status.value !== 'READY' && instruction.status.value !== 'FINISHED' && instruction.status.value !== 'OBSERVING'"
      >
        Cycle {{ instruction.currentCycle.value + 1 }} /
        {{ instruction.options.cycles }}
      </p>

      <p v-if="instruction.status.value === 'OBSERVING'">
        Please look at the screen naturally.
      </p>

      <EyeGraphic :openness="instruction.eyeOpennessNormalized.value * 100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FractionationInstruction } from '../FractionationInstruction';
import EyeGraphic from '../../components/EyeGraphic.vue'; // Correct path

const props = defineProps<{
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


</style>
