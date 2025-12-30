<script setup lang="ts">
import { ref, markRaw, onMounted } from 'vue'
import Dashboard from './components/Dashboard.vue'
import Theater from './components/Theater.vue'
import DeviceDebug from './components/DeviceDebug.vue'
import type { Session } from './types'

type View = 'dashboard' | 'theater' | 'debug'

interface ActiveSession {
	program: Session
	subjectId: string
}

const view = ref<View>('dashboard')
const activeSession = ref<ActiveSession | null>(null)
const dashboardTab = ref<'home' | 'start' | 'history' | 'users'>('home')

onMounted(() => {
	if (window.location.pathname === '/device-debug') {
		view.value = 'debug'
	}
})

const startSession = (program: Session, subjectId: string) => {
	activeSession.value = { program: markRaw(program), subjectId }
	view.value = 'theater'
}

const endSession = () => {
	activeSession.value = null
	dashboardTab.value = 'start'
	view.value = 'dashboard'
}

</script>

<template>
	<div class="w-full h-screen bg-black text-white overflow-hidden">
		<Dashboard
			v-if="view === 'dashboard'"
			:initialTab="dashboardTab"
			@startSession="startSession"
		/>

		<Theater
			v-if="view === 'theater' && activeSession"
			:program="activeSession.program"
			:subjectId="activeSession.subjectId"
			@exit="endSession"
		/>

		<DeviceDebug v-if="view === 'debug'" />
	</div>
</template>

<style>
/* No specific scoped styles needed, using Tailwind */
:root {
	/* The "Glacial" Ease (Strong Ease-Out) */
	--ease-glacial: cubic-bezier(0.19, 1, 0.22, 1);
	/* Strong Ease-In to match */
	--ease-in-glacial: cubic-bezier(0.75, 0, 1, 1);

	/* You can also define different speeds as variables */
	--duration-slow: 3s;
}

.fade-in {
	animation: fadeIn var(--duration-slow) var(--ease-glacial) forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: scale(1.1);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}
</style>