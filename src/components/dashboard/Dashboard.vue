<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { User, SessionLog } from '@/types'
import { getUsers, getSessions, seedDatabase, saveUser } from '@/services/storageService'
import { historyApi, type SessionRun } from '@/api/history'
import { sessionsApi, type Session } from '@/api/sessions'
import { audioSession } from '@/audio'
import { useRouter } from 'vue-router'
import { auth } from '@/state/auth'
import AppShell from '@/components/ui/AppShell.vue'
import AccountSubnav from '@/components/ui/AccountSubnav.vue'
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
	sessionsLoading.value = true
	sessionsError.value = null
	try {
		const res = await sessionsApi.list({ status: 'published', limit: 200 })
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
			params: { sessionSlug: program.slug, subjectId: selectedUser.value },
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
	<AppShell>
		<template v-if="activeTab === 'history'" #subnav>
			<AccountSubnav />
		</template>

		<div class="flex-1 p-6 md:p-12 overflow-y-auto">
			<Home
				v-if="activeTab === 'home'"
				:tutorial-slug="tutorialSession?.slug"
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
		</div>

		<!-- Transition Overlay -->
		<div
			class="fixed inset-0 bg-black z-[100] pointer-events-none transition-opacity duration-1000 ease-in-out"
			:class="isTransitioning ? 'opacity-100' : 'opacity-0'"
		></div>
	</AppShell>
</template>
