<script setup lang="ts">
import { computed } from 'vue';
import { SessionState, type Instruction } from '../types';

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
    case SessionState.REINFORCING_POS: return 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]';
    case SessionState.REINFORCING_NEG: return 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]';
    case SessionState.VALIDATING: return 'border-blue-400';
    default: return 'border-zinc-800';
  }
});

const formattedScore = computed(() => props.score.toString().padStart(6, '0'));
const instructionMode = computed(() => props.currentInstruction?.constructor.name || '--');
const instructionId = computed(() => props.currentInstruction?.options.id || '--');

const handleExit = () => {
  emit('exit');
};
</script>

<template>
  <div :class="`absolute inset-0 pointer-events-none p-8 flex flex-col justify-between transition-all duration-300 border-[12px] ${getBorderColor}`">
    
    <!-- Top Bar: Metrics & System Status -->
    <div class="flex justify-between items-start">
      <div class="bg-black/80 backdrop-blur-md px-6 py-3 rounded-br-2xl border-l-4 border-zinc-500">
        <h2 class="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Neural Score</h2>
        <span class="text-4xl font-mono text-white tracking-tighter">{{ formattedScore }}</span>
      </div>

      <div class="flex flex-col items-end gap-2 pointer-events-auto">
           <button 
              @click="handleExit"
              class="bg-red-900/80 hover:bg-red-700 text-red-200 px-4 py-1 text-xs uppercase tracking-widest rounded border border-red-500 transition-colors"
          >
              Emergency Stop (ESC)
          </button>
          <div class="flex items-center gap-2">
              <div :class="`w-2 h-2 rounded-full ${props.state === SessionState.IDLE ? 'bg-zinc-600' : 'bg-green-500 animate-pulse'}`" />
              <span class="text-xs text-zinc-500 font-mono uppercase">System Active</span>
          </div>
      </div>
    </div>

    <!-- Center: Reinforcement Feedback ONLY (Instructions are in Views now) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl">
       <h1 v-if="props.state === SessionState.REINFORCING_POS" class="text-6xl font-black text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.8)] animate-bounce">
           REINFORCED
       </h1>

      <h1 v-else-if="props.state === SessionState.REINFORCING_NEG" class="text-6xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] glitch-text">
           CORRECTION REQUIRED
       </h1>
       
       <h1 v-else-if="props.state === SessionState.FINISHED" class="text-5xl font-bold text-white">Session Complete</h1>
    </div>

    <!-- Bottom Bar: Debug/Technical Info -->
    <div class="flex justify-between items-end text-zinc-600 font-mono text-xs">
       <div>
          ID: {{ instructionId }} <br/>
          MODE: {{ instructionMode }}
       </div>
       <div class="text-right">
          NCRS v2.1.0 <br/>
          LATENCY: 12ms
       </div>
    </div>
  </div>
</template>

<style scoped>
</style>
