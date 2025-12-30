<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { User, Session, SessionLog } from '../types'
import { FormFieldType } from '../types'
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService'
import { audioSession } from '../services/audio'
import somaticResetFull from '../programs/somatic-relaxaton'
import Home from './Home.vue'
import SessionCard from './SessionCard.vue'
import SessionDetail from './SessionDetail.vue'
import theBlueDoor from '../programs/the-blue-door'
import councilOfFireLong from '../programs/council-of-fire'
import { initialTrainingSession } from '../programs/tutorial'
import somaticResetActive from '../programs/kinetic-reset'
import { heldWithoutRope } from '../programs/held-without-rope'

// Full Sessions
const FULL_SESSIONS: Session[] = [
	somaticResetFull,
	councilOfFireLong,
	theBlueDoor,
	somaticResetActive
]

// Fun & Sexy Sessions
const FUN_SESSIONS: Session[] = [heldWithoutRope]

// Test Sessions
const TEST_SESSIONS: Session[] = [
	{
		id: 'test_breathe_scene',
		title: 'Breathe',
		description: 'Adaptive breath tracking using head pitch.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Just breathe naturally.',
				behavior: {
					suggestions: [{ type: 'breathe', duration: 20000 }]
				}
			}
		]
	},
	{
		id: 'test_close_eyes',
		title: 'Close Eyes (Test)',
		description: 'Scene that waits for you to close your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Please close your eyes now. The scene will complete when you do.',
				behavior: {
					suggestions: [{ type: 'eyes:close' }]
				}
			}
		]
	},
	{
		id: 'test_open_eyes',
		title: 'Open Eyes (Test)',
		description: 'Scene that waits for you to open your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Open your eyes.',
				behavior: {
					suggestions: [{ type: 'eyes:open' }]
				}
			}
		]
	},
	{
		id: 'test_relax_jaw',
		title: 'Relax Jaw',
		description: 'Relax your jaw and let your mouth fall open.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Open your mouth and relax your jaw',
				behavior: {
					suggestions: [{ type: 'mouth:relax', duration: 5000 }]
				}
			}
		]
	},
	{
		id: 'test_blink_scene',
		title: 'Dont Blink',
		description: "Stare at the screen. Don't you dare blink.",
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Do not blink',
				behavior: {
					suggestions: [{ type: 'eyes:no-blink', duration: 5000 }]
				}
			}
		]
	},
	{
		id: 'test_directional_gaze_scene',
		title: 'Direct Your Gaze',
		description: 'Gaze at one thing - and not the other.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Gently turn your head to the left.',
				behavior: {
					suggestions: [{ type: 'head:left' }]
				}
			},
			{
				text: 'Gently turn your head to the right.',
				behavior: {
					suggestions: [{ type: 'head:right' }]
				}
			},
			{
				text: 'Gently upward.',
				behavior: {
					suggestions: [{ type: 'head:up' }]
				}
			},
			{
				text: 'Down.',
				behavior: {
					suggestions: [{ type: 'head:down', duration: 10000 }]
				}
			}
		]
	},
	{
		id: 'test_form_scene',
		title: 'Fill out a Form',
		description: 'Answer questons in a form.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Please enter your name',
				behavior: {
					suggestions: [{ type: 'form:submit' }]
				},
				question: 'What is your name?',
				fields: [{ label: 'Name', name: 'name', type: FormFieldType.TEXT, required: true }],
				autoContinue: true
			} as any // Cast to any because FormSceneConfig extends SceneConfig
		]
	},
	{
		id: 'test_nod_scene',
		title: 'Nod & Shake your Head',
		description: 'Nod or shake your head as instructed.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Nod your head twice',
				behavior: {
					suggestions: [{ type: 'head:nod', options: { nodsRequired: 2 } }]
				}
			},
			{
				text: 'Shake your head twice',
				behavior: {
					suggestions: [{ type: 'head:shake', options: { nodsRequired: 2 } }]
				}
			}
		]
	},
	{
		id: 'test_read_scene',
		title: 'Read',
		description: 'Simply read what is shown.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'It lasts 3 seconds, then fades out',
				duration: 3000,
				fadeInDuration: 1000,
				fadeOutDuration: 1000
			},
			{
				text: 'lasts 1 second, then fades out over 5 seconds',
				duration: 1000,
				fadeOutDuration: 5000
			}
		]
	},
	{
		id: 'test_speech_scene',
		title: 'Verbal Affirmation',
		description: 'Speak what you see.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Read this aloud',
				behavior: {
					suggestions: [
						{
							type: 'speech:speak',
							options: { targetValue: 'I am reading this.', duration: 3000 }
						}
					]
				}
			}
		]
	},
	{
		id: 'test_stillness_scene',
		title: 'Stay Still',
		description: 'Stay very... very... still.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'keep the blue dot centered in the ring.',
				behavior: {
					suggestions: [{ type: 'head:still', duration: 20000 }]
				}
			}
		]
	},
	{
		id: 'test_type_scene',
		title: 'Type',
		description: 'Type the words you see them.',
		audio: { musicTrack: 'silence.mp4' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Type "test"',
				behavior: { suggestions: [{ type: 'type', options: { targetPhrase: 'test' } }] }
			}
		]
	},
	{
		id: 'test_binaural_audio',
		title: 'Binaural Audio',
		description: 'Test of binaural audio (6hz to 3hz)',
		audio: {
			binaural: { hertz: 6, volume: 0.5 }
		},
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: '6hz binural beats are playing at 50% volume',
				duration: 5000
			},
			{
				text: 'Slowing down to 3Hz... Deep relaxation.',
				duration: 5000,
				audio: {
					binaural: { hertz: 3, volume: 0.5 }
				}
			}
		]
	}
].map(session => ({
	...session,
	skipIntro: true
}))

interface DashboardProps {
	// onStartSession: (program: Session, subjectId: string) => void; // Will be an emit
	initialTab?: 'home' | 'start' | 'history' | 'users'
}

const props = defineProps<DashboardProps>()
const emit = defineEmits<{
	(e: 'startSession', program: Session, subjectId: string): void
}>()

const users = ref<User[]>([])
const sessions = ref<SessionLog[]>([])
const selectedUser = ref<string>('')
const activeTab = ref<'home' | 'start' | 'history' | 'users'>(props.initialTab || 'home')
const newUserName = ref('')
const isSidebarOpen = ref(false)
const isTransitioning = ref(false)
const expandedSessionId = ref<string | null>(null)

// Fun & Sexy Password Wall
const isFunSessionsUnlocked = ref(false)
const showPasswordPrompt = ref(false)
const passwordInput = ref('')

const checkPassword = () => {
	if (passwordInput.value === '1234') {
		isFunSessionsUnlocked.value = true
		showPasswordPrompt.value = false
		passwordInput.value = ''
	}
}

const toggleExpand = (id: string) => {
	expandedSessionId.value = expandedSessionId.value === id ? null : id
}

const refreshData = () => {
	users.value = getUsers()
	sessions.value = getSessions().reverse() // Newest first

	const firstUser = users.value[0]
	if (users.value.length > 0 && firstUser) {
		selectedUser.value = firstUser.id
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

const handleStartSession = async (program: Session) => {
	if (!selectedUser.value) return

	// Start transition
	isTransitioning.value = true

	// Initialize audio on user gesture to unlock AudioContext (especially for Safari/Chrome autoplay policies)
	try {
		await audioSession.setup()
	} catch (e) {
		console.warn('Failed to pre-initialize audio context', e)
	}

	// Wait for fade to complete (1s) before switching view
	setTimeout(() => {
		emit('startSession', program, selectedUser.value)
		// We don't reset isTransitioning here because the component will likely be unmounted/replaced.
		// If the parent keeps it alive, we might need to reset it, but for now assuming unmount/view switch.
	}, 1000)
}

const handleStartTutorial = () => {
	// Ensure a user is selected
	if (!selectedUser.value) {
		const firstUser = users.value[0]
		if (firstUser) {
			selectedUser.value = firstUser.id
		} else {
			// Fallback if no users exist (should be covered by seedDatabase, but good for safety)
			const newUser: User = {
				id: `SUB_${Math.floor(Math.random() * 1000)}`,
				name: 'Guest',
				totalScore: 0,
				history: []
			}
			saveUser(newUser)
			refreshData()
			selectedUser.value = newUser.id
		}
	}
	handleStartSession(initialTrainingSession)
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
				<p class="text-xs text-zinc-500 uppercase tracking-widest">Interactive Hypnosis</p>
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
					Browse Sessions
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

				<div class="mt-auto pt-4 border-t border-zinc-800">
					<a
						href="/device-debug"
						class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800/50 text-zinc-500 hover:text-cyan-400 group"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-zinc-600 group-hover:text-cyan-500 transition-colors"
						>
							<path d="M20 7h-9" />
							<path d="M14 17H5" />
							<circle
								cx="17"
								cy="17"
								r="3"
							/>
							<circle
								cx="7"
								cy="7"
								r="3"
							/>
						</svg>
						Device Debug
					</a>
				</div>
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 p-6 md:p-12 overflow-y-auto">
			<Home
				v-if="activeTab === 'home'"
				@startTutorial="handleStartTutorial"
				@browseSessions="activeTab = 'start'"
			/>

			<div
				v-if="activeTab === 'start'"
				class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
			>
				<header class="text-center">
					<h2 class="text-3xl font-light text-white mb-2">Select a Session</h2>
					<p class="text-zinc-500">Explore these curated Hypnosis sessions.</p>
				</header>

				<div class="space-y-4">
					<div
						class="group relative bg-zinc-900 border border-cyan-500/30 p-8 rounded-2xl hover:border-cyan-400 transition-all overflow-hidden"
					>
						<!-- Subtle background glow -->
						<div
							class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full"
						></div>

						<div
							class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
						>
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-3">
									<span
										class="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-cyan-500/20"
										>Get Started</span
									>
								</div>
								<div class="flex items-center gap-3">
									<h3
										class="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors text-left"
									>
										{{ initialTrainingSession.title }}
									</h3>
									<span
										class="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 border border-zinc-700 whitespace-nowrap"
									>
										{{ Math.ceil(initialTrainingSession.scenes.length / 4) }}-{{
											Math.ceil(initialTrainingSession.scenes.length / 3)
										}}
										min
									</span>
								</div>
								<p class="text-zinc-400 max-w-xl text-left">
									{{ initialTrainingSession.description }}
								</p>
							</div>
							<div class="flex flex-col items-end gap-4">
								<button
									:disabled="!selectedUser"
									@click="handleStartSession(initialTrainingSession)"
									class="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
								>
									Start Introduction
								</button>
							</div>
						</div>
					</div>

					<label
						class="pt-4 text-xs uppercase font-bold text-zinc-500 tracking-wider block text-center"
						>Full Sessions</label
					>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<SessionCard
							v-for="prog in FULL_SESSIONS"
							:key="prog.id"
							:program="prog"
							:disabled="!selectedUser"
							@start="handleStartSession"
						/>
					</div>
					<br />
					<br />
					<br />
					<br />
					<!-- Fun & Sexy Section (Password Protected) -->
					<div v-if="isFunSessionsUnlocked">
						<label
							class="mt-8 text-xs uppercase font-bold text-zinc-500 tracking-wider block text-center animate-in fade-in"
							>Fun & Sexy Sessions</label
						>
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2"
						>
							<SessionCard
								v-for="prog in FUN_SESSIONS"
								:key="prog.id"
								:program="prog"
								:disabled="!selectedUser"
								@start="handleStartSession"
							/>
						</div>
					</div>
					<div
						v-else
						class="mt-8 flex flex-col items-center justify-center gap-4"
					>
						<button
							v-if="!showPasswordPrompt"
							@click="showPasswordPrompt = true"
							class="text-xs uppercase font-bold text-zinc-600 hover:text-cyan-400 tracking-wider transition-colors border border-zinc-800 hover:border-cyan-500/50 rounded-full px-4 py-2"
						>
							Restricted Access
						</button>
						<div
							v-else
							class="flex items-center gap-2 animate-in fade-in zoom-in-95"
						>
							<input
								ref="passwordInputRef"
								type="password"
								v-model="passwordInput"
								@input="checkPassword"
								placeholder="Enter Code"
								class="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 w-32 text-center focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
								autofocus
							/>
							<button
								@click="
									() => {
										showPasswordPrompt = false
										passwordInput = ''
									}
								"
								class="text-zinc-500 hover:text-white"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
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
						</div>
					</div>

					<br />
					<br />
					<br />
					<br />
					<label
						class="mt-8 text-xs uppercase font-bold text-zinc-500 tracking-wider block text-center"
						>Test Sessions</label
					>
					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
						style="opacity: 0.5"
					>
						<SessionCard
							v-for="prog in TEST_SESSIONS"
							:key="prog.id"
							:program="prog"
							:disabled="!selectedUser"
							@start="handleStartSession"
						/>
					</div>
				</div>
			</div>

			<div
				v-else-if="activeTab === 'history'"
				class="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
			>
				<h2 class="text-3xl font-light text-white mb-6 text-center">Session Logs</h2>
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
							<template
								v-for="s in sessions"
								:key="s.id"
							>
								<tr
									@click="toggleExpand(s.id)"
									class="hover:bg-zinc-800/30 cursor-pointer transition-colors"
									:class="expandedSessionId === s.id ? 'bg-zinc-800/20' : ''"
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
								<tr
									v-if="expandedSessionId === s.id"
									class="bg-zinc-900/50"
								>
									<td
										colspan="5"
										class="p-4"
									>
										<SessionDetail :session="s" />
									</td>
								</tr>
							</template>
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
				class="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
			>
				<h2 class="text-3xl font-light text-white mb-6 text-center">Subject Management</h2>

				<div
					class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-center md:items-end"
				>
					<div class="w-full flex-1">
						<label
							class="text-xs uppercase font-bold text-zinc-500 tracking-wider block mb-2 text-center"
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
							<h3 class="text-lg font-bold text-white text-left">{{ u.name }}</h3>
							<p class="text-xs text-zinc-500 font-mono mt-1 text-left">{{ u.id }}</p>
						</div>
						<div
							class="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-end"
						>
							<div>
								<div class="text-xs text-zinc-500 uppercase text-left">
									Total Score
								</div>
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

		<!-- Transition Overlay -->
		<div
			class="fixed inset-0 bg-black z-[100] pointer-events-none transition-opacity duration-1000 ease-in-out"
			:class="isTransitioning ? 'opacity-100' : 'opacity-0'"
		></div>
	</div>
</template>

<style scoped>
/* No specific scoped styles needed, using Tailwind */
</style>
