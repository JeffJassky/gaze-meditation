<template>
  <div class="type-view">
    <div class="prompt">
      <p>TYPE THE FOLLOWING:</p>
      <h1>{{ instruction.target.value }}</h1>
    </div>

    <div class="input-area" :class="{ error: hasError, success: instruction.isComplete.value }">
      {{ instruction.input.value }}<span class="cursor">|</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TypeInstruction } from '../TypeInstruction';

const props = defineProps<{
  instruction: TypeInstruction;
}>();

const hasError = computed(() => {
    const current = props.instruction.input.value;
    const target = props.instruction.target.value;
    // Check if current input matches the start of target
    return !target.startsWith(current);
});
</script>

<style scoped>
.type-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-family: 'Courier New', Courier, monospace;
}

.prompt p {
  color: #888;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.prompt h1 {
  font-size: 2.5rem;
  color: cyan;
  text-shadow: 0 0 10px cyan;
  margin: 0 0 50px 0;
  letter-spacing: 1px;
}

.input-area {
  font-size: 3rem;
  border-bottom: 2px solid #555;
  min-width: 50%;
  text-align: center;
  padding-bottom: 10px;
}

.input-area.error {
  color: #ff4444;
  border-bottom-color: #ff4444;
}

.input-area.success {
  color: #44ff44;
  border-bottom-color: #44ff44;
}

.cursor {
  animation: blink 1s infinite;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
