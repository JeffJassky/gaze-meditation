<script setup lang="ts">
const props = defineProps<{
  leftSrc?: string
  rightSrc?: string
}>()

const isVideo = (src?: string) => {
  if (!src) return false
  return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm')
}
</script>

<template>
  <div class="split-media-background absolute inset-0 flex">
    <!-- Left Side -->
    <div class="w-1/2 h-full relative overflow-hidden flex items-center justify-center bg-black">
      <template v-if="leftSrc">
        <video
          v-if="isVideo(leftSrc)"
          :src="leftSrc"
          autoplay
          loop
          muted
          class="w-full h-full object-cover"
        ></video>
        <img
          v-else
          :src="leftSrc"
          class="w-full h-full object-cover"
        />
      </template>
    </div>

    <!-- Right Side -->
    <div class="w-1/2 h-full relative overflow-hidden flex items-center justify-center bg-black border-l border-white/10">
      <template v-if="rightSrc">
        <video
          v-if="isVideo(rightSrc)"
          :src="rightSrc"
          autoplay
          loop
          muted
          class="w-full h-full object-cover"
        ></video>
        <img
          v-else
          :src="rightSrc"
          class="w-full h-full object-cover"
        />
      </template>
    </div>
  </div>
</template>
