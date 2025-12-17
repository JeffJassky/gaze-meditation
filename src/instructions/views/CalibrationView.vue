<script setup lang="ts">
import type { CalibrationInstruction } from '../CalibrationInstruction';

defineProps<{
  instruction: CalibrationInstruction
}>();
</script>

<template>
  <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
    <!-- Instruction Text -->
    <h1 class="text-4xl font-bold text-white mb-8 drop-shadow-md text-center">
      {{ instruction.currentStep.value === 'left' 
         ? "Look at the LEFT dot and count down" 
         : "Look at the RIGHT dot and count down" 
      }}
    </h1>

    <!-- Left Target -->
    <div 
      v-if="instruction.currentStep.value === 'left'"
      class="absolute w-24 h-24 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center"
      style="left: 10%; top: 50%; transform: translate(-50%, -50%);"
    >
      <div class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
      <span class="text-4xl font-mono font-bold text-white drop-shadow-lg z-10">{{ instruction.currentCount.value }}</span>
    </div>

    <!-- Right Target -->
    <div 
      v-if="instruction.currentStep.value === 'right'"
      class="absolute w-24 h-24 bg-blue-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)] flex items-center justify-center"
      style="right: 10%; top: 50%; transform: translate(50%, -50%);"
    >
      <div class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
      <span class="text-4xl font-mono font-bold text-white drop-shadow-lg z-10">{{ instruction.currentCount.value }}</span>
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
    <div class="fixed top-4 left-4 z-[9999] font-mono font-bold bg-black/50 p-2 rounded text-white">
        <div v-if="instruction.currentGaze.value">
            GAZE: {{ Math.round(instruction.currentGaze.value.x) }}, {{ Math.round(instruction.currentGaze.value.y) }}
        </div>
        <div v-else class="text-red-500">
            NO GAZE DETECTED (Calib)
        </div>
    </div>
  </div>
</template>
