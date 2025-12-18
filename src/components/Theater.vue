<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue' // Add provide
import {
	SessionState,
	type Program,
	type SessionLog,
	type SessionMetric,
	type ThemeConfig
} from '../types' // Import ThemeConfig
import { DEFAULT_THEME } from '../theme' // Import DEFAULT_THEME
import type { Instruction } from '../core/Instruction'
import Visuals from './Visuals.vue'
import HUD from './HUD.vue'
import { saveSession } from '../services/storageService'
import { getInstructionEffectiveTheme } from '../utils/themeResolver' // Import theme resolver

interface TheaterProps {
	program: Program
	subjectId: string
	videoBackground: string // Add videoBackground prop
}

const props = defineProps<TheaterProps>()
const emit = defineEmits<{
	(e: 'exit'): void
}>()

const state = ref<SessionState>(SessionState.IDLE)
const instrIndex = ref(0)
const score = ref(0)
const timerRef = ref<number | null>(null)
const startTimeRef = ref<number>(Date.now())
const metricsRef = ref<SessionMetric[]>([])

const currentResolvedTheme = ref<ThemeConfig>(DEFAULT_THEME) // Reactive theme for providing

// Computed for current instruction object
const currentInstr = computed(() => {
	if (instrIndex.value < props.program.instructions.length) {
		return props.program.instructions[instrIndex.value]
	}
	return undefined
})

// Watch for changes in currentInstr and program to update the theme
watch(
	[currentInstr, () => props.program],
	([newInstr, newProgram]) => {
		if (newInstr) {
			currentResolvedTheme.value = getInstructionEffectiveTheme(
				newProgram as Program,
				newInstr as Instruction<any>
			)
		} else {
			// If no instruction, use program's theme or default
			currentResolvedTheme.value = newProgram?.theme || DEFAULT_THEME
		}
	},
	{ immediate: true, deep: true }
) // Immediate ensures theme is set on initial load

// Provide the current resolved theme
provide('resolvedTheme', currentResolvedTheme.value)

const nextInstruction = (index: number) => {
	if (index >= props.program.instructions.length) {
		finishSession()
		return
	}

	// Stop previous if exists
	if (currentInstr.value) {
		currentInstr.value.stop()
	}

	instrIndex.value = index
	state.value = SessionState.INSTRUCTING

	// Short delay for "Get Ready" (or 0 for optimization)
	// Logic: View is rendered. Instruction logic NOT started.
	if (timerRef.value) clearTimeout(timerRef.value)
	timerRef.value = window.setTimeout(() => {
		state.value = SessionState.VALIDATING
		if (currentInstr.value) {
			// We already have currentResolvedTheme reactive var that updates on changes
			// Use the current value of currentResolvedTheme.value
			currentInstr.value.start({
				complete: (success, metrics, result) =>
					triggerReinforcement(success, metrics, result),
				resolvedTheme: currentResolvedTheme.value // Pass the provided theme
			})
		}
	}, 500) // 500ms delay to read prompt before active
}

const findInstructionIndexById = (id: string): number => {
	return props.program.instructions.findIndex(instr => instr.id === id)
}
const triggerReinforcement = (success: boolean, metrics: any, result?: any) => {
	if (timerRef.value) clearTimeout(timerRef.value)

	// Stop instruction logic (stop listening/tracking)
	currentInstr.value?.stop()

	// Record Metric
	if (currentInstr.value) {
		metricsRef.value.push({
			instructionId: currentInstr.value.options.id,
			success,
			timestamp: Date.now(),
			reactionTime: metrics?.reactionTime || 0
		})

		// --- New Logic for onComplete Callback ---
		if (currentInstr.value.onComplete) {
			const nextInstructionId = currentInstr.value.onComplete(success, result)
			if (nextInstructionId) {
				const jumpToIndex = findInstructionIndexById(nextInstructionId)
				if (jumpToIndex !== -1) {
					// Wait for reinforcement period then jump
					setTimeout(() => {
						nextInstruction(jumpToIndex)
					}, 2000)
					return // Exit here as we are jumping
				} else {
					console.warn(
						`Instruction with ID '${nextInstructionId}' not found. Continuing sequentially.`
					)
				}
			}
		}
		// --- End New Logic ---
	}

	if (success) {
		// Bonus Calc
		const duration = currentInstr.value?.options.duration || 5000
		const reaction = metrics?.reactionTime || 0
		const remainingRatio = Math.max(0, (duration - reaction) / duration)
		const points = Math.round(100 * remainingRatio)

		score.value += points
		state.value = SessionState.REINFORCING_POS
	} else {
		score.value -= 50
		state.value = SessionState.REINFORCING_NEG
	}

	// Time in reinforcement state
	setTimeout(() => {
		if (success) {
			nextInstruction(instrIndex.value + 1)
		} else {
			// Retry
			nextInstruction(instrIndex.value)
		}
	}, 2000)
}

const finishSession = () => {
	state.value = SessionState.FINISHED
	const log: SessionLog = {
		id: `SES_${Date.now()}`,
		subjectId: props.subjectId,
		programId: props.program.id,
		startTime: new Date(startTimeRef.value).toISOString(),
		endTime: new Date().toISOString(),
		totalScore: score.value,
		metrics: metricsRef.value
	}
	saveSession(log)
	setTimeout(() => emit('exit'), 3000)
}

// Initialize Session on mount
onMounted(() => {
	try {
		document.documentElement
			.requestFullscreen()
			.catch(e => console.log('Fullscreen blocked', e))
	} catch (e) {}

	setTimeout(() => {
		nextInstruction(0)
	}, 2000)

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') emit('exit')
	}
	window.addEventListener('keydown', handleKeyDown)

	onUnmounted(() => {
		if (timerRef.value) clearTimeout(timerRef.value)
		currentInstr.value?.stop()
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
		window.removeEventListener('keydown', handleKeyDown)
	})
})
</script>

<template>
	<div class="relative w-full h-full bg-black overflow-hidden cursor-crosshair">
		<!-- Video Background -->
		<video
			v-if="program.videoBackground"
			:src="program.videoBackground"
			autoplay
			loop
			muted
			playsinline
			class="absolute top-0 left-0 w-full h-full object-cover z-0"
		></video>

		<!-- 3D Background -->
		<Visuals :state="state" />

		<!-- Active Instruction View -->
		<div
			v-if="
				(state === SessionState.INSTRUCTING || state === SessionState.VALIDATING) &&
				currentInstr
			"
			class="absolute inset-0 z-10"
		>
			<component
				:is="currentInstr.component"
				:instruction="currentInstr"
			/>
		</div>

		<!-- Heads Up Display -->
		<HUD
			:state="state"
			:currentInstruction="currentInstr"
			:score="score"
			@exit="emit('exit')"
		/>
	</div>
</template>

<style>
/* Global styles if needed */
</style>
