<script setup lang="ts">
import { toRefs, onMounted, computed } from 'vue';
import { ReadInstruction } from '../ReadInstruction'; // Adjust path as necessary

interface ReadViewProps {
  instruction: ReadInstruction;
}

const props = defineProps<ReadViewProps>();
const { instruction } = toRefs(props);

onMounted(() => {
  console.log(`ReadInstruction mounted with text: ${instruction.value.currentText.value}`);
});

const containerStyle = computed(() => {
  const isFading = instruction.value.isFadingOut.value;
  const duration = instruction.value.options.fadeOutDuration || 1000;
  
  if (isFading) {
    return {
      opacity: 0,
      transition: `opacity ${duration}ms ease-out`
    };
  }
  
  return {
    opacity: 1,
    transition: 'opacity 0s'
  };
});
</script>

<template>
  <div class="instruction-view read-view" :style="containerStyle">
    <div 
      v-if="instruction.options.prompt"
      class="prompt-text fade-in" 
      :style="{ color: instruction.resolvedTheme.textColor }"
    >
      {{ instruction.options.prompt }}
    </div>
    <div 
      :key="instruction.currentIndex.value"
      class="read-content leading-relaxed fade-in" 
      :style="{ 
        color: instruction.resolvedTheme.secondaryTextColor,
        animationDelay: instruction.currentIndex.value === 0 ? (instruction.options.delay || 0) / 1000 + 's' : '0s',
        animationDuration: (instruction.options.fadeInDuration || 1000) / 1000 + 's'
      }"
    >
      {{ instruction.currentText.value }}
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
  /* Transition handled by inline style */
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
