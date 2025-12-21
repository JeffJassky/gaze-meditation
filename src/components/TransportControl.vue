<script setup lang="ts">
import { computed } from 'vue'
import InstructionSelector from './InstructionSelector.vue'
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
          @click="emit('select', Math.max(0, props.currentIndex - 1))"
          :disabled="props.currentIndex === 0"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          title="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>
        
        <button 
          @click="props.isPlaying ? emit('pause') : emit('play')"
          class="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors min-w-[40px] flex justify-center"
          :title="props.isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="props.isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>

        <button 
          @click="emit('select', Math.min(props.instructions.length - 1, props.currentIndex + 1))"
          :disabled="props.currentIndex === props.instructions.length - 1"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          title="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
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
    <div class="w-full flex flex-col gap-1">
      <div class="w-full flex items-center gap-3 text-xs font-mono text-zinc-500">
        <span class="w-6 text-right">{{ currentIndex + 1 }}</span>
        <div class="flex-1 relative group py-2">
          <!-- Linear Progress Bar -->
          <div class="relative w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
             <div 
               class="absolute top-0 left-0 h-full bg-cyan-400 transition-all duration-300 ease-out"
               :style="{ width: `${progress}%` }"
             ></div>
          </div>
          
          <!-- Instruction Markers -->
          <div class="absolute inset-0 px-0 flex items-center pointer-events-none">
            <div class="relative w-full h-full">
              <button
                v-for="(instr, index) in instructions"
                :key="instr.id"
                @click="emit('select', index)"
                class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-black/50 transition-all duration-[250ms] pointer-events-auto hover:scale-150 z-10"
                :class="[
                  index <= currentIndex ? 'bg-cyan-400' : 'bg-zinc-600',
                  index === currentIndex ? 'scale-125 ring-2 ring-cyan-500/50 opacity-100' : 'opacity-0 group-hover:opacity-100'
                ]"
                :style="{ left: `${(index / (instructions.length - 1 || 1)) * 100}%` }"
                v-tooltip="{
                  content: `
                    <div class='p-1'>
                      <div class='text-[10px] uppercase tracking-wider font-bold text-cyan-400 mb-1'>${instr.constructor.name.replace('Instruction', '')} #${index + 1}</div>
                      <div class='text-xs text-white max-w-[200px] line-clamp-3'>
                        ${Array.isArray(instr.options.text) ? instr.options.text.join(' ') : (instr.options.text || instr.options.prompt || 'No description')}
                      </div>
                    </div>
                  `,
                  html: true,
                  placement: 'top',
                  distance: 12
                }"
              ></button>
            </div>
          </div>
        </div>
        <span class="w-6">{{ instructions.length }}</span>
      </div>
    </div>
  </div>
</template>
