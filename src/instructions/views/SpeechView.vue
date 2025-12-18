<script setup lang="ts">
import type { SpeechInstruction } from '../SpeechInstruction';

defineProps<{
  instruction: SpeechInstruction
}>();
</script>

<template>
  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
    <!-- Timer Wipe Background -->
    <div v-if="instruction.options.timeout" class="absolute inset-0 -z-5">
        <div class="h-full bg-cyan-600/50 mix-blend-screen shadow-[0_0_50px_rgba(8,145,178,0.5)] w-0" 
             :style="{ animation: `wipe ${instruction.options.timeout}ms linear forwards` }"
        ></div>
    </div>

    <!-- Instructions -->
    <div class="z-10 animate-in fade-in zoom-in duration-300 text-center">
       <h1 class="text-5xl font-bold text-white mb-4 drop-shadow-xl">{{ instruction.options.prompt }}</h1>
    </div>

    <!-- Listening Indicator -->
    <div v-if="instruction.isListening.value" class="absolute bottom-20 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div class="flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-700">
         <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
         <span class="text-xs font-bold text-zinc-300 uppercase tracking-widest">Listening...</span>
      </div>
      <div class="text-white font-mono text-sm opacity-50">
          Target: "{{ instruction.options.targetValue }}"
      </div>
    </div>
  </div>
</template>

<style>
@keyframes wipe {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>