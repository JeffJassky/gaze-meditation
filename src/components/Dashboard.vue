<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { User, Program, SessionLog } from '../types'
import { FormFieldType } from '../types'
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService'
import { SpeechInstruction } from '../instructions/SpeechInstruction'
import { CalibrationInstruction } from '../instructions/CalibrationInstruction'
import { DirectionalGazeInstruction } from '../instructions/DirectionalGazeInstruction'
import { StillnessInstruction } from '../instructions/StillnessInstruction'
import { FormInstruction } from '../instructions/FormInstruction'
import { BlinkInstruction } from '../instructions/BlinkInstruction'
import { TypeInstruction } from '../instructions/TypeInstruction'
import { NodInstruction } from '../instructions/NodInstruction'
import { FractionationInstruction } from '../instructions/FractionationInstruction'
import { ReadInstruction } from '../instructions/ReadInstruction' // Import new ReadInstruction
import { CloseEyesInstruction } from '../instructions/CloseEyesInstruction'
import { OpenEyesInstruction } from '../instructions/OpenEyesInstruction'
import { RelaxJawInstruction } from '../instructions/RelaxJawInstruction'
import { TongueOutInstruction } from '../instructions/TongueOutInstruction'
import { audioSession } from '../services/audio'
import somaticResetFull from '../programs/somatic-relaxaton'
import Home from './Home.vue'

// Full Programs
const FULL_PROGRAMS: Program[] = [somaticResetFull]

// Test Programs
const TEST_PROGRAMS: Program[] = [
	{
		id: 'test_tongue_out',
		title: 'Tongue Out',
		description: 'Experimental blendshape detection.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new TongueOutInstruction({
				prompt: 'Stick your tongue out!',
				duration: 20000
			})
		]
	},
	{
		id: 'test_close_eyes',
		title: 'Close Eyes (Test)',
		description: 'Instruction that waits for you to close your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new CloseEyesInstruction({
				prompt: 'Close Your Eyes',
				text: 'Please close your eyes now. The instruction will complete when you do.'
			})
		]
	},
	{
		id: 'test_open_eyes',
		title: 'Open Eyes (Test)',
		description: 'Instruction that waits for you to open your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new OpenEyesInstruction({
				prompt: 'Open Your Eyes',
				text: 'Please open your eyes now. I will chime until you do.',
				repeatAfter: 3 // faster for testing
			})
		]
	},
	{
		id: 'test_manual_fractionation',
		title: 'Manual Fractionation',
		description: 'Sequence: Close -> Open -> Close -> Open',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new ReadInstruction({
				text: "Now in a moment, I'll ask you to close your eyes."
			}),
			new ReadInstruction({
				text: "Each time you hear the bell, you'll open your eyes."
			}),
			new CloseEyesInstruction({ text: 'Close your eyes.' }),
			new OpenEyesInstruction({ text: 'Open your eyes.' }),
			new ReadInstruction({
				text: [
					'Good.',
					'Each time the swirling light returns, you are 10 times more relaxed.'
				]
			}),
			new CloseEyesInstruction({ text: 'Close those eyes again.' }),
			new OpenEyesInstruction({ text: 'Open your eyes.' }),
			new ReadInstruction({
				text: ['Deeper and deeper.']
			}),
			new CloseEyesInstruction({ text: 'Close those eyes again.' }),
			new OpenEyesInstruction({ text: 'And open your eyes.' })
		]
	},
	{
		id: 'test_relax_jaw',
		title: 'Relax Jaw',
		description: 'Relax your jaw and let your mouth fall open.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new RelaxJawInstruction({
				prompt: 'Open your mouth and relax your jaw',
				duration: 1000
			})
		]
	},
	{
		id: 'test_blink_instruction',
		title: 'Dont Blink',
		description: "Stare at the screen. Don't you dare blink.",
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new BlinkInstruction({
				prompt: 'Blink three times',
				duration: 5000
			})
		]
	},
	{
		id: 'test_calibration_instruction',
		title: 'Calibration',
		description: ' CalibrationInstruction.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [new CalibrationInstruction({ prompt: 'Calibrate your eyes' })]
	},
	{
		id: 'test_directional_gaze_instruction',
		title: 'Direct Your Gaze',
		description: 'Gaze at one thing - and not the other.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new DirectionalGazeInstruction({
				prompt: 'Gently turn your head to the left.',
				direction: 'LEFT'
			}),
			new DirectionalGazeInstruction({
				prompt: 'Gently turn your head to the right.',
				direction: 'RIGHT'
			}),
			new DirectionalGazeInstruction({
				prompt: 'Gently upward.',
				direction: 'UP'
			}),
			new DirectionalGazeInstruction({
				prompt: 'Down.',
				direction: 'DOWN',
				duration: 10000
			})
		]
	},
	{
		id: 'test_form_instruction',
		title: 'Fill out a Form',
		description: 'Answer questons in a form.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new FormInstruction({
				prompt: 'Please enter your name',
				question: 'What is your name?',
				fields: [{ label: 'Name', name: 'name', type: FormFieldType.TEXT, required: true }],
				autoContinue: true
			})
		]
	},
	{
		id: 'test_fractionation_instruction',
		title: 'Fractionation',
		description: 'Open and close your eyes. Go deeper each time.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new FractionationInstruction({
				prompt: 'Close your eyes.',
				cycles: 1
			})
		]
	},
	{
		id: 'test_nod_instruction',
		title: 'Nod & Shake your Head',
		description: 'Nod or shake your head as instructed.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new NodInstruction({
				prompt: 'Nod your head twice',
				type: 'YES',
				showProgress: true
			}),
			new NodInstruction({
				prompt: 'Shake your head twice',
				type: 'NO',
				showProgress: true
			})
		]
	},
	{
		id: 'test_read_instruction',
		title: 'Read',
		description: 'Simply read what is shown.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new ReadInstruction({
				prompt: 'This waited 3 seconds to fade in',
				text: 'It lasts 3 seconds, then fades out',
				duration: 3000,
				delay: 3000,
				fadeInDuration: 1000,
				fadeOutDuration: 1000
			}),
			new ReadInstruction({
				prompt: 'This shows up instantly',
				text: 'lasts 1 second, then fades out over 5 seconds',
				duration: 1000,
				fadeOutDuration: 5000
			})
		]
	},
	{
		id: 'test_speech_instruction',
		title: 'Compelled Speech',
		description: "Speak the words you're told to.",
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new SpeechInstruction({
				prompt: 'Speak these words',
				targetValue: 'this is a speech test',
				duration: 3000
			})
		]
	},
	{
		id: 'test_stillness_instruction',
		title: 'Stay Still',
		description: 'Stay very... very... still.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		instructions: [
			new ReadInstruction({
				text: ['Prepare to be still.', 'Be still.']
			}),
			new StillnessInstruction({
				prompt: 'keep the blue dot centered in the ring.',
				duration: 20000
			})
		]
	},
	{
		id: 'test_type_instruction',
		title: 'Type',
		description: 'Type the words you see them.',
		audio: { musicTrack: 'silence.mp4' },
		spiralBackground: '/img/spiral.png',
		instructions: [new TypeInstruction({ prompt: 'Type "test"', targetPhrase: 'test' })]
	},
	{
		id: 'test_binaural_audio',
		title: 'Binaural Audio',
		description: 'Test of binaural audio (6hz to 3hz)',
		audio: {
			binaural: { hertz: 6, volume: 0.5 }
		},
		spiralBackground: '/img/spiral.png',
		instructions: [
			new ReadInstruction({
				prompt: 'Audio Test (6Hz)',
				text: '6hz binural beats are playing at 50% volume',
				duration: 5000
			}),
			new ReadInstruction({
				prompt: 'Audio Test (3Hz)',
				text: 'Slowing down to 3Hz... Deep relaxation.',
				duration: 5000,
				audio: {
					binaural: { hertz: 3, volume: 0.5 }
				}
			})
		]
	}
]

interface DashboardProps {
	// onStartSession: (program: Program, subjectId: string) => void; // Will be an emit
}

const props = defineProps<DashboardProps>()
const emit = defineEmits<{
	(e: 'startSession', program: Program, subjectId: string): void
}>()

const users = ref<User[]>([])
const sessions = ref<SessionLog[]>([])
const selectedUser = ref<string>('')
const activeTab = ref<'home' | 'start' | 'history' | 'users'>('home')
const newUserName = ref('')
const isSidebarOpen = ref(false)

const refreshData = () => {
	users.value = getUsers()
	sessions.value = getSessions().reverse() // Newest first

	if (users.value.length > 0 && users.value[0]?.id) {
		selectedUser.value = users.value[0].id
	}
}

const handleCreateUser = () => {
	if (!newUserName.value) return
	const newUser: User = {
		id: `SUB_${Math.floor(Math.random() * 1000)}`,
		name: newUserName.value,
		totalScore: 0,
		history: []
	}
	saveUser(newUser)
	newUserName.value = ''
	refreshData()
	activeTab.value = 'start'
}

const handleStartSession = async (program: Program) => {
	if (!selectedUser.value) return

	// Initialize audio on user gesture to unlock AudioContext (especially for Safari/Chrome autoplay policies)
	try {
		await audioSession.setup()
	} catch (e) {
		console.warn('Failed to pre-initialize audio context', e)
	}

	emit('startSession', program, selectedUser.value)
}

const getSubjectName = (subjectId: string) => {
	return users.value.find(u => u.id === subjectId)?.name || subjectId
}

const getSessionAccuracy = (s: SessionLog) => {
	return Math.round((s.metrics.filter(m => m.success).length / s.metrics.length) * 100) || 0
}

onMounted(() => {
	seedDatabase()
	refreshData()
})
</script>

<template>
	<div
		class="dashboard h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-900 selection:text-white flex flex-col md:flex-row relative overflow-hidden"
	>
		<!-- Mobile Header -->
		<header
			class="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"
		>
			<div class="flex flex-col">
				<h1 class="text-xl font-bold tracking-tighter text-white">GAZE</h1>
				<p class="text-[10px] text-zinc-500 uppercase tracking-widest">v2.1</p>
			</div>
			<button
				@click="isSidebarOpen = !isSidebarOpen"
				class="p-2 text-zinc-400 hover:text-white transition-colors"
			>
				<svg
					v-if="!isSidebarOpen"
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16m-7 6h7"
					/>
				</svg>
				<svg
					v-else
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</header>

		<!-- Mobile Overlay -->
		<div
			v-if="isSidebarOpen"
			@click="isSidebarOpen = false"
			class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
		></div>

		<!-- Sidebar -->
		<aside
			:class="`fixed md:static inset-y-0 left-0 w-64 border-r border-zinc-800 bg-zinc-900 md:bg-zinc-900/50 p-6 flex flex-col gap-8 z-50 transform transition-transform duration-300 ease-in-out ${
				isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
			}`"
		>
			<div class="hidden md:block">
				<h1 class="text-2xl font-bold tracking-tighter text-white mb-1">GAZE</h1>
				<p class="text-xs text-zinc-500 uppercase tracking-widest">
					Interactive Meditation
				</p>
			</div>

			<!-- Subject Selection -->
			<div class="space-y-2">
				<label class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider"
					>Active Subject</label
				>
				<select
					class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none appearance-none cursor-pointer"
					v-model="selectedUser"
				>
					<option value="">-- Choose Subject --</option>
					<option
						v-for="u in users"
						:key="u.id"
						:value="u.id"
					>
						{{ u.name }}
					</option>
				</select>
				<p
					v-if="users.length === 0"
					class="text-[10px] text-red-400/80 leading-tight"
				>
					No subjects found. Create one in 'Subjects' tab.
				</p>
			</div>

			<nav class="flex flex-col gap-2">
				<button
					@click="
						() => {
							activeTab = 'home'
							isSidebarOpen = false
						}
					"
					:class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
						activeTab === 'home'
							? 'bg-zinc-800 text-cyan-400'
							: 'hover:bg-zinc-800/50 text-zinc-400'
					}`"
				>
					Home
				</button>
				<button
					@click="
						() => {
							activeTab = 'start'
							isSidebarOpen = false
						}
					"
					:class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
						activeTab === 'start'
							? 'bg-zinc-800 text-cyan-400'
							: 'hover:bg-zinc-800/50 text-zinc-400'
					}`"
				>
					Start Session
				</button>
				<button
					@click="
						() => {
							activeTab = 'history'
							isSidebarOpen = false
						}
					"
					:class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
						activeTab === 'history'
							? 'bg-zinc-800 text-cyan-400'
							: 'hover:bg-zinc-800/50 text-zinc-400'
					}`"
				>
					Data Logs
				</button>
				<button
					@click="
						() => {
							activeTab = 'users'
							isSidebarOpen = false
						}
					"
					:class="`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
						activeTab === 'users'
							? 'bg-zinc-800 text-cyan-400'
							: 'hover:bg-zinc-800/50 text-zinc-400'
					}`"
				>
					Subjects
				</button>
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 p-6 md:p-12 overflow-y-auto">
			<Home v-if="activeTab === 'home'" />

			<div
				v-if="activeTab === 'start'"
				class="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
			>
				<header>
					<h2 class="text-3xl font-light text-white mb-2">Select a Program</h2>
					<p class="text-zinc-500">Select a conditioning protocol to begin.</p>
				</header>

				<div class="space-y-4">
					<label class="text-xs uppercase font-bold text-zinc-500 tracking-wider"
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
										>Audio: {{ prog.audio?.musicTrack }}</span
									>
								</div>
								<div class="mt-auto pt-4">
									<button
										:disabled="!selectedUser"
										@click="handleStartSession(prog)"
										class="bg-cyan-900 w-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
									>
										Start
									</button>
								</div>
							</div>
						</div>
					</div>
					<br />
					<br />
					<label class="mt-8 text-xs uppercase font-bold text-zinc-500 tracking-wider"
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
										>Audio: {{ prog.audio?.musicTrack }}</span
									>
								</div>
								<div class="mt-auto pt-4">
									<button
										:disabled="!selectedUser"
										@click="handleStartSession(prog)"
										class="bg-cyan-900 w-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
									>
										Start
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
