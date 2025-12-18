<template>
  <div class="relax-jaw-view" :style="{ color: instruction.resolvedTheme.textColor }">
    <h1 class="prompt">{{ instruction.options.prompt }}</h1>

    <!-- Visualizer hidden for now per user request -->

    <div v-if="instruction.options.duration && instruction.options.duration > 0" 
         class="progress-track"
         :style="{ backgroundColor: instruction.resolvedTheme.secondaryTextColor + '33' }">
      <div class="progress-fill" 
           :style="{ 
             width: instruction.progress.value + '%', 
             backgroundColor: instruction.resolvedTheme.accentColor 
           }">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { computed } from 'vue'; // Unused while visualizer is hidden
import type { RelaxJawInstruction } from '../RelaxJawInstruction';

// const props = defineProps<{ // Unused var warning if we don't use props in script
//   instruction: RelaxJawInstruction;
// }>();
// But we use 'instruction' in template, which is fine with defineProps.
defineProps<{
  instruction: RelaxJawInstruction;
}>();


/* Visualizer Logic - Commented out
const MAX_PIXELS = 100; 
const SENSITIVITY = 500; 

const targetGapPx = computed(() => {
    const thresh = props.instruction.options.threshold || 0.15;
    return Math.min(MAX_PIXELS, thresh * SENSITIVITY);
});

const currentGapPx = computed(() => {
    return Math.min(MAX_PIXELS * 1.5, Math.max(0, props.instruction.relativeOpenness.value * SENSITIVITY));
});

const jawColor = computed(() => {
    if (props.instruction.isJawOpen.value) {
        return props.instruction.resolvedTheme.positiveColor || '#00ff00';
    }
    return props.instruction.resolvedTheme.textColor;
});
*/

</script>

<style scoped>
.relax-jaw-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: relative;
}

.prompt {
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 3rem;
  text-align: center;
  z-index: 10;
}

/* 
.visualizer-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.visualizer { ... }
.target-zone { ... }
.jaw { ... }
*/

.progress-track {
    width: 300px;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    /* margin-bottom: 50px; Remove bottom margin since we are centering everything */
}

.progress-fill {
    height: 100%;
    transition: width 0.1s linear;
}
</style>