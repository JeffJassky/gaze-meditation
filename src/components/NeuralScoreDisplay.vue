<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import type { ThemeConfig } from '../types'; // Import ThemeConfig

const props = defineProps<{
  score: number;
  theme: ThemeConfig; // Accept theme prop
}>();

const displayDelta = ref('');
const positionStyle = ref({});
const animationState = ref('hidden'); // 'hidden', 'animating', 'showing'
const isPositive = ref(true);

let timeoutId: ReturnType<typeof setTimeout> | null = null;

const getRandomPosition = () => {
  const maxX = window.innerWidth * 0.7; // 70% of screen width
  const maxY = window.innerHeight * 0.7; // 70% of screen height
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
};

watch(() => props.score, (newScore, oldScore) => {
  // Don't show immediately when it initializes (oldScore is undefined)
  // or if the score hasn't actually changed
  if (oldScore === undefined || newScore === oldScore) return;

  const delta = newScore - oldScore;
  if (delta === 0) return;

  // Clear any existing timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  isPositive.value = delta > 0;
  
  // Reset state and move to a new random position
  animationState.value = 'animating';
  positionStyle.value = getRandomPosition();

  // Manual number animation from 0 to delta
  const duration = 400; // milliseconds
  let startTime: number | null = null;

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    
    const currentVal = Math.floor(delta * progress);
    displayDelta.value = (delta > 0 ? '+' : '') + currentVal;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      displayDelta.value = (delta > 0 ? '+' : '') + delta;
      animationState.value = 'showing';
      // After 1.5 seconds, start fade out
      timeoutId = setTimeout(() => {
        animationState.value = 'hidden';
      }, 1500);
    }
  };

  requestAnimationFrame(animate);
}, { immediate: true });

onMounted(() => {
  // Initialize position
  positionStyle.value = getRandomPosition();
});

const transitionClass = computed(() => {
  if (animationState.value === 'animating' || animationState.value === 'showing') {
    return 'transition-all ease-out duration-300 opacity-100 scale-100 rotate-0';
  } else {
    // Zoom inwards and fade out with a slight rotation
    return 'transition-all ease-in duration-500 opacity-0 scale-50 -rotate-12';
  }
});

const deltaStyle = computed(() => ({
  color: isPositive.value
    ? (props.theme.positiveColor || '#10B981')
    : (props.theme.negativeColor || '#EF4444')
}));
</script>

<template>
  <div
    class="neural-score-display absolute pointer-events-none"
    :style="positionStyle"
  >
    <div
      class="text-center"
      :class="transitionClass"
    >
      <span
        class="text-4xl font-mono tracking-tighter"
        :style="deltaStyle"
        >{{ displayDelta }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.neural-score-display {
  will-change: transform, opacity, left, top;
}
</style>
