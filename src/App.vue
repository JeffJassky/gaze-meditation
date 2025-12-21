<script setup lang="ts">
import { ref, markRaw } from 'vue'
import Dashboard from './components/Dashboard.vue'
import Theater from './components/Theater.vue'
import type { Program } from './types'

// Import new FormInstruction related types and classes
import { FormInstruction } from './instructions/FormInstruction'
import { FormFieldType, type FormField } from './types'
import type { Instruction } from './core/Instruction'
import { StillnessInstruction } from './instructions/StillnessInstruction'
import { FractionationInstruction } from './instructions/FractionationInstruction'

type View = 'dashboard' | 'theater'

interface ActiveSession {
	program: Program
	subjectId: string
}

const view = ref<View>('dashboard')
const activeSession = ref<ActiveSession | null>(null)
const dashboardTab = ref<'home' | 'start' | 'history' | 'users'>('home')

const startSession = (program: Program, subjectId: string) => {
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
