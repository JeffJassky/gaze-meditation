<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import type { ThemeConfig } from '../types'; // Import ThemeConfig

const props = defineProps<{
  score: number;
  theme: ThemeConfig; // Accept theme prop
}>();

const animatedScore = ref(0);
const displayScore = ref('000000');
const positionStyle = ref({});
const animationState = ref('hidden'); // 'hidden', 'animating', 'showing'

let timeoutId: ReturnType<typeof setTimeout> | null = null;

const formatScore = (num: number) => {
  return Math.floor(num).toString().padStart(6, '0');
};

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
  if (newScore === oldScore) return;

  // Clear any existing timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  // Reset state
  animationState.value = 'animating';
  positionStyle.value = getRandomPosition();

  // Manual number animation
  const duration = 500; // milliseconds
  const start = animatedScore.value; // current value
  const end = newScore;
  let startTime: number | null = null;

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const progress = (currentTime - startTime) / duration;

    if (progress < 1) {
      animatedScore.value = start + (end - start) * progress;
      displayScore.value = formatScore(animatedScore.value);
      requestAnimationFrame(animate);
    } else {
      animatedScore.value = end;
      displayScore.value = formatScore(animatedScore.value);
      animationState.value = 'showing';
      // After 1 second, start fade out
      timeoutId = setTimeout(() => {
        animationState.value = 'hidden';
      }, 1000);
    }
  };

  requestAnimationFrame(animate);
}, { immediate: true });

onMounted(() => {
  // Initialize position and score
  positionStyle.value = getRandomPosition();
  displayScore.value = formatScore(props.score);
});

const transitionClass = computed(() => {
  if (animationState.value === 'animating') {
    return 'transition-all ease-out duration-300 opacity-100 scale-100 rotate-0'; // Faster fade-in, no rotation
  } else if (animationState.value === 'showing') {
    return 'opacity-100 scale-100 rotate-0';
  } else {
    // Zoom inwards and fade out with a slight rotation
    return 'transition-all ease-in duration-500 opacity-0 scale-50 -rotate-12';
  }
});
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
      <h2
        class="text-xs uppercase tracking-widest font-bold mb-1"
        :style="{ color: props.theme.secondaryTextColor }"
      >
        Neural Score
      </h2>
      <span
        class="text-4xl font-mono tracking-tighter"
        :style="{ color: props.theme.textColor }"
        >{{ displayScore }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.neural-score-display {
  will-change: transform, opacity, left, top;
}
</style>
