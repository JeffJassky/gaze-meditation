<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { User, Program, SessionLog } from '../types';
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService';
import { GazeInstruction } from '../instructions/GazeInstruction';
import { SpeechInstruction } from '../instructions/SpeechInstruction';
import { CalibrationInstruction } from '../instructions/CalibrationInstruction';
import { DirectionalGazeInstruction } from '../instructions/DirectionalGazeInstruction';

// Mock Programs
const PROGRAMS: Program[] = [
  {
    id: 'prog_calibration',
    title: 'Eye Tracker Calibration',
    description: 'Calibrate the WebGazer eye tracking system.',
    audioTrack: 'silence.mp3',
    instructions: [
        new CalibrationInstruction({ id: 'cal1', prompt: 'Eye Calibration' }),
        new DirectionalGazeInstruction({ id: 'test_left', prompt: 'Look Left', direction: 'LEFT', duration: 4000 }),
        new DirectionalGazeInstruction({ id: 'test_right', prompt: 'Look Right', direction: 'RIGHT', duration: 4000 })
    ]
  },
  {
    id: 'prog_focus_alpha',
    title: 'Alpha Focus Protocol',
    description: 'Basic gaze fixation training to improve attention span.',
    audioTrack: 'theta_binaural_40hz.mp3',
    instructions: [
      new GazeInstruction({ id: 'i1', prompt: 'Fixate on the Blue Orb', duration: 5000, holdTime: 2000 }),
      new GazeInstruction({ id: 'i2', prompt: 'Follow the light', duration: 4000, holdTime: 1500 }),
      new GazeInstruction({ id: 'i3', prompt: 'Hold Steady', duration: 5000, holdTime: 3000 }),
    ]
  },
  {
    id: 'prog_verbal_recall',
    title: 'Verbal Recall Beta',
    description: 'Rapid fire word association and repetition.',
    audioTrack: 'white_noise_low.mp3',
    instructions: [
      new SpeechInstruction({ id: 'v1', prompt: 'Say "START"', targetValue: 'START', duration: 4000 }),
      new SpeechInstruction({ id: 'v2', prompt: 'Say "FOCUS"', targetValue: 'FOCUS', duration: 3000 }),
      new GazeInstruction({ id: 'v3', prompt: 'Look at the center', duration: 3000, holdTime: 1000 }),
      new SpeechInstruction({ id: 'v4', prompt: 'Say "DONE"', targetValue: 'DONE', duration: 3000 }),
    ]
  }
];

interface DashboardProps {
  // onStartSession: (program: Program, subjectId: string) => void; // Will be an emit
}

const props = defineProps<DashboardProps>();
const emit = defineEmits<{
  (e: 'startSession', program: Program, subjectId: string): void;
}>();

const users = ref<User[]>([]);
const sessions = ref<SessionLog[]>([]);
const selectedUser = ref<string>('');
const activeTab = ref<'start' | 'history' | 'users'>('start');
const newUserName = ref('');

const refreshData = () => {
  users.value = getUsers();
  sessions.value = getSessions().reverse(); // Newest first
};

const handleCreateUser = () => {
  if (!newUserName.value) return;
  const newUser: User = {
      id: `SUB_${Math.floor(Math.random() * 1000)}`,
      name: newUserName.value,
      totalScore: 0,
      history: []
  };
  saveUser(newUser);
  newUserName.value = '';
  refreshData();
  activeTab.value = 'start';
};

const handleStartSession = (program: Program) => {
  if (!selectedUser.value) return;
  emit('startSession', program, selectedUser.value);
};

const getSubjectName = (subjectId: string) => {
  return users.value.find(u => u.id === subjectId)?.name || subjectId;
};

const getSessionAccuracy = (s: SessionLog) => {
  return Math.round((s.metrics.filter(m => m.success).length / s.metrics.length) * 100) || 0;
};

onMounted(() => {
  seedDatabase();
  refreshData();
});
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-900 selection:text-white flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tighter text-white mb-1">NCRS</h1>
        <p class="text-xs text-zinc-500 uppercase tracking-widest">Research Suite v2.1</p>
      </div>

      <nav class="flex flex-col gap-2">
        <button 
          @click="activeTab = 'start'"
          :class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'start' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`"
        >
          Start Session
        </button>
        <button 
           @click="activeTab = 'history'"
          :class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`"
        >
          Data Logs
        </button>
        <button 
           @click="activeTab = 'users'"
          :class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`"
        >
          Subjects
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-12 overflow-y-auto">
      
      <div v-if="activeTab === 'start'" class="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 class="text-3xl font-light text-white mb-2">Configure Session</h2>
          <p class="text-zinc-500">Select a subject and a conditioning protocol to begin.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Subject Select -->
          <div class="space-y-4">
            <label class="text-xs uppercase font-bold text-zinc-500 tracking-wider">Select Subject</label>
            <select 
              class="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
              v-model="selectedUser"
            >
              <option value="">-- Choose Subject --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} (Score: {{ u.totalScore }})</option>
            </select>
            <p v-if="users.length === 0" class="text-sm text-red-400">No subjects found. Create one in 'Subjects' tab.</p>
          </div>
        </div>

        <div class="space-y-4">
           <label class="text-xs uppercase font-bold text-zinc-500 tracking-wider">Available Protocols</label>
           <div class="grid grid-cols-1 gap-4">
             <div v-for="prog in PROGRAMS" :key="prog.id" class="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all">
               <div class="flex justify-between items-start">
                 <div>
                   <h3 class="text-xl font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">{{ prog.title }}</h3>
                   <p class="text-sm text-zinc-400 mt-2">{{ prog.description }}</p>
                   <div class="flex gap-2 mt-4">
                     <span class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">{{ prog.instructions.length }} steps</span>
                     <span class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">Audio: {{ prog.audioTrack }}</span>
                   </div>
                 </div>
                 <button 
                  :disabled="!selectedUser"
                  @click="handleStartSession(prog)"
                  class="bg-cyan-900 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
                 >
                   INITIALIZE
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
         <h2 class="text-3xl font-light text-white mb-6">Session Logs</h2>
         <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
           <table class="w-full text-left text-sm">
             <thead class="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-medium">
               <tr>
                 <th class="px-6 py-4">Session ID</th>
                 <th class="px-6 py-4">Subject</th>
                 <th class="px-6 py-4">Date</th>
                 <th class="px-6 py-4 text-right">Score</th>
                 <th class="px-6 py-4 text-right">Accuracy</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-zinc-800">
               <tr v-for="s in sessions" :key="s.id" class="hover:bg-zinc-800/30">
                   <td class="px-6 py-4 font-mono text-zinc-500">{{ s.id }}</td>
                   <td class="px-6 py-4 text-white font-medium">{{ getSubjectName(s.subjectId) }}</td>
                   <td class="px-6 py-4 text-zinc-400">{{ new Date(s.startTime).toLocaleString() }}</td>
                   <td class="px-6 py-4 text-right font-mono text-cyan-400">{{ s.totalScore }}</td>
                   <td class="px-6 py-4 text-right text-zinc-400">{{ getSessionAccuracy(s) }}%</td>
               </tr>
             </tbody>
           </table>
           <div v-if="sessions.length === 0" class="p-8 text-center text-zinc-500">No session data available.</div>
         </div>
      </div>

      <div v-else-if="activeTab === 'users'" class="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h2 class="text-3xl font-light text-white mb-6">Subject Management</h2>
           
           <div class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 flex gap-4 items-end">
              <div class="flex-1">
                  <label class="text-xs uppercase font-bold text-zinc-500 tracking-wider block mb-2">New Subject Name</label>
                  <input 
                      type="text" 
                      class="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                      placeholder="e.g. John Doe"
                      v-model="newUserName"
                  />
              </div>
              <button 
                  @click="handleCreateUser"
                  class="bg-zinc-100 text-black font-bold px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors"
              >
                  Create Subject
              </button>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div v-for="u in users" :key="u.id" class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between">
                   <div>
                      <h3 class="text-lg font-bold text-white">{{ u.name }}</h3>
                      <p class="text-xs text-zinc-500 font-mono mt-1">{{ u.id }}</p>
                   </div>
                   <div class="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-end">
                       <div>
                           <div class="text-xs text-zinc-500 uppercase">Total Score</div>
                           <div class="text-2xl font-mono text-cyan-400">{{ u.totalScore }}</div>
                       </div>
                       <div class="text-xs text-zinc-400">{{ u.history.length }} Sessions</div>
                   </div>
               </div>
           </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* No specific scoped styles needed, using Tailwind */
</style>