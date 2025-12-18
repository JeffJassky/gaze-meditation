<script setup lang="ts">
import { computed } from 'vue';
import { SessionState, type Instruction } from '../types';
import NeuralScoreDisplay from './NeuralScoreDisplay.vue';

interface HUDProps {
  state: SessionState;
  currentInstruction?: Instruction;
  score: number;
}

const props = defineProps<HUDProps>();
const emit = defineEmits(['exit']);

// State-based color logic
const getBorderColor = computed(() => {
  switch (props.state) {
    case SessionState.REINFORCING_POS: return 'border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.5)]';
    case SessionState.REINFORCING_NEG: return 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]';
    case SessionState.VALIDATING: return 'border-blue-400';
    default: return 'border-zinc-800';
  }
});



const handleExit = () => {
  emit('exit');
};
</script>

<template>
  <div
    :class="`absolute inset-0 pointer-events-none p-8 flex flex-col justify-between transition-all duration-300 border-[12px] ${getBorderColor}`"
  >
    <!-- Top Bar: Metrics & System Status -->
    <NeuralScoreDisplay :score="props.score" />
    <div class="flex justify-between items-start">

    </div>

    <!-- Center: Reinforcement Feedback ONLY (Instructions are in Views now) -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl"
    >
      <h1
        v-if="props.state === SessionState.REINFORCING_POS && props.currentInstruction?.options.positiveReinforcement?.enabled"
        class="text-6xl font-black text-green-400 drop-shadow-[0_0_25px_rgba(74,222,128,0.8)] animate-bounce"
      >
        {{ props.currentInstruction.options.positiveReinforcement.message }}
      </h1>

      <h1
        v-else-if="props.state === SessionState.REINFORCING_NEG && props.currentInstruction?.options.negativeReinforcement?.enabled"
        class="text-6xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] glitch-text"
      >
        {{ props.currentInstruction.options.negativeReinforcement.message }}
      </h1>

      <h1
        v-else-if="props.state === SessionState.FINISHED"
        class="text-5xl font-bold text-white"
      >
        Session Complete
      </h1>
    </div>
  </div>
</template>

<style scoped></style>
