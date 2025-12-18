<template>
  <div class="visual-eye" :style="eyeStyle">
    <div class="lid upper" :style="upperLidTransform"></div>
    <div class="lid lower" :style="lowerLidTransform"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  openness: number; // 0-100 range
}>();

const normalizedOpenness = computed(() => props.openness / 100); // Convert to 0-1 range

const lidMovement = computed(() => {
  // 0 = closed, 1 = open
  const openness = normalizedOpenness.value;
  // When eye is fully open (1), upper lid is at -100% and lower lid is at 100%
  // When eye is fully closed (0), both lids are at 0%
  const upperOffset = openness * -100; // -100% to 0%
  const lowerOffset = openness * 100; // 0% to 100%

  return {
    upper: `translateY(${upperOffset}%)`,
    lower: `translateY(${lowerOffset}%)`
  };
});

const upperLidTransform = computed(() => ({
  transform: lidMovement.value.upper,
}));

const lowerLidTransform = computed(() => ({
  transform: lidMovement.value.lower,
}));

const eyeStyle = computed(() => {
  const openness = normalizedOpenness.value;
  const shadowSpread = (1 - openness) * 20; // Max 20px spread when closed
  const shadowAlpha = (1 - openness) * 1; // Max 0.8 alpha when closed

  return {
    backgroundColor: 'transparent',
    boxShadow: `inset 0px 0px ${shadowSpread}px ${shadowSpread}px rgba(0, 0, 0, ${shadowAlpha})`,
  };
});
</script>

<style scoped>
.visual-eye {
    width: 100vw;
	height: 100vh;
	top: 0;
	left: 0;
    position: absolute;
    overflow: hidden;
}

.lid {
    position: absolute;
    left: 0;
    width: 100vw;
    height: 100vh;
    transition: transform 0.2s;
    z-index: 20;
}

.lid.upper {
    top: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
}

.lid.lower {
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 1),rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
}
</style>
