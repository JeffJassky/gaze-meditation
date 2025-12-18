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
    <div class="prompt-text fade-in" :style="{ color: instruction.resolvedTheme.textColor }">
      {{ instruction.options.prompt }}
    </div>
    <div class="read-content leading-relaxed fade-in-delay" :style="{ color: instruction.resolvedTheme.secondaryTextColor }">
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

.prompt-text {
  font-size: clamp(1.5rem, 5vw, 4rem); /* Responsive font size */
  font-weight: bold;
  margin-bottom: 2rem;
}

.read-content {
  font-size: clamp(1rem, 3vw, 2.5rem); /* Responsive font size */
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
