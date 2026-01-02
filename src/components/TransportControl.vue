<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SceneSelector from './SceneSelector.vue'
import AudioDebugPanel from './AudioDebugPanel.vue'
import SessionLiveMonitor from './SessionLiveMonitor.vue'
import { type Scene } from '../../src-new/core/Scene'
import { playbackSpeed } from '../state/playback'

const props = defineProps<{
  scenes: Scene[]
  currentIndex: number
  isPlaying: boolean
  isVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'restart'): void
  (e: 'select', index: number): void
  (e: 'menu-toggle', open: boolean): void
  (e: 'hide'): void
  (e: 'exit'): void
}>()

const showMonitor = ref(false)
const isFullscreen = ref(!!document.fullscreenElement)
const isSceneSelectorOpen = ref(false)
const transportRoot = ref<HTMLElement | null>(null)

const updateFullscreenStatus = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showMonitor.value || isSceneSelectorOpen.value) {
      showMonitor.value = false
      isSceneSelectorOpen.value = false
      return
    }

    if (props.isVisible) {
      emit('hide')
    } else {
      emit('exit')
    }
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (transportRoot.value && !transportRoot.value.contains(e.target as Node)) {
    showMonitor.value = false
    isSceneSelectorOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', updateFullscreenStatus)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenStatus)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('click', handleClickOutside)
})

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(e => {
      console.warn(`Error attempting to enable full-screen mode: ${e.message}`)
    })
  } else {
    document.exitFullscreen().catch(e => {
      console.warn(`Error attempting to exit full-screen mode: ${e.message}`)
    })
  }
}

const progress = computed(() => {
  if (props.scenes.length === 0) return 0
  return ((props.currentIndex) / (props.scenes.length - 1 || 1)) * 100
})

const getSceneDescription = (scene: Scene) => {
  const suggestions = scene.config.behavior?.suggestions || []
  const behaviors = suggestions.map(s => {
    const type = s.type.split(':').pop()?.replace('-', ' ')
    return type ? type.toUpperCase() : ''
  }).filter(Boolean).join(', ')

  const voice = scene.config.voice
  const text = scene.config.text
  const voiceStr = Array.isArray(voice) ? voice.join(' ') : voice
  const textStr = Array.isArray(text) ? text.join(' ') : text
  
  const description = voiceStr || textStr || 'No description'
  return behaviors ? `[${behaviors}] ${description}` : description
}
</script>

<template>
  <div ref="transportRoot" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">
    
    <!-- Live Monitor Popover -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-4 opacity-0 scale-95"
    >
      <SessionLiveMonitor v-if="showMonitor" />
    </Transition>

    <div class="bg-black/80 backdrop-blur-md rounded-xl shadow-2xl border border-zinc-800 p-4 flex flex-col gap-3 items-center min-w-[350px]">
    <div class="flex items-center gap-4 w-full justify-center">
      <!-- Controls -->
      <div class="flex items-center gap-2">
        <button 
          @click="emit('restart')"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
          v-tooltip="'Restart Session'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>

        <button 
          @click="emit('select', Math.max(0, props.currentIndex - 1))"
          :disabled="props.currentIndex === 0"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          v-tooltip="'Previous'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>
        
        <button 
          @click="props.isPlaying ? emit('pause') : emit('play')"
          class="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors min-w-[40px] flex justify-center"
          v-tooltip="props.isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="props.isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>

        <button 
          @click="emit('select', Math.min(props.scenes.length - 1, props.currentIndex + 1))"
          :disabled="props.currentIndex === props.scenes.length - 1"
          class="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          v-tooltip="'Next'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
      </div>

      <div class="h-6 w-px bg-zinc-700"></div>

      <!-- Jump To -->
      <SceneSelector 
        v-model:expanded="isSceneSelectorOpen"
        :scenes="scenes"
        :currentIndex="currentIndex"
        placement="top"
        @select="(i) => emit('select', i)"
        @toggle="(val) => emit('menu-toggle', val)"
      />

      <div class="h-6 w-px bg-zinc-700"></div>

      <!-- Speed Selector -->
      <div class="relative flex items-center">
        <select 
          v-model.number="playbackSpeed" 
          class="appearance-none bg-transparent text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer outline-none text-right pr-1"
          v-tooltip="'Playback Speed'"
        >
          <option :value="0.75">0.75x</option>
          <option :value="1.0">1.0x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
        </select>
        <span class="text-[10px] text-zinc-600 pointer-events-none">spd</span>
      </div>

      <div class="h-6 w-px bg-zinc-700"></div>

      <!-- Live Monitor Toggle -->
      <button 
        @click="showMonitor = !showMonitor"
        class="p-2 rounded hover:bg-zinc-700 transition-colors"
        :class="showMonitor ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'"
        v-tooltip="'Toggle Bio-Monitor'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </button>

      <div class="h-6 w-px bg-zinc-700"></div>

      <!-- Fullscreen Toggle -->
      <button 
        @click="toggleFullscreen"
        class="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-500 hover:text-white"
        v-tooltip="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
      >
        <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
      </button>

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
          
          <!-- Scene Markers -->
          <div class="absolute inset-0 px-0 flex items-center pointer-events-none">
            <div class="relative w-full h-full">
              <button
                v-for="(scene, index) in scenes"
                :key="scene.id"
                @click="emit('select', index)"
                class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-black/50 transition-all duration-[250ms] pointer-events-auto hover:scale-150 z-10"
                :class="[
                  index <= currentIndex ? 'bg-cyan-400' : 'bg-zinc-600',
                  index === currentIndex ? 'scale-125 ring-2 ring-cyan-500/50 opacity-100' : 'opacity-0 group-hover:opacity-100'
                ]"
                :style="{ left: `${(index / (scenes.length - 1 || 1)) * 100}%` }"
                v-tooltip="{
                  content: `
                    <div class='p-1'>
                      <div class='text-[10px] uppercase tracking-wider font-bold text-cyan-400 mb-1'>Scene #${index + 1}</div>
                      <div class='text-xs text-white max-w-[200px] line-clamp-3'>
                        ${getSceneDescription(scene)}
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
        <span class="w-6">{{ scenes.length }}</span>
      </div>
    </div>
  </div>
  </div>
</template>
