<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { User, SessionLog } from '@/types'
import { getUsers, getSessions, seedDatabase, saveUser } from '@/services/storageService'
import { historyApi, type SessionRun } from '@/api/history'
import { sessionsApi, type Session } from '@/api/sessions'
import { audioSession } from '@/audio'
import { useRouter } from 'vue-router'
import { auth } from '@/state/auth'
import Home from './Home.vue'
import SessionsTab from './SessionsTab.vue'
import HistoryTab, { type HistoryRow } from './HistoryTab.vue'

/**
 * Sessions the signed-in user can play. Fetched from /sessions on mount
 * and whenever the auth user changes. No hardcoded lists anymore — the
 * database is the sole source of truth.
 */
const availableSessions = ref<Session[]>([])
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
const tutorialSession = computed<Session | null>(() => {
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
const fullSessions = computed<Session[]>(() => {
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

// Watch for prop changes to update activeTab when navigating
watch(() => props.initialTab, (newTab) => {
	if (newTab) activeTab.value = newTab
})

const isSidebarOpen = ref(false)
const isTransitioning = ref(false)

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

const handleStartSession = async (program: Session) => {
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

			<SessionsTab
				v-if="activeTab === 'start'"
				:tutorial-session="tutorialSession"
				:sessions="fullSessions"
				:loading="sessionsLoading"
				:error="sessionsError"
				:user-selected="!!selectedUser"
				@start-tutorial="handleStartTutorial"
				@start-session="handleStartSession"
			/>

			<HistoryTab
				v-else-if="activeTab === 'history'"
				:rows="historyRows"
				:loading="historyLoading"
				:error="historyError"
			/>
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
