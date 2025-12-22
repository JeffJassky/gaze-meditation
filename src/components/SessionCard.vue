<script setup lang="ts">
import type { Program } from '../types'

defineProps<{
  program: Program
  disabled?: boolean
}>()

defineEmits<{
  (e: 'start', program: Program): void
}>()
</script>

<template>
  <div class="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all cursor-pointer" @click="$emit('start', program)">
    <div class="flex flex-col h-full">
      <div v-if="program.tags && program.tags.length" class="flex items-center gap-3 mb-2">
        <span
          v-for="tag in program.tags"
          :key="tag"
          class="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-cyan-500/20"
        >
          {{ tag }}
        </span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors text-left">
          {{ program.title }}
        </h3>
        <p class="text-sm text-zinc-400 mt-2 text-left">
          {{ program.description }}
        </p>
      </div>
      <div class="flex gap-2 mt-4 flex-wrap">
        <span class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">
          {{ Math.ceil(program.instructions.length / 6) }}-{{ Math.ceil(program.instructions.length / 4) }} min
        </span>
      </div>
      <div class="mt-auto pt-4">
        <button
          :disabled="disabled"
          @click.stop="$emit('start', program)"
          class="bg-cyan-900 w-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
        >
          Begin Session
        </button>
      </div>
    </div>
  </div>
</template>
