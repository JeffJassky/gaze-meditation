<script setup lang="ts">
import type { CalibrationInstruction } from '../CalibrationInstruction';

defineProps<{
  instruction: CalibrationInstruction
}>();
</script>

<template>
  <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
    <!-- Instruction Text -->
    <h1 class="text-4xl font-bold text-white mb-8 drop-shadow-md text-center fixed top-10 w-full">
      Look at the DOT and say the number
    </h1>

    <!-- Single Moving Target -->
    <div 
      class="absolute w-24 h-24 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-500 ease-in-out"
      :class="instruction.isSuccess.value ? 'bg-green-500 scale-110' : 'bg-blue-500'"
      :style="{ 
        left: `${instruction.targetPosition.value.x}%`, 
        top: `${instruction.targetPosition.value.y}%`, 
        transform: 'translate(-50%, -50%)' 
      }"
    >
      <div v-if="!instruction.isSuccess.value" class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
      
      <span class="text-4xl font-mono font-bold text-white drop-shadow-lg z-10">
        {{ instruction.isSuccess.value ? '✓' : instruction.currentDisplayNumber.value }}
      </span>
    </div>

    <!-- Debug Dot -->
    <div 
      v-if="instruction.currentGaze.value"
      class="fixed w-6 h-6 bg-yellow-400 rounded-full border-2 border-black z-[9999] pointer-events-none transition-all duration-75 ease-linear"
      :style="{ 
          left: `${instruction.currentGaze.value.x}px`, 
          top: `${instruction.currentGaze.value.y}px`,
          transform: 'translate(-50%, -50%)' 
      }"
    ></div>
    
    <!-- Raw Data Debug -->
    <div class="fixed top-4 left-4 z-[9999] font-mono font-bold bg-black/50 p-2 rounded text-white" v-if="instruction.currentGaze.value">
        <div>
            GAZE: {{ Math.round(instruction.currentGaze.value.x) }}, {{ Math.round(instruction.currentGaze.value.y) }}
        </div>
    </div>
  </div>
</template>
