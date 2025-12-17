<script setup lang="ts">
import type { DirectionalGazeInstruction } from '../DirectionalGazeInstruction';

defineProps<{
  instruction: DirectionalGazeInstruction
}>();
</script>

<template>
  <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
    <!-- Instruction Text -->
    <h1 class="text-6xl font-bold text-white mb-8 drop-shadow-md text-center">
      LOOK {{ instruction.options.direction }}
    </h1>
    
    <div class="text-xl text-cyan-300 font-mono">
       Score: {{ Math.round(instruction.score.value) }}%
    </div>

    <!-- Feedback / Reward Visual -->
    <div v-if="instruction.isCorrect.value" class="absolute inset-0 border-8 border-green-500/50 transition-colors"></div>
    <div v-else class="absolute inset-0 border-8 border-red-500/20 transition-colors"></div>

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
    <div v-else class="fixed top-4 left-4 text-red-500 font-bold z-[9999]">
        NO GAZE DETECTED
    </div>

    <!-- Centroids Debug (Optional) -->
    <!--
    <div v-if="instruction.centroids.left" class="absolute w-4 h-4 bg-red-500 rounded-full opacity-50"
         :style="{ left: instruction.centroids.left.x + 'px', top: instruction.centroids.left.y + 'px' }" />
    <div v-if="instruction.centroids.right" class="absolute w-4 h-4 bg-blue-500 rounded-full opacity-50"
         :style="{ left: instruction.centroids.right.x + 'px', top: instruction.centroids.right.y + 'px' }" />
    -->
  </div>
</template>
