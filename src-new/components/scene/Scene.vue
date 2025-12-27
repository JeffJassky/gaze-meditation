<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '../../../src/components/ProgressBar.vue'

// Define a standardized interface for the props Scene expects
// This decouples it from the specific Instruction classes while still being easy to pass data into
interface SceneTheme {
  textColor: string
  secondaryTextColor?: string
  accentColor?: string
  backgroundColor?: string
  positiveColor?: string
  negativeColor?: string
  [key: string]: any
}

interface Props {
  // text content
  prompt?: string
  
  // appearance
  theme: SceneTheme
  
  // state
  progress?: number
  showProgress?: boolean
  
  // layout configuration
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: false,
  theme: () => ({
    textColor: '#ffffff',
    secondaryTextColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent'
  })
})

const splitPrompt = computed(() => {
  if (!props.prompt) return []
  return props.prompt.split('~').map(s => s.trim()).filter(s => s)
})

</script>

<template>
  <div 
    class="scene-container"
    :style="{ 
      color: theme.textColor,
      backgroundColor: theme.backgroundColor
    }"
  >
    <!-- Background Layer (e.g. Video, colored wipes) -->
    <div class="scene-layer background-layer">
      <slot name="background"></slot>
    </div>

    <!-- Main Content Layer -->
    <div class="scene-layer content-layer flex flex-col items-center justify-center p-8">
      
      <!-- Standardized Prompt Display -->
      <!-- If a slot is provided for 'prompt', use it. Otherwise render standard text -->
      <slot name="prompt">
        <div v-if="prompt" class="prompt-text mb-8 text-center z-10 animate-in fade-in zoom-in duration-300">
           <span
            v-for="(segment, index) in splitPrompt"
            :key="index"
            class="inline-block mx-1"
          >{{ segment }}</span>
        </div>
      </slot>

      <!-- Primary Interactive/Visual Element -->
      <div class="scene-content relative z-10" :class="contentClass">
        <slot></slot>
      </div>
      
    </div>

    <!-- UI Overlay Layer (Progress, Debug, etc) -->
    <div class="scene-layer overlay-layer pointer-events-none">
      <div v-if="showProgress && progress !== undefined" class="absolute bottom-12 left-1/2 -translate-x-1/2">
        <ProgressBar
          :progress="progress"
          :size="60"
          :stroke-width="4"
          :fillColor="theme.accentColor || theme.textColor"
          trackColor="rgba(255,255,255,0.1)"
        />
      </div>
      
      <slot name="overlay"></slot>
    </div>

  </div>
</template>

<style scoped>
.scene-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scene-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.background-layer {
  z-index: 0;
}

.content-layer {
  z-index: 10;
  pointer-events: auto; /* Allow interaction with content */
}

.overlay-layer {
  z-index: 20;
}

.prompt-text {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 500;
  line-height: 1.4;
  max-width: 900px;
}
</style>
