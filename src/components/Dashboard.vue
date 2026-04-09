<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { User, SessionLog } from '../types'
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService'
import { historyApi, type SessionRun } from '../services/history'
import { sessionsApi, type SessionDoc } from '../services/sessions'
import { audioSession } from '../services/audio'
import { useRouter } from 'vue-router'
import { auth } from '../state/auth'
import Home from './Home.vue'
import SessionCard from './SessionCard.vue'
import SessionDetail from './SessionDetail.vue'

/**
 * Sessions the signed-in user can play. Fetched from /sessions on mount
 * and whenever the auth user changes. No hardcoded lists anymore — the
 * database is the sole source of truth.
 */
const availableSessions = ref<SessionDoc[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref<string | null>(null)

async function loadAvailableSessions() {
	if (!auth.state.user) {
		availableSessions.value = []
		return
	}
	sessionsLoading.value = true
	sessionsError.value = null
	try {
		const res = await sessionsApi.list({ mine: true, limit: 200 })
		availableSessions.value = res.items
	} catch (err) {
		sessionsError.value = (err as Error).message
		console.warn('[Dashboard] failed to load sessions', err)
	} finally {
		sessionsLoading.value = false
	}
}

/**
 * The imported tutorial session, identified by slug. Used by the
 * "Start Introduction" CTA. Null until the sessions list resolves.
 */
const tutorialSession = computed<SessionDoc | null>(() => {
	return (
		availableSessions.value.find((s) => s.slug === 'initial-training-short') ??
		null
	)
})

/**
 * Full sessions grid excludes the tutorial (it has its own CTA above)
 * and anything flagged as hidden via settings. Sorted by creation date
 * so newer sessions appear first.
 */
const fullSessions = computed<SessionDoc[]>(() => {
	return availableSessions.value
		.filter((s) => s.slug !== 'initial-training-short')
		.slice()
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
})

const router = useRouter()

interface DashboardProps {
	initialTab?: 'home' | 'start' | 'history'
}

const props = defineProps<DashboardProps>()

const users = ref<User[]>([])
const sessions = ref<SessionLog[]>([])
const selectedUser = ref<string>('')
const activeTab = ref<'home' | 'start' | 'history'>(props.initialTab || 'home')

// Map programId -> human-readable title. Falls back to the available
// sessions list (already fetched), then to the id itself.
const getSessionTitle = (programId: string) => {
	return (
		availableSessions.value.find((s) => s.id === programId)?.title || programId
	)
}

// Completion = scenes with a metric that succeeded / total scenes in the
// program. Uses the fetched session list to find the total; falls back
// to the metrics count as a floor so the bar never reads 0%.
const getSessionCompleteness = (s: SessionLog) => {
	const prog = availableSessions.value.find((p) => p.id === s.programId)
	const total = prog?.scenes.length || s.metrics.length || 1
	const done = s.metrics.length
	return Math.min(100, Math.round((done / total) * 100))
}

const getSessionDuration = (s: SessionLog) => {
	if (!s.endTime) return '—'
	const ms = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
	const mins = Math.floor(ms / 60000)
	const secs = Math.floor((ms % 60000) / 1000)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Remote history (from Mongo via /history) for the signed-in user.
const remoteRuns = ref<SessionRun[]>([])
const historyLoading = ref(false)
const historyError = ref<string | null>(null)

async function loadHistory() {
	if (!auth.state.user) {
		remoteRuns.value = []
		return
	}
	historyLoading.value = true
	historyError.value = null
	try {
		const res = await historyApi.list({ limit: 100 })
		remoteRuns.value = res.items
	} catch (err) {
		historyError.value = (err as Error).message
		console.warn('[Dashboard] failed to load history', err)
	} finally {
		historyLoading.value = false
	}
}

// Unified row shape for the history table — remote runs take priority,
// with a local fallback so offline/logged-out users still see their runs.
interface HistoryRow {
	id: string
	programId: string
	title: string
	startTime: string
	endTime: string | null
	totalScore: number
	completeness: number
	durationMs: number
	raw: SessionRun | SessionLog
	isRemote: boolean
}

const historyRows = computed<HistoryRow[]>(() => {
	if (auth.state.user && remoteRuns.value.length > 0) {
		return remoteRuns.value.map((r) => ({
			id: r.id,
			programId: r.programId,
			title: r.programTitle || getSessionTitle(r.programId),
			startTime: r.startTime,
			endTime: r.endTime,
			totalScore: r.totalScore,
			completeness: r.completeness,
			durationMs: r.durationMs,
			raw: r,
			isRemote: true,
		}))
	}
	// Local fallback
	return sessions.value
		.filter((s) => s.subjectId === (auth.state.user?.id || selectedUser.value))
		.map((s) => {
			const dur = s.endTime
				? new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
				: 0
			return {
				id: s.id,
				programId: s.programId,
				title: getSessionTitle(s.programId),
				startTime: s.startTime,
				endTime: s.endTime || null,
				totalScore: s.totalScore,
				completeness: getSessionCompleteness(s),
				durationMs: dur,
				raw: s,
				isRemote: false,
			}
		})
})

function formatDuration(ms: number): string {
	if (!ms) return '—'
	const mins = Math.floor(ms / 60000)
	const secs = Math.floor((ms % 60000) / 1000)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

// A SessionRun → SessionLog-ish shape so <SessionDetail> can render it
// without having to be taught a new prop type.
function runAsSessionLog(r: SessionRun): SessionLog {
	return {
		id: r.id,
		subjectId: r.owner,
		programId: r.programId,
		startTime: r.startTime,
		endTime: r.endTime || undefined,
		totalScore: r.totalScore,
		metrics: r.metrics,
		physiologicalData: r.physiologicalData,
		biometrics: r.biometrics || undefined,
	}
}

// Watch for prop changes to update activeTab when navigating
watch(() => props.initialTab, (newTab) => {
	if (newTab) activeTab.value = newTab
})

const newUserName = ref('')
const isSidebarOpen = ref(false)
const isTransitioning = ref(false)
const expandedSessionId = ref<string | null>(null)

const toggleExpand = (id: string) => {
	expandedSessionId.value = expandedSessionId.value === id ? null : id
}

const refreshData = () => {
	users.value = getUsers()
	sessions.value = getSessions().reverse() // Newest first

	// Tie the local "subject" identity to the signed-in auth user so the
	// selector can go away entirely. If no auth user yet, fall back to the
	// first seeded local user.
	const authUser = auth.state.user
	if (authUser) {
		let localUser = users.value.find(u => u.id === authUser.id)
		if (!localUser) {
			localUser = {
				id: authUser.id,
				name: authUser.username,
				totalScore: 0,
				history: [],
			}
			saveUser(localUser)
			users.value = getUsers()
		}
		selectedUser.value = authUser.id
	} else {
		const firstUser = users.value[0]
		if (firstUser) selectedUser.value = firstUser.id
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

const handleStartSession = async (program: SessionDoc) => {
	if (!selectedUser.value) return

	// Start transition
	isTransitioning.value = true

	// Initialize audio on user gesture to unlock AudioContext
	try {
		await audioSession.setup()
	} catch (e) {
		console.warn('Failed to pre-initialize audio context', e)
	}

	// Wait for fade to complete (1s) before switching view
	setTimeout(() => {
		router.push({
			name: 'theater',
			params: { sessionId: program.id, subjectId: selectedUser.value },
		})
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
				history: [],
			}
			saveUser(newUser)
			refreshData()
			selectedUser.value = newUser.id
		}
	}
	const tutorial = tutorialSession.value
	if (tutorial) {
		handleStartSession(tutorial)
	} else {
		console.warn(
			'[Dashboard] Tutorial session not found. Expected a session with slug "initial-training-short".',
		)
	}
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
	loadHistory()
	loadAvailableSessions()
})

// Re-sync subject + reload sessions + reload history whenever the
// signed-in user changes.
watch(() => auth.state.user?.id, () => {
	refreshData()
	loadHistory()
	loadAvailableSessions()
})

// Reload history when the user navigates back to the history tab so a
// just-completed session shows up without a manual refresh.
watch(() => activeTab.value, (tab) => {
	if (tab === 'history') loadHistory()
})
</script>

<template>
	<div
		class="dashboard h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-900 selection:text-white flex flex-col relative overflow-hidden"
	>
		<!-- Top Header / Nav -->
		<header
			class="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30"
		>
			<div class="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
				<div class="flex items-center gap-6 md:gap-8 min-w-0">
					<router-link to="/home" class="font-semibold tracking-tight text-white whitespace-nowrap">
						GAZE
					</router-link>
					<nav class="hidden md:flex gap-1">
						<router-link
							to="/home"
							:class="[
								'px-3 py-1.5 rounded-lg text-sm transition',
								activeTab === 'home' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
							]"
						>
							Home
						</router-link>
						<router-link
							to="/sessions"
							:class="[
								'px-3 py-1.5 rounded-lg text-sm transition',
								activeTab === 'start' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
							]"
						>
							Browse Sessions
						</router-link>
						<router-link
							v-if="auth.state.user"
							to="/studio/sessions"
							class="px-3 py-1.5 rounded-lg text-sm transition text-zinc-400 hover:text-white"
						>
							Studio
						</router-link>
					</nav>
				</div>

				<div class="flex items-center gap-3">
					<router-link
						to="/logs"
						:class="[
							'hidden md:inline px-3 py-1.5 rounded-lg text-sm transition',
							activeTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
						]"
					>
						History
					</router-link>

					<template v-if="auth.state.user">
						<router-link
							to="/account"
							class="hidden md:inline text-sm text-zinc-400 hover:text-white transition"
						>
							{{ auth.state.user.username }}
						</router-link>
						<button
							type="button"
							class="hidden md:inline text-sm text-zinc-500 hover:text-white transition"
							@click="auth.logout().then(() => router.push('/login'))"
						>
							Sign out
						</button>
					</template>
					<template v-else>
						<router-link to="/login" class="hidden md:inline text-sm text-zinc-400 hover:text-white transition">
							Sign in
						</router-link>
						<router-link
							to="/register"
							class="hidden md:inline text-sm px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition"
						>
							Create account
						</router-link>
					</template>

					<button
						@click="isSidebarOpen = !isSidebarOpen"
						class="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
						aria-label="Toggle menu"
					>
						<svg v-if="!isSidebarOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
						<svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Mobile dropdown menu -->
			<div
				v-if="isSidebarOpen"
				class="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 flex flex-col gap-2"
			>
				<router-link to="/home" @click="isSidebarOpen = false" :class="['px-3 py-2 rounded-lg text-sm', activeTab === 'home' ? 'bg-zinc-800 text-white' : 'text-zinc-400']">Home</router-link>
				<router-link to="/sessions" @click="isSidebarOpen = false" :class="['px-3 py-2 rounded-lg text-sm', activeTab === 'start' ? 'bg-zinc-800 text-white' : 'text-zinc-400']">Browse Sessions</router-link>
				<router-link to="/logs" @click="isSidebarOpen = false" :class="['px-3 py-2 rounded-lg text-sm', activeTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400']">History</router-link>
				<router-link v-if="auth.state.user" to="/studio/sessions" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-zinc-400">Studio</router-link>
				<router-link to="/debug" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-zinc-500">Device Debug</router-link>
				<div class="border-t border-zinc-800 mt-2 pt-2 flex flex-col gap-1">
					<template v-if="auth.state.user">
						<router-link to="/account" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-zinc-400">{{ auth.state.user.username }}</router-link>
						<button type="button" class="text-left px-3 py-2 rounded-lg text-sm text-zinc-500" @click="auth.logout().then(() => router.push('/login'))">Sign out</button>
					</template>
					<template v-else>
						<router-link to="/login" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-zinc-300">Sign in</router-link>
						<router-link to="/register" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-cyan-300">Create account</router-link>
					</template>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 p-6 md:p-12 overflow-y-auto">
			<Home
				v-if="activeTab === 'home'"
				@startTutorial="handleStartTutorial"
				@browseSessions="activeTab = 'start'"
			/>

			<div
				v-if="activeTab === 'start'"
				class="max-w-4xl mx-auto space-y-8"
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
										{{ tutorialSession?.title ?? 'Tutorial' }}
									</h3>
									<span
										v-if="tutorialSession"
										class="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 border border-zinc-700 whitespace-nowrap"
									>
										{{ Math.ceil(tutorialSession.scenes.length / 4) }}-{{
											Math.ceil(tutorialSession.scenes.length / 3)
										}}
										min
									</span>
								</div>
								<p class="text-zinc-400 max-w-xl text-left">
									{{ tutorialSession?.description ?? 'Learn how Gaze works.' }}
								</p>
							</div>
							<div class="flex flex-col items-end gap-4">
								<button
									:disabled="!selectedUser || !tutorialSession"
									@click="handleStartTutorial"
									class="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
								>
									Start Introduction
								</button>
							</div>
						</div>
					</div>

					<label
						class="pt-4 text-xs uppercase font-bold text-zinc-500 tracking-wider block text-center"
						>Sessions</label
					>

					<div
						v-if="sessionsLoading && fullSessions.length === 0"
						class="text-center text-sm text-zinc-500 py-8">
						Loading sessions…
					</div>
					<div
						v-else-if="sessionsError"
						class="text-center text-sm text-red-400 py-8">
						{{ sessionsError }}
					</div>
					<div
						v-else-if="fullSessions.length === 0"
						class="text-center text-sm text-zinc-500 py-8">
						No sessions yet.
						<router-link
							to="/studio/sessions"
							class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
							Create one in the studio
						</router-link>
						.
					</div>
					<div
						v-else
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<SessionCard
							v-for="prog in fullSessions"
							:key="prog.id"
							:program="prog"
							:disabled="!selectedUser"
							@start="handleStartSession" />
					</div>

				</div>
			</div>

			<div
				v-else-if="activeTab === 'history'"
				class="max-w-6xl mx-auto"
			>
				<h2 class="text-3xl font-light text-white mb-6 text-center">History</h2>
				<div v-if="historyError" class="mb-4 text-xs text-red-400/80 text-center">
					{{ historyError }}
				</div>
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
					<table class="w-full text-left text-sm">
						<thead class="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-medium">
							<tr>
								<th class="px-6 py-4">Session</th>
								<th class="px-6 py-4">Date</th>
								<th class="px-6 py-4 text-right">Duration</th>
								<th class="px-6 py-4 text-right">Completeness</th>
								<th class="px-6 py-4 text-right">Score</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-800">
							<template
								v-for="row in historyRows"
								:key="row.id"
							>
								<tr
									@click="toggleExpand(row.id)"
									class="hover:bg-zinc-800/30 cursor-pointer transition-colors"
									:class="expandedSessionId === row.id ? 'bg-zinc-800/20' : ''"
								>
									<td class="px-6 py-4 text-white font-medium">
										{{ row.title }}
									</td>
									<td class="px-6 py-4 text-zinc-400">
										{{ new Date(row.startTime).toLocaleString() }}
									</td>
									<td class="px-6 py-4 text-right font-mono text-zinc-400">
										{{ formatDuration(row.durationMs) }}
									</td>
									<td class="px-6 py-4 text-right text-zinc-400">
										{{ row.completeness }}%
									</td>
									<td class="px-6 py-4 text-right font-mono text-cyan-400">
										{{ row.totalScore }}
									</td>
								</tr>
								<tr
									v-if="expandedSessionId === row.id"
									class="bg-zinc-900/50"
								>
									<td colspan="5" class="p-4">
										<SessionDetail
											:session="row.isRemote ? runAsSessionLog(row.raw as SessionRun) : (row.raw as SessionLog)"
										/>
									</td>
								</tr>
							</template>
						</tbody>
					</table>
					<div
						v-if="historyLoading && historyRows.length === 0"
						class="p-8 text-center text-zinc-500"
					>
						Loading…
					</div>
					<div
						v-else-if="historyRows.length === 0"
						class="p-8 text-center text-zinc-500"
					>
						No history yet. Finish a session to see it here.
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
