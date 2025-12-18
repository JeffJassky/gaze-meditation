<script setup lang="ts">
import { computed, inject } from 'vue'; // ref, Ref are no longer needed
import { SessionState, type Instruction, type ThemeConfig } from '../types'; // Import ThemeConfig
import { DEFAULT_THEME } from '../theme'; // Import DEFAULT_THEME
import NeuralScoreDisplay from './NeuralScoreDisplay.vue';

interface HUDProps {
  state: SessionState;
  currentInstruction?: Instruction;
  score: number;
}

const props = defineProps<HUDProps>();
const emit = defineEmits(['exit']);

const resolvedTheme = inject<ThemeConfig>('resolvedTheme', DEFAULT_THEME); // Inject ThemeConfig directly

// State-based style logic for the main border and shadow
const hudStyles = computed(() => {
  const styles: Record<string, string> = {
    'border-width': '12px',
    'transition': 'all 0.3s'
  };

  switch (props.state) {
    case SessionState.REINFORCING_POS:
      styles['border-color'] = resolvedTheme.positiveColor || DEFAULT_THEME.positiveColor;
      styles['box-shadow'] = `0 0 50px ${resolvedTheme.positiveColor}80`; // Add 80% opacity
      break;
    case SessionState.REINFORCING_NEG:
      styles['border-color'] = resolvedTheme.negativeColor || DEFAULT_THEME.negativeColor;
      styles['box-shadow'] = `0 0 50px ${resolvedTheme.negativeColor}80`; // Add 80% opacity
      break;
    case SessionState.VALIDATING:
      styles['border-color'] = resolvedTheme.accentColor || DEFAULT_THEME.accentColor; // Assuming accentColor for validating state
      break;
    default:
      styles['border-color'] = '#1F2937'; // Default zinc-800
      break;
  }
  return styles;
});


const handleExit = () => {
  emit('exit');
};
</script>

<template>
  <div
    :class="`absolute inset-0 pointer-events-none p-8 flex flex-col justify-between`"
    :style="hudStyles"
  >
    <!-- Top Bar: Metrics & System Status -->
    <NeuralScoreDisplay :score="props.score" :theme="resolvedTheme" />
    <div class="flex justify-between items-start">

    </div>

    <!-- Center: Reinforcement Feedback ONLY (Instructions are in Views now) -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl"
    >
      <h1
        v-if="props.state === SessionState.REINFORCING_POS && props.currentInstruction?.options.positiveReinforcement?.enabled"
        class="text-6xl font-black drop-shadow-[0_0_25px_rgba(74,222,128,0.8)] animate-bounce"
        :style="{ color: resolvedTheme.positiveColor }"
      >
        {{ props.currentInstruction.options.positiveReinforcement.message }}
      </h1>

      <h1
        v-else-if="props.state === SessionState.REINFORCING_NEG && props.currentInstruction?.options.negativeReinforcement?.enabled"
        class="text-6xl font-black drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] glitch-text"
        :style="{ color: resolvedTheme.negativeColor }"
      >
        {{ props.currentInstruction.options.negativeReinforcement.message }}
      </h1>

      <h1
        v-else-if="props.state === SessionState.FINISHED"
        class="text-5xl font-bold"
        :style="{ color: resolvedTheme.textColor }"
      >
        Session Complete
      </h1>
    </div>
  </div>
</template>

<style scoped></style>
