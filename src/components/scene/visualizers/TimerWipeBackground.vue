<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  duration: number // in milliseconds
  color?: string
  opacity?: number
}>()

const backgroundColor = computed(() => {
  const c = props.color || '#0891b2' // cyan-600 default
  // Add opacity if provided and color is hex/rgb? 
  // For simplicity, assume parent passes valid color or we use style opacity
  return c
})
</script>

<template>
  <div class="timer-wipe-container absolute inset-0 -z-5">
    <div
      class="wipe-fill h-full mix-blend-screen"
      :style="{
        animation: `wipe ${duration}ms linear forwards`,
        backgroundColor: backgroundColor,
        opacity: opacity || 0.5,
        boxShadow: `0 0 50px ${backgroundColor}`
      }"
    ></div>
  </div>
</template>

<style scoped>
@keyframes wipe {
  0% { width: 0%; }
  100% { width: 100%; }
}

.wipe-fill {
  width: 0;
}
</style>
