<script setup lang="ts">
import type { GazeInstruction } from '../GazeInstruction';

defineProps<{
  instruction: GazeInstruction
}>();
</script>

<template>
  <div class="absolute inset-0 pointer-events-auto">
    <!-- Timer Wipe -->
    <div v-if="instruction.options.duration" class="absolute inset-0 -z-5 pointer-events-none">
        <div class="h-full bg-cyan-600/50 mix-blend-screen shadow-[0_0_50px_rgba(8,145,178,0.5)] w-0" 
             :style="{ animation: `wipe ${instruction.options.duration}ms linear forwards` }"
        ></div>
    </div>
    
    <!-- Instruction Text -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
       <h1 class="text-5xl font-bold text-white mb-4 drop-shadow-xl">{{ instruction.options.prompt }}</h1>
    </div>

    <!-- Target Element -->
    <div 
      class="absolute w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full blur-sm opacity-80 animate-pulse hover:scale-110 transition-transform duration-75 cursor-crosshair"
      :style="{ top: instruction.position.value.top, left: instruction.position.value.left }"
      @mouseenter="instruction.handleMouseEnter()"
      @mouseleave="instruction.handleMouseLeave()"
    >
        <div class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping" />
    </div>
  </div>
</template>

<style>
@keyframes wipe {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>