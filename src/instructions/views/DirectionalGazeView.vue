<script setup lang="ts">
import { computed } from 'vue';
import type { DirectionalGazeInstruction } from '../DirectionalGazeInstruction';

const props = defineProps<{
  instruction: DirectionalGazeInstruction
}>();

const isVideo = (src?: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
};

const bgColor = computed(() => props.instruction.resolvedTheme.backgroundColor);
const textColor = computed(() => props.instruction.resolvedTheme.textColor);
const secondaryTextColor = computed(() => props.instruction.resolvedTheme.secondaryTextColor);
const accentColor = computed(() => props.instruction.resolvedTheme.accentColor);
const positiveColor = computed(() => props.instruction.resolvedTheme.positiveColor);
const negativeColor = computed(() => props.instruction.resolvedTheme.negativeColor);
const debugColor = computed(() => props.instruction.resolvedTheme.debugColor);

const instructionOverlayBg = computed(() => {
  return bgColor.value ? `${bgColor.value}80` : 'rgba(0,0,0,0.5)'; // 50% opacity
});

const instructionOverlayBorder = computed(() => {
  return textColor.value ? `${textColor.value}1A` : 'rgba(255,255,255,0.1)'; // 10% opacity
});

const correctFeedbackBorder = computed(() => {
  return positiveColor.value ? `${positiveColor.value}80` : 'rgba(16,185,129,0.5)'; // 50% opacity (emerald-500)
});

const incorrectFeedbackBorder = computed(() => {
  return negativeColor.value ? `${negativeColor.value}33` : 'rgba(239,68,68,0.2)'; // 20% opacity (red-500)
});
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    
    <!-- Split Screen Content -->
    <div class="absolute inset-0 flex">
        <!-- Left Side -->
        <div class="w-1/2 h-full relative overflow-hidden" :style="{ backgroundColor: bgColor, borderRight: `1px solid ${secondaryTextColor}` }">
            <template v-if="instruction.options.leftSrc">
                <video v-if="isVideo(instruction.options.leftSrc)" :src="instruction.options.leftSrc" autoplay loop muted class="w-full h-full object-cover"></video>
                <img v-else :src="instruction.options.leftSrc" class="w-full h-full object-cover" />
            </template>
            <div v-else class="w-full h-full flex items-center justify-center font-mono text-4xl" :style="{ backgroundColor: bgColor, color: secondaryTextColor }">LEFT</div>
        </div>

        <!-- Right Side -->
        <div class="w-1/2 h-full relative overflow-hidden" :style="{ backgroundColor: bgColor, borderLeft: `1px solid ${secondaryTextColor}` }">
            <template v-if="instruction.options.rightSrc">
                <video v-if="isVideo(instruction.options.rightSrc)" :src="instruction.options.rightSrc" autoplay loop muted class="w-full h-full object-cover"></video>
                <img v-else :src="instruction.options.rightSrc" class="w-full h-full object-cover" />
            </template>
            <div v-else class="w-full h-full flex items-center justify-center font-mono text-4xl" :style="{ backgroundColor: bgColor, color: secondaryTextColor }">RIGHT</div>
        </div>
    </div>

    <!-- Overlays -->
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <!-- Instruction Text -->
        <h1 class="text-6xl font-bold mb-8 drop-shadow-md text-center p-4 rounded-xl backdrop-blur-sm"
          :style="{ color: textColor, backgroundColor: instructionOverlayBg, borderColor: instructionOverlayBorder, borderWidth: '1px' }"
        >
          LOOK {{ instruction.options.direction }}
        </h1>
        
        <div class="text-xl font-mono bg-black/50 px-3 py-1 rounded" :style="{ color: accentColor, backgroundColor: instructionOverlayBg }">
           Score: {{ Math.round(instruction.score.value) }}%
        </div>
    </div>

    <!-- Feedback / Reward Visual -->
    <div v-if="instruction.isCorrect.value" class="absolute inset-0 border-[12px] transition-colors z-20" :style="{ borderColor: correctFeedbackBorder }"></div>
    <div v-else class="absolute inset-0 border-[12px] transition-colors z-20" :style="{ borderColor: incorrectFeedbackBorder }"></div>
  </div>
</template>
