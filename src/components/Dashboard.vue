<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { User, Program, SessionLog } from '../types';
import { FormFieldType } from '../types';
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService';
import { SpeechInstruction } from '../instructions/SpeechInstruction';
import { CalibrationInstruction } from '../instructions/CalibrationInstruction';
import { DirectionalGazeInstruction } from '../instructions/DirectionalGazeInstruction';
import { StillnessInstruction } from '../instructions/StillnessInstruction';
import { FormInstruction } from '../instructions/FormInstruction';
import { BlinkInstruction } from '../instructions/BlinkInstruction';
import { TypeInstruction } from '../instructions/TypeInstruction';
import { NodInstruction } from '../instructions/NodInstruction';
import { FractionationInstruction } from '../instructions/FractionationInstruction';
import { ReadInstruction } from '../instructions/ReadInstruction'; // Import new ReadInstruction

// Full Programs
const FULL_PROGRAMS: Program[] = [
  {
    id: 'prog_calibration',
    title: 'Eye Tracker Calibration',
    description: 'Calibrate the WebGazer eye tracking system.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
        new CalibrationInstruction({ id: 'cal1', prompt: 'Eye Calibration', positiveReinforcement: { message: 'CALIBRATION COMPLETE' } }),
        new DirectionalGazeInstruction({
            id: 'test_left',
            prompt: 'Look Left',
            direction: 'LEFT',
            duration: 4000,
            leftSrc: 'https://placehold.co/400x400/red/white?text=LEFT',
            rightSrc: 'https://placehold.co/400x400/blue/white?text=IGNORE'
        }),
        new DirectionalGazeInstruction({
            id: 'test_right',
            prompt: 'Look Right',
            direction: 'RIGHT',
            duration: 4000,
            leftSrc: 'https://placehold.co/400x400/red/white?text=IGNORE',
            rightSrc: 'https://placehold.co/400x400/blue/white?text=RIGHT'
        })
    ]
  },
  {
    id: 'prog_verbal_recall',
    title: 'Verbal Recall Beta',
    description: 'Rapid fire word association and repetition.',
    audioTrack: 'white_noise_low.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new SpeechInstruction({ id: 'v1', prompt: 'Say "START"', targetValue: 'START', duration: 4000, negativeReinforcement: { enabled: false } }),
      new SpeechInstruction({ id: 'v2', prompt: 'Say "FOCUS"', targetValue: 'FOCUS', duration: 3000, negativeReinforcement: { enabled: false } }),
      new SpeechInstruction({ id: 'v4', prompt: 'Say "DONE"', targetValue: 'DONE', duration: 3000, negativeReinforcement: { enabled: false } }),
    ]
  },
  {
      id: 'prog_blink_debug',
      title: 'Blink Calibration',
      description: 'Debug tool for testing blink sensitivity.',
          audioTrack: 'silence.mp3',
          videoBackground: '/spiral.mp4',
          instructions: [          new BlinkInstruction({ id: 'b_debug', prompt: 'Keep eyes open', duration: 30000 })
      ]
  },
  {
    id: 'prog_deepening',
    title: 'Deepening Protocol',
    description: 'Advanced conditioning using fractionation, stillness, gaze, and affirmation.',
    audioTrack: 'drone_dark.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
        new FractionationInstruction({ id: 'f1', prompt: 'Relax and follow the voice', cycles: 3 }),
        new TypeInstruction({ id: 't1', prompt: 'Type "I obey"', targetPhrase: 'I obey', positiveReinforcement: { message: 'ACCEPTED' }, negativeReinforcement: { message: 'TRY AGAIN' } }),
        new NodInstruction({ id: 'n1', prompt: 'Nod if you are ready', nodsRequired: 3, type: 'YES' }),
        new BlinkInstruction({ id: 'b1', prompt: 'Do not blink', duration: 10000 }),
        new TypeInstruction({ id: 't2', prompt: 'Type "My mind is open"', targetPhrase: 'My mind is open', positiveReinforcement: { message: 'ACCEPTED' }, negativeReinforcement: { message: 'TRY AGAIN' } }),
        new StillnessInstruction({ id: 's2', prompt: 'Perfect stillness', duration: 10000 }),
    ]
	},
	{
	id: 'demo-form-program',
	title: 'Demo Form Program',
	description: 'A program to demonstrate the new FormInstruction.',
	audioTrack: 'none', // Placeholder
	videoBackground: '/public/spiral.mp4', // Example background
	instructions: [
		new FormInstruction({
		id: 'welcome-form',
		duration: 0, // Forms don't have a fixed duration, completion is event-driven
		question: 'Welcome! Please tell us a bit about yourself.',
		prompt: 'Welcome! Please tell us a bit about yourself.', // Add this line
		fields: [
			{ label: 'Your Name', name: 'userName', type: FormFieldType.TEXT, required: true },
			{ label: 'Your Age', name: 'userAge', type: FormFieldType.NUMBER, required: true },
			{ label: 'Your Email', name: 'userEmail', type: FormFieldType.EMAIL },
			{ label: 'About You', name: 'aboutYou', type: FormFieldType.LONG_TEXT },
		],
		autoContinue: false, // Requires a "Next" button click
		}),
		new FormInstruction({
		id: 'preferences-form',
		duration: 0,
		question: 'What are your preferences?',
		prompt: 'What are your preferences?', // Add this line
			fields: [

			{
			label: 'Favorite Color',
			name: 'favColor',
			type: FormFieldType.RADIO,
			options: ['Red', 'Green', 'Blue', 'Yellow'],
			required: true,
			},
			{
			label: 'Interests',
			name: 'interests',
			type: FormFieldType.MULTISELECT,
			options: ['Reading', 'Coding', 'Gaming', 'Hiking', 'Cooking', 'Gardening'],
			},
		],
		autoContinue: true, // Will auto-continue when all required fields are filled
		onCompleteCallback: (success, result) => {
			if (success && result) {
				const formData = result as Record<string, any>;
				if (formData.favColor === 'Red') {
					console.log('User prefers Red, jumping to red-path');
					return 'red-path'; // Jump to an instruction with this ID
				} else if (formData.favColor === 'Blue') {
					console.log('User prefers Blue, jumping to blue-path');
					return 'blue-path'; // Jump to an instruction with this ID
				}
			}
			return undefined; // Continue sequentially
		}
		}),
		new StillnessInstruction({
			id: 'red-path',
			duration: 3000,
			prompt: 'You chose Red! Enjoy this red stillness.',
		}),

		new StillnessInstruction({
			id: 'blue-path',
			duration: 3000,
			prompt: 'You chose Blue! Enjoy this blue stillness.',
		}),
		new StillnessInstruction({
		id: 'final-stillness',
		duration: 5000,
		prompt: 'Please remain still for a moment to complete the session.',
		}),
		new FractionationInstruction({
		id: 'final-fractionation',
			duration: 10000,
		prompt: 'Please relax for a moment to complete the session.',
		cycles: 3,
		})
	]
	},
  {
    id: 'prog_total_induction',
    title: 'Total Induction',
    description: 'A comprehensive program designed for deep hypnotic induction.',
    audioTrack: 'drone_dark.mp3', // Example, can be replaced
    videoBackground: '/spiral.mp4',
    instructions: [
      new FormInstruction({
        id: 'form_hypnotize_consent',
        prompt: 'Consent for Induction',
        question: 'Do you consent to hypnotic induction?',
        fields: [
          { label: 'Yes, hypnotize me', name: 'consent', type: FormFieldType.RADIO, options: ['yes'], required: true },
          { label: 'No, cancel session', name: 'consent', type: FormFieldType.RADIO, options: ['no'], required: true },
		  ],
		positiveReinforcement: {
			message: 'Perfect!'
		  },
		  negativeReinforcement: {
			  enabled: false
		  },

        autoContinue: false,
        onCompleteCallback: (success, result) => {
          console.log('FormInstruction onCompleteCallback result:', result);
          if (success && result && (result as Record<string, any>).consent === 'no') {
            console.log('Consent is "no", jumping to session_cancelled');
            return 'session_cancelled'; // Jump to cancellation instruction
          }
          return undefined; // Continue sequentially
        }
      }),
	new NodInstruction({ id: 'n1', prompt: 'Nod if you are ready', nodsRequired: 2, type: 'YES' }),
      new SpeechInstruction({
        id: 'speech_hypnotize_me',
        prompt: 'Say "HYPNOTIZE ME"',
        targetValue: 'HYPNOTIZE ME',
        duration: 5000
      }),
      new ReadInstruction({
        id: 'read_sounds_good',
        prompt: 'Confirmation',
        text: 'Sounds good. Let\'s begin your journey.',
        duration: 3000
      }),
      new ReadInstruction({
        id: 'read_breath_in',
        prompt: 'Guidance',
        text: 'Take a breath in...',
        duration: 3000
      }),
      new ReadInstruction({
        id: 'read_breath_out',
        prompt: 'Guidance',
        text: 'and a breath out...',
        duration: 3000
      }),
      new ReadInstruction({
        id: 'read_now',
        prompt: 'Transition',
        text: 'Now...',
        duration: 2000
      }),
	new StillnessInstruction({
		id: 'red-path',
		duration: 3000,
		prompt: 'Stay very still for a moment.',
	}),
      new ReadInstruction({
        id: 'read_turn_head',
        prompt: 'Instruction',
        text: 'Turn your head toward the numbers, and speak them out loud.',
        duration: 4000
      }),
        new CalibrationInstruction({ id: 'cal1', prompt: 'Eye Calibration' }),
      new ReadInstruction({
        id: 'read_good',
        prompt: 'Feedback',
        text: 'Good!',
        duration: 2000
      }),
      new BlinkInstruction({
        id: 'blink_hold',
        prompt: 'Hold your eyes open without blinking.',
        duration: 10000
      }),
      new ReadInstruction({
        id: 'read_perfect',
        prompt: 'Feedback',
        text: 'Perfect.',
        duration: 2000
      }),
      new FractionationInstruction({
        id: 'fractionation_deepen',
        prompt: 'Allow yourself to drift deeper with each count.',
        cycles: 2
      }),
      new ReadInstruction({
        id: 'session_cancelled', // This ID is targeted by the FormInstruction's callback
        prompt: 'Session Ended',
        text: 'Session cancelled as per your request. You may close this window.',
        duration: 5000
      		})
      	]
      }
];

// Test Programs
const TEST_PROGRAMS: Program[] = [
  {
    id: 'test_blink_instruction',
    title: 'Test Blink Instruction',
    description: 'Dedicated program for testing BlinkInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new BlinkInstruction({ id: 'blink_test', prompt: 'Blink three times', duration: 5000, blinksRequired: 3 })
    ]
  },
  {
    id: 'test_calibration_instruction',
    title: 'Test Calibration Instruction',
    description: 'Dedicated program for testing CalibrationInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new CalibrationInstruction({ id: 'calibration_test', prompt: 'Calibrate your eyes' })
    ]
  },
  {
    id: 'test_directional_gaze_instruction',
    title: 'Test Directional Gaze Instruction',
    description: 'Dedicated program for testing DirectionalGazeInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new DirectionalGazeInstruction({ id: 'gaze_left_test', prompt: 'Look Left', direction: 'LEFT', duration: 3000 }),
      new DirectionalGazeInstruction({ id: 'gaze_right_test', prompt: 'Look Right', direction: 'RIGHT', duration: 3000 })
    ]
  },
  {
    id: 'test_form_instruction',
    title: 'Test Form Instruction',
    description: 'Dedicated program for testing FormInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new FormInstruction({
        id: 'form_test',
        prompt: 'Please enter your name',
        question: 'What is your name?',
        fields: [{ label: 'Name', name: 'name', type: FormFieldType.TEXT, required: true }],
        autoContinue: true
      })
    ]
  },
  {
    id: 'test_fractionation_instruction',
    title: 'Test Fractionation Instruction',
    description: 'Dedicated program for testing FractionationInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new FractionationInstruction({ id: 'fractionation_test', prompt: 'Relax and count', cycles: 2 })
    ]
  },
  {
    id: 'test_nod_instruction',
    title: 'Test Nod Instruction',
    description: 'Dedicated program for testing NodInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new NodInstruction({ id: 'nod_test', prompt: 'Nod your head twice', nodsRequired: 2, type: 'YES' })
    ]
  },
  {
    id: 'test_read_instruction',
    title: 'Test Read Instruction',
    description: 'Dedicated program for testing ReadInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new ReadInstruction({ id: 'read_test', prompt: 'Read this text', text: 'This is a test message.', duration: 3000 })
    ]
  },
  {
    id: 'test_speech_instruction',
    title: 'Test Speech Instruction',
    description: 'Dedicated program for testing SpeechInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new SpeechInstruction({ id: 'speech_test', prompt: 'Say "hello"', targetValue: 'hello', duration: 3000 })
    ]
  },
  {
    id: 'test_stillness_instruction',
    title: 'Test Stillness Instruction',
    description: 'Dedicated program for testing StillnessInstruction.',
    audioTrack: 'silence.mp3',
    videoBackground: '/spiral.mp4',
    instructions: [
      new StillnessInstruction({ id: 'stillness_test', prompt: 'Remain perfectly still', duration: 5000 })
    ]
  },
  {
    id: 'test_type_instruction',
    title: 'Test Type Instruction',
    description: 'Dedicated program for testing TypeInstruction.',
    audioTrack: 'silence.mp4',
    videoBackground: '/spiral.mp4',
    instructions: [
      new TypeInstruction({ id: 'type_test', prompt: 'Type "test"', targetPhrase: 'test' })
    ]
  }
];
      
      interface DashboardProps {  // onStartSession: (program: Program, subjectId: string) => void; // Will be an emit
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

  if (users.value.length > 0) {
    selectedUser.value = users.value[0].id;
  }
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
  <div
    class="h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-900 selection:text-white flex"
  >
    <!-- Sidebar -->
    <aside
      class="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-8"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tighter text-white mb-1">
          NCRS
        </h1>
        <p class="text-xs text-zinc-500 uppercase tracking-widest">
          Research Suite v2.1
        </p>
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
      <div
        v-if="activeTab === 'start'"
        class="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <header>
          <h2 class="text-3xl font-light text-white mb-2">Configure Session</h2>
          <p class="text-zinc-500">
            Select a subject and a conditioning protocol to begin.
          </p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Subject Select -->
          <div class="space-y-4">
            <label
              class="text-xs uppercase font-bold text-zinc-500 tracking-wider"
              >Select Subject</label
            >
            <select
              class="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
              v-model="selectedUser"
            >
              <option value="">-- Choose Subject --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.name }} (Score: {{ u.totalScore }})
              </option>
            </select>
            <p v-if="users.length === 0" class="text-sm text-red-400">
              No subjects found. Create one in 'Subjects' tab.
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <label
            class="text-xs uppercase font-bold text-zinc-500 tracking-wider"
            >Full Protocols</label
          >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="prog in FULL_PROGRAMS"
              :key="prog.id"
              class="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all"
            >
              <div class="flex flex-col h-full">
                <div>
                  <h3
                    class="text-xl font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors text-left"
                  >
                    {{ prog.title }}
                  </h3>
                  <p class="text-sm text-zinc-400 mt-2 text-left">
                    {{ prog.description }}
                  </p>
                </div>
                <div class="flex gap-2 mt-4 flex-wrap">
                    <span
                      class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500"
                      >{{ prog.instructions.length }} steps</span
                    >
                    <span
                      class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500"
                      >Audio: {{ prog.audioTrack }}</span
                    >
                  </div>
                <div class="mt-auto pt-4">
                  <button
                    :disabled="!selectedUser"
                    @click="handleStartSession(prog)"
                    class="bg-cyan-900 w-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
                  >
                    INITIALIZE
                  </button>
                </div>
              </div>
            </div>
          </div>

          <label
            class="mt-8 text-xs uppercase font-bold text-zinc-500 tracking-wider"
            >Test Protocols</label
          >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="prog in TEST_PROGRAMS"
              :key="prog.id"
              class="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all"
            >
              <div class="flex flex-col h-full">
                <div>
                  <h3
                    class="text-xl font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors text-left"
                  >
                    {{ prog.title }}
                  </h3>
                  <p class="text-sm text-zinc-400 mt-2 text-left">
                    {{ prog.description }}
                  </p>
                </div>
                <div class="flex gap-2 mt-4 flex-wrap">
                    <span
                      class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500"
                      >{{ prog.instructions.length }} steps</span
                    >
                    <span
                      class="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500"
                      >Audio: {{ prog.audioTrack }}</span
                    >
                  </div>
                <div class="mt-auto pt-4">
                  <button
                    :disabled="!selectedUser"
                    @click="handleStartSession(prog)"
                    class="bg-cyan-900 w-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
                  >
                    INITIALIZE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="activeTab === 'history'"
        class="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h2 class="text-3xl font-light text-white mb-6">Session Logs</h2>
        <div
          class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <table class="w-full text-left text-sm">
            <thead
              class="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-medium"
            >
              <tr>
                <th class="px-6 py-4">Session ID</th>
                <th class="px-6 py-4">Subject</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4 text-right">Score</th>
                <th class="px-6 py-4 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              <tr
                v-for="s in sessions"
                :key="s.id"
                class="hover:bg-zinc-800/30"
              >
                <td class="px-6 py-4 font-mono text-zinc-500">{{ s.id }}</td>
                <td class="px-6 py-4 text-white font-medium">
                  {{ getSubjectName(s.subjectId) }}
                </td>
                <td class="px-6 py-4 text-zinc-400">
                  {{ new Date(s.startTime).toLocaleString() }}
                </td>
                <td class="px-6 py-4 text-right font-mono text-cyan-400">
                  {{ s.totalScore }}
                </td>
                <td class="px-6 py-4 text-right text-zinc-400">
                  {{ getSessionAccuracy(s) }}%
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="sessions.length === 0"
            class="p-8 text-center text-zinc-500"
          >
            No session data available.
          </div>
        </div>
      </div>

      <div
        v-else-if="activeTab === 'users'"
        class="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h2 class="text-3xl font-light text-white mb-6">Subject Management</h2>

        <div
          class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 flex gap-4 items-end"
        >
          <div class="flex-1">
            <label
              class="text-xs uppercase font-bold text-zinc-500 tracking-wider block mb-2"
              >New Subject Name</label
            >
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
          <div
            v-for="u in users"
            :key="u.id"
            class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between"
          >
            <div>
              <h3 class="text-lg font-bold text-white">{{ u.name }}</h3>
              <p class="text-xs text-zinc-500 font-mono mt-1">{{ u.id }}</p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-end"
            >
              <div>
                <div class="text-xs text-zinc-500 uppercase">Total Score</div>
                <div class="text-2xl font-mono text-cyan-400">
                  {{ u.totalScore }}
                </div>
              </div>
              <div class="text-xs text-zinc-400">
                {{ u.history.length }} Sessions
              </div>
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
