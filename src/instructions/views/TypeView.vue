<template>
  <div
    class="type-view"
    :style="{ opacity: 1 - (instruction.progress.value / 100), color: instruction.resolvedTheme.textColor }"
  >
    <div class="prompt">
      <p :style="{ color: instruction.resolvedTheme.secondaryTextColor }">
        TYPE THE FOLLOWING:
      </p>
      <h1
        :style="{ color: instruction.resolvedTheme.accentColor, textShadow: `0 0 10px ${instruction.resolvedTheme.accentColor}` }"
      >
        {{ instruction.target.value }}
      </h1>
    </div>

    <div
      class="input-area"
      :class="{ error: hasError, success: instruction.isComplete.value }"
      :style="inputAreaStyles"
    >
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

const inputAreaStyles = computed(() => {
  let borderColor = props.instruction.resolvedTheme.secondaryTextColor;
  let textColor = props.instruction.resolvedTheme.textColor;

  if (props.instruction.isComplete.value) {
    borderColor = props.instruction.resolvedTheme.positiveColor;
    textColor = props.instruction.resolvedTheme.positiveColor;
  } else if (hasError.value) {
    borderColor = props.instruction.resolvedTheme.negativeColor;
    textColor = props.instruction.resolvedTheme.negativeColor;
  }

  return {
    borderColor: borderColor,
    color: textColor
  };
});
</script>

<style scoped>
.type-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  transition: opacity 0.5s;
}

.prompt p {
  /* color: #888; is now set via inline style */
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.prompt h1 {
  font-size: 2.5rem;
  /* color: cyan; text-shadow: 0 0 10px cyan; are now set via inline style */
  margin: 0 0 50px 0;
  letter-spacing: 1px;
}

.input-area {
  font-size: 3rem;
  border-bottom: 2px solid; /* color set via inline style */
  min-width: 50%;
  text-align: center;
  padding-bottom: 10px;
}

/* These are now handled by inline styles
.input-area.error {
  color: #ff4444;
  border-bottom-color: #ff4444;
}

.input-area.success {
  color: #44ff44;
  border-bottom-color: #44ff44;
}
*/

.cursor {
  animation: blink 1s infinite;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
