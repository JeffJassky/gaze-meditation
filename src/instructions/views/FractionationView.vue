<template>
  <div
    class="fractionation-view"
    :class="{ 'eyes-closed-bg': instruction.status.value === 'CLOSED' }"
    :style="{ color: instruction.resolvedTheme.textColor }"
  >
    <div class="content">
      <h1 v-if="instruction.status.value === 'READY'">GET READY</h1>
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
        v-if="instruction.status.value !== 'READY' && instruction.status.value !== 'FINISHED'"
        :style="{ color: instruction.resolvedTheme.secondaryTextColor }"
      >
        Cycle {{ instruction.currentCycle.value + 1 }} /
        {{ instruction.options.cycles }}
      </p>

      <EyeGraphic :openness="instruction.eyeOpennessNormalized.value * 100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FractionationInstruction } from '../FractionationInstruction';
import EyeGraphic from '../../components/EyeGraphic.vue';

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
  transition: background 1s;
}

.fractionation-view.eyes-closed-bg {
    background: v-bind('props.instruction.resolvedTheme.backgroundColor');
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
    font-family: monospace;
}
</style>