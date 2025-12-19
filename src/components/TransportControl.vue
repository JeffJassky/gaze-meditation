<script setup lang="ts">
import { computed } from 'vue'
import InstructionSelector from './InstructionSelector.vue'
import ProgressBar from './ProgressBar.vue'
import AudioDebugPanel from './AudioDebugPanel.vue'
import type { Instruction } from '../core/Instruction'

const props = defineProps<{
  instructions: Instruction<any>[]
  currentIndex: number
  isPlaying: boolean
}>()

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'restart'): void
  (e: 'select', index: number): void
  (e: 'menu-toggle', open: boolean): void
}>()

const progress = computed(() => {
  if (props.instructions.length === 0) return 0
  return ((props.currentIndex) / (props.instructions.length - 1 || 1)) * 100
})
</script>

<template>
  <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md rounded-xl shadow-2xl border border-zinc-800 p-4 flex flex-col gap-3 items-center min-w-[350px]">
    <div class="flex items-center gap-4 w-full justify-center">
      <!-- Controls -->
      <div class="flex items-center gap-2">
        <button 
          @click="emit('restart')"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
          title="Restart Session"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button 
          @click="props.isPlaying ? emit('pause') : emit('play')"
          class="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors min-w-[40px] flex justify-center"
          :title="props.isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="props.isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>

      <div class="h-6 w-px bg-zinc-700"></div>

      <!-- Jump To -->
      <InstructionSelector 
        :instructions="instructions"
        :currentIndex="currentIndex"
        placement="top"
        @select="(i) => emit('select', i)"
        @toggle="(val) => emit('menu-toggle', val)"
      />

      <div class="h-6 w-px bg-zinc-700"></div>

      <AudioDebugPanel />
    </div>

    <!-- Progress -->
    <div class="w-full flex items-center gap-3 text-xs font-mono text-zinc-500">
      <span class="w-6 text-right">{{ currentIndex + 1 }}</span>
      <ProgressBar 
        :progress="progress" 
        class="flex-1 !h-2" 
        track-color="rgba(255,255,255,0.1)" 
        fill-color="#06b6d4" 
      />
      <span class="w-6">{{ instructions.length }}</span>
    </div>
  </div>
</template>
