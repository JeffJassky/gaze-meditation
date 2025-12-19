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
import AudioDebugPanel from './AudioDebugPanel.vue'
import { saveSession } from '../services/storageService'
import { getInstructionEffectiveTheme } from '../utils/themeResolver' // Import theme resolver
import { faceMeshService } from '../services/faceMeshService'
import { audioSession } from '../services/audio'
import { speechService } from '../services/speechService'

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

// Loading State
const loadingMessage = ref('Initializing...')
const loadingProgress = ref(0)

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

const initSession = async () => {
	state.value = SessionState.INITIALIZING
	loadingProgress.value = 0
	loadingMessage.value = 'Analyzing Program...'

	// 1. Determine Capabilities Needed
	let needsFaceMesh = false
	let needsAudio = false
	let needsSpeech = false

	// Check if any instruction needs faceMesh
	if (props.program.instructions.some(i => i.options.capabilities?.faceMesh)) {
		needsFaceMesh = true
	}

	// Check if we need audio (program track or instructions)
	// Default to needing audio for binaural beats unless explicitly 'none'
	if (
		(props.program.audio?.musicTrack !== 'none') ||
		props.program.audio?.binaural ||
		props.program.instructions.some(i => i.options.capabilities?.audioInput)
	) {
		needsAudio = true
	}

	console.log('[Theater] Needs Audio:', needsAudio, 'Program Audio:', props.program.audio)

	// Check if we need speech
	if (props.program.instructions.some(i => i.options.capabilities?.speech)) {
		needsSpeech = true
	}

	loadingProgress.value = 20

	// 2. Initialize Audio if needed
	if (needsAudio) {
		console.log('[Theater] Initializing Audio Stack...')
		loadingMessage.value = 'Initializing Audio Engine...'
		try {
			await audioSession.setup()
			// Start Program Audio Track if exists
			if (props.program.audio?.musicTrack && props.program.audio.musicTrack !== 'none') {
				loadingMessage.value = 'Starting Audio Track...'
				try {
					await audioSession.musicLooper.start({
						track: props.program.audio.musicTrack,
						volume: 0.8
					})
				} catch (e) {
					console.warn(
						`[Theater] Failed to start music track: ${props.program.audio.musicTrack}`,
						e
					)
				}
			}

			// Start Binaural Beats (default to 6Hz if audio is enabled)
			const bConfig = props.program.audio?.binaural
			console.log('[Theater] Configuring Binaural Beats...', bConfig)
			loadingMessage.value = 'Configuring Binaural...'
			audioSession.binaural.start({
				carrierFreq: 100, // Default carrier
				beatFreq: bConfig?.hertz ?? 6,
				volume: bConfig?.volume ?? 0.5
			})
		} catch (e) {
			console.warn('Audio Initialization Failed', e)
			// Decide if critical or not. For now, log and continue.
		}
	}
	loadingProgress.value = 50

	// 3. Initialize Speech if needed
	if (needsSpeech) {
		loadingMessage.value = 'Initializing Speech Recognition...'
		try {
			await speechService.init()
			speechService.start()
		} catch (e) {
			console.warn('Speech Initialization Failed', e)
		}
	}

	loadingProgress.value = 75

	// 4. Initialize FaceMesh if needed
	if (needsFaceMesh) {
		loadingMessage.value = 'Initializing...'
		try {
			// Wait for video element or let service create one
			await faceMeshService.init()
		} catch (e) {
			console.error('FaceMesh Initialization Failed', e)
			alert('Camera access required for this session.')
			emit('exit')
			return
		}
	}
	loadingProgress.value = 90

	// 4. Preload Video Background if needed (basic check)
	if (props.program.videoBackground) {
		loadingMessage.value = 'Preloading Background...'
		// Basic preload via fetch to ensure cached?
		// Or rely on browser buffering.
		// For now, simple delay or skip.
	}

	loadingProgress.value = 100
	loadingMessage.value = 'Ready'

	// Start Session
	setTimeout(() => {
		nextInstruction(0)
	}, 500)
}

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

	// Apply Instruction Audio Settings if present
	if (currentInstr.value?.options.audio?.binaural) {
		const b = currentInstr.value.options.audio.binaural
		// Ensure engine is active or start it? For now assuming adjust if active.
		if (audioSession.binaural.isActive) {
			console.log('[Theater] Adjusting Binaural:', b)
			if (b.hertz !== undefined) audioSession.binaural.setBeatFrequency(b.hertz)
			if (b.volume !== undefined) audioSession.binaural.setVolume(b.volume)
		}
	}

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

	const isPosEnabled = currentInstr.value?.options.positiveReinforcement?.enabled !== false
	const isNegEnabled = currentInstr.value?.options.negativeReinforcement?.enabled !== false

	if (success) {
		if (isPosEnabled) {
			// Bonus Calc
			const duration = currentInstr.value?.options.duration || 5000
			const reaction = metrics?.reactionTime || 0
			const remainingRatio = Math.max(0, (duration - reaction) / duration)
			const points = Math.round(100 * remainingRatio)

			score.value += points
			state.value = SessionState.REINFORCING_POS

			// Time in reinforcement state
			setTimeout(() => {
				nextInstruction(instrIndex.value + 1)
			}, 2000)
		} else {
			// Skip reinforcement visuals and delay
			nextInstruction(instrIndex.value + 1)
		}
	} else {
		if (isNegEnabled) {
			score.value -= 50
			state.value = SessionState.REINFORCING_NEG

			// Time in reinforcement state
			setTimeout(() => {
				// Retry
				nextInstruction(instrIndex.value)
			}, 2000)
		} else {
			// Skip reinforcement visuals and delay
			// Retry immediately (or after very short delay to avoid tight loop potential if logic is broken)
			setTimeout(() => {
				nextInstruction(instrIndex.value)
			}, 100)
		}
	}
}

const finishSession = () => {
	state.value = SessionState.FINISHED
	audioSession.binaural.stop(3)
	audioSession.musicLooper.stop(3)
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

	initSession()

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') emit('exit')
	}
	window.addEventListener('keydown', handleKeyDown)

	onUnmounted(() => {
		if (timerRef.value) clearTimeout(timerRef.value)
		currentInstr.value?.stop()

		// Teardown Services
		faceMeshService.stop()
		audioSession.binaural.stop() // Ensure binaural stops
		audioSession.musicLooper.stop()
		speechService.stop()

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

		<!-- Loading Overlay -->
		<div
			v-if="state === SessionState.INITIALIZING"
			class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white"
		>
			<div class="text-2xl font-bold mb-4">{{ loadingMessage }}</div>
			<div class="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-green-500 transition-all duration-300 ease-out"
					:style="{ width: `${loadingProgress}%` }"
				></div>
			</div>
		</div>

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

		<AudioDebugPanel />
	</div>
</template>

<style>
/* Global styles if needed */
</style>
