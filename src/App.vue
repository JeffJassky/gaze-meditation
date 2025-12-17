<script setup lang="ts">
import { ref, markRaw } from 'vue';
import Dashboard from './components/Dashboard.vue';
import Theater from './components/Theater.vue';
import type { Program } from './types';

type View = 'dashboard' | 'theater';

interface ActiveSession {
  program: Program;
  subjectId: string;
}

const view = ref<View>('dashboard');
const activeSession = ref<ActiveSession | null>(null);

const startSession = (program: Program, subjectId: string) => {
  activeSession.value = { program: markRaw(program), subjectId };
  view.value = 'theater';
};

const endSession = () => {
  activeSession.value = null;
  view.value = 'dashboard';
};
</script>

<template>
  <div class="w-full h-screen bg-black text-white overflow-hidden">
    <Dashboard v-if="view === 'dashboard'" @startSession="startSession" />
    
    <Theater 
      v-if="view === 'theater' && activeSession"
      :program="activeSession.program" 
      :subjectId="activeSession.subjectId"
      @exit="endSession"
    />
  </div>
</template>

<style scoped>
/* No specific scoped styles needed, using Tailwind */
</style>