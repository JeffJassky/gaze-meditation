<script setup lang="ts">
import type { DirectionalGazeInstruction } from '../DirectionalGazeInstruction';

defineProps<{
  instruction: DirectionalGazeInstruction
}>();

const isVideo = (src?: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
};
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    
    <!-- Split Screen Content -->
    <div class="absolute inset-0 flex">
        <!-- Left Side -->
        <div class="w-1/2 h-full relative overflow-hidden bg-black border-r border-zinc-800">
            <template v-if="instruction.options.leftSrc">
                <video v-if="isVideo(instruction.options.leftSrc)" :src="instruction.options.leftSrc" autoplay loop muted class="w-full h-full object-cover"></video>
                <img v-else :src="instruction.options.leftSrc" class="w-full h-full object-cover" />
            </template>
            <div v-else class="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-mono text-4xl">LEFT</div>
        </div>

        <!-- Right Side -->
        <div class="w-1/2 h-full relative overflow-hidden bg-black border-l border-zinc-800">
            <template v-if="instruction.options.rightSrc">
                <video v-if="isVideo(instruction.options.rightSrc)" :src="instruction.options.rightSrc" autoplay loop muted class="w-full h-full object-cover"></video>
                <img v-else :src="instruction.options.rightSrc" class="w-full h-full object-cover" />
            </template>
            <div v-else class="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-mono text-4xl">RIGHT</div>
        </div>
    </div>

    <!-- Overlays -->
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <!-- Instruction Text -->
        <h1 class="text-6xl font-bold text-white mb-8 drop-shadow-md text-center bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
          LOOK {{ instruction.options.direction }}
        </h1>
        
        <div class="text-xl text-cyan-300 font-mono bg-black/50 px-3 py-1 rounded">
           Score: {{ Math.round(instruction.score.value) }}%
        </div>
    </div>

    <!-- Feedback / Reward Visual -->
    <div v-if="instruction.isCorrect.value" class="absolute inset-0 border-[12px] border-green-500/50 transition-colors z-20"></div>
    <div v-else class="absolute inset-0 border-[12px] border-red-500/20 transition-colors z-20"></div>

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
  </div>
</template>
