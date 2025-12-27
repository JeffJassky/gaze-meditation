<script setup lang="ts">
// A simple reusable element for displaying text in the Scene style
// Useful if we want to layer multiple text elements or have text in the content slot
defineProps<{
  text: string
  color?: string
}>()
</script>

<template>
  <div class="scene-text text-center" :style="{ color: color }">
    <span
      v-for="(segment, index) in text.split('~')"
      :key="index"
      class="inline-block mx-1"
    >
      {{ segment.trim() }}
    </span>
  </div>
</template>

<style scoped>
.scene-text {
  font-size: clamp(1rem, 3vw, 2.25rem);
  font-weight: 500;
  transition: color 0.3s ease;
}
</style>
