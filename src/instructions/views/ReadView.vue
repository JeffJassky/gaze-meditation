<script setup lang="ts">
import { toRefs, onMounted } from 'vue';
import { ReadInstruction } from '../ReadInstruction'; // Adjust path as necessary

interface ReadViewProps {
  instruction: ReadInstruction;
}

const props = defineProps<ReadViewProps>();
const { instruction } = toRefs(props);

onMounted(() => {
  console.log(`ReadInstruction mounted with text: ${instruction.value.text}`);
});
</script>

<template>
  <div class="instruction-view read-view">
    <div class="prompt-text text-white text-4xl font-bold mb-8 fade-in">
      {{ instruction.prompt }}
    </div>
    <div class="read-content text-zinc-300 text-2xl leading-relaxed fade-in-delay">
      {{ instruction.text }}
    </div>
  </div>
</template>

<style scoped>
.instruction-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.fade-in-delay {
  animation: fadeIn 1.5s ease-out forwards;
  animation-delay: 0.5s;
  opacity: 0; /* Start invisible */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
