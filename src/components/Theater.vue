<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue' // Add shallowRef
import {
	SessionState,
	type Program,
	type SessionLog,
	type SessionMetric,
	type ThemeConfig
} from '../types' // Import ThemeConfig
import { DEFAULT_THEME } from '../theme' // Import DEFAULT_THEME
import type { Instruction } from '../core/Instruction'
import { ReadInstruction } from '../instructions/ReadInstruction' // Import ReadInstruction
import Visuals from './Visuals.vue'
import HUD from './HUD.vue'
import TransportControl from './TransportControl.vue'
import ProgressBar from './ProgressBar.vue'
import SessionCard from './SessionCard.vue'
import { saveSession } from '../services/storageService'
import { getInstructionEffectiveTheme } from '../utils/themeResolver' // Import theme resolver
import { faceMeshService } from '../services/faceMeshService'
import { audioSession } from '../services/audio'
import { speechService } from '../services/speechService'
import somaticResetFull from '../programs/somatic-relaxaton'
import theBlueDoor from '../programs/the-blue-door'
import councilOfFireLong from '../programs/council-of-fire'

interface TheaterProps {
	program: Program
	subjectId: string
}

const props = defineProps<TheaterProps>()
const emit = defineEmits<{
	(e: 'exit'): void
}>()

const FULL_PROGRAMS: Program[] = [somaticResetFull, theBlueDoor, councilOfFireLong]

const activeProgram = shallowRef<Program>(props.program)
const state = ref<SessionState>(SessionState.INITIALIZING)
const sessionInstructions = shallowRef<Instruction[]>([]) // Use shallowRef to avoid deep reactivity/unwrapping
const instrIndex = ref(0)
const score = ref(0)
const isPaused = ref(false)
const controlsVisible = ref(false)
const isMenuOpen = ref(false)
const isHoveringControls = ref(false)
const controlsTimer = ref<number | null>(null)

const showControls = () => {
	controlsVisible.value = true
	if (controlsTimer.value) clearTimeout(controlsTimer.value)

	if (!isMenuOpen.value && !isHoveringControls.value) {
		controlsTimer.value = window.setTimeout(() => {
			if (!isMenuOpen.value && !isHoveringControls.value) {
				controlsVisible.value = false
			}
		}, 5000)
	}
}

// Watchers to update timer logic when state changes
watch([isMenuOpen, isHoveringControls], ([menuOpen, hovering]) => {
	if (menuOpen || hovering) {
		controlsVisible.value = true
		if (controlsTimer.value) clearTimeout(controlsTimer.value)
	} else {
		// Resume timer if neither is active
		showControls()
	}
})

const handlePause = () => {
	isPaused.value = true
	if (timerRef.value) clearTimeout(timerRef.value)
	currentInstr.value?.stop()
}

const handlePlay = () => {
	isPaused.value = false
	nextInstruction(instrIndex.value)
}

const handleRestart = () => {
	isPaused.value = false
	nextInstruction(0)
}

const timerRef = ref<number | null>(null)
const startTimeRef = ref<number>(Date.now())
const metricsRef = ref<SessionMetric[]>([])

const currentResolvedTheme = ref<ThemeConfig>(DEFAULT_THEME) // Reactive theme for providing

// Loading State
const loadingMessage = ref('Preparing Session')
const loadingProgress = ref(0)
const showLoadingContent = ref(false)
const showPermissionRequest = ref(false)
const permissionType = ref<'camera' | 'microphone' | 'both'>('both')

const handleScreenClick = (e: MouseEvent) => {
	// If permission request is visible, ignore screen clicks for controls
	if (showPermissionRequest.value) return

	// Ignore clicks if in selection mode
	if (state.value === SessionState.SELECTION) return

	showControls()

	// If it's a tap on the left/right side, navigate
	const width = window.innerWidth
	const x = e.clientX

	// Threshold for side taps (outer 25%)
	const threshold = width * 0.25

	if (x < threshold) {
		if (instrIndex.value > 0) {
			nextInstruction(instrIndex.value - 1)
		}
	} else if (x > width - threshold) {
		if (instrIndex.value < sessionInstructions.value.length - 1) {
			nextInstruction(instrIndex.value + 1)
		}
	}
}

// Computed for current instruction object
const currentInstr = computed(() => {
	if (instrIndex.value < sessionInstructions.value.length) {
		return sessionInstructions.value[instrIndex.value]
	}
	return undefined
})

// Watch for changes in currentInstr and program to update the theme
watch(
	[currentInstr, activeProgram],
	([newInstr, newProgram]) => {
		console.log('[Theater] currentInstr changed:', newInstr?.options?.id)
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

// Provide the current resolved theme as a ref
provide('resolvedTheme', currentResolvedTheme)

const initSession = async () => {
	console.log('[Theater] Starting initSession')
	state.value = SessionState.INITIALIZING
	loadingProgress.value = 0
	showLoadingContent.value = false

	// Trigger content fade-in slightly after mount
	setTimeout(() => {
		showLoadingContent.value = true
	}, 100)

	// 1. Determine Capabilities Needed
	let needsFaceMesh = false
	let needsAudio = false
	let needsSpeech = false

	// Check if any instruction needs faceMesh
	if (activeProgram.value.instructions.some(i => i.options.capabilities?.faceMesh)) {
		needsFaceMesh = true
	}

	if (activeProgram.value.instructions.some(i => i.options.capabilities?.speech)) {
		needsSpeech = true
	}

	// Check if we need audio (program track or instructions)
	// Default to needing audio for binaural beats unless explicitly 'none'
	if (
		activeProgram.value.audio?.musicTrack !== 'none' ||
		activeProgram.value.audio?.binaural ||
		activeProgram.value.instructions.some(i => i.options.capabilities?.audioInput)
	) {
		needsAudio = true
	}

	console.log('[Theater] Capabilities:', { needsAudio, needsFaceMesh, needsSpeech })

	// 1.5 Check Permissions (Pre-flight)
	if (
		needsFaceMesh ||
		needsSpeech ||
		(needsAudio &&
			activeProgram.value.instructions.some(i => i.options.capabilities?.audioInput))
	) {
		try {
			// Determine what we need
			const camQuery = needsFaceMesh
				? navigator.permissions.query({ name: 'camera' as any })
				: Promise.resolve(null)
			const micQuery =
				needsSpeech ||
				(needsAudio &&
					activeProgram.value.instructions.some(i => i.options.capabilities?.audioInput))
					? navigator.permissions.query({ name: 'microphone' as any })
					: Promise.resolve(null)

			const [camStatus, micStatus] = await Promise.all([camQuery, micQuery])

			let missingCam = camStatus?.state === 'prompt'
			let missingMic = micStatus?.state === 'prompt'

			// If API not supported, assume we might need to prompt (fallthrough)
			// But usually init() handles it. We mainly want to catch the 'prompt' state to show UI.

			if (missingCam || missingMic) {
				// Pause init and show UI
				loadingMessage.value = 'Enable Biofeedback'
				permissionType.value =
					missingCam && missingMic ? 'both' : missingCam ? 'camera' : 'microphone'
				showPermissionRequest.value = true

				// Wait for user interaction
				await new Promise<void>(resolve => {
					const unwatch = watch(showPermissionRequest, val => {
						if (!val) {
							unwatch()
							resolve()
						}
					})
				})

				loadingMessage.value = 'Preparing Session'
			}
		} catch (e) {
			console.warn('Permissions Query API not supported', e)
			// Proceed to let browser handle it naturally
		}
	}

	loadingProgress.value = 20

	// 2. Initialize Audio if needed
	if (needsAudio) {
		try {
			await audioSession.setup()
			// Start Program Audio Track if exists
			if (
				activeProgram.value.audio?.musicTrack &&
				activeProgram.value.audio.musicTrack !== 'none'
			) {
				try {
					await audioSession.musicLooper.start({
						track: activeProgram.value.audio.musicTrack,
						volume: 0.8
					})
				} catch (e) {
					console.warn(
						`[Theater] Failed to start music track: ${activeProgram.value.audio.musicTrack}`,
						e
					)
				}
			}

			// Start Binaural Beats
			const bConfig = activeProgram.value.audio?.binaural
			audioSession.binaural.start({
				carrierFreq: 100,
				beatFreq: bConfig?.hertz ?? 6,
				volume: bConfig?.volume ?? 0.5
			})
		} catch (e) {
			console.warn('Audio Initialization Failed', e)
		}
	}
	loadingProgress.value = 50

	// 3. Initialize Speech if needed
	if (needsSpeech) {
		try {
			await speechService.init()
			await speechService.start()
		} catch (e) {
			console.warn('Speech Initialization Failed', e)
			alert(
				'Microphone access is required for this session. Please enable it in your browser settings and try again.'
			)
			emit('exit')
			return
		}
	}

	loadingProgress.value = 75

	// 4. Initialize FaceMesh if needed
	if (needsFaceMesh) {
		try {
			await faceMeshService.init()
		} catch (e) {
			console.error('FaceMesh Initialization Failed', e)
			alert('Camera access required for this session.')
			emit('exit')
			return
		}
	}
	loadingProgress.value = 90

	// Prepend Reminders
	const reminders: Instruction[] = []
	const reminderText: string[] = []
	const firstInstruction = activeProgram.value.instructions[0]
	const shouldSkipIntro = firstInstruction?.options.skipIntro === true

	if (!shouldSkipIntro) {
		if (needsFaceMesh && needsSpeech) {
			reminderText.push('Find yourself in a quiet, well-lit space ~ for optimal biofeedback.')
		} else if (needsSpeech) {
			reminderText.push('Find yourself in a quiet space ~ for optimal biofeedback.')
		} else if (needsFaceMesh) {
			reminderText.push('Find yourself in a well-lit space ~ for optimal biofeedback.')
		}

		reminders.push(
			new ReadInstruction({
				id: 'reminder-dnd',
				text: [
					...reminderText,
					'Use headphones for best results.',
					'To avoid interruptions,',
					'consider putting your device ~ into do not disturb mode.'
				]
			})
		)
	}

	sessionInstructions.value = [...reminders, ...activeProgram.value.instructions]
	console.log('[Theater] Instructions Prepared:', sessionInstructions.value.length)

	loadingProgress.value = 100

	// Start Session Sequence
	setTimeout(() => {
		// Fade out content first
		showLoadingContent.value = false

		// Wait for content fade out (1s transition), then start session (fading out background)
		setTimeout(() => {
			console.log('[Theater] Starting first instruction')
			nextInstruction(0)
		}, 1200)
	}, 500)
}

const handleGrantAccess = () => {
	showPermissionRequest.value = false
}

const nextInstruction = (index: number) => {
	console.log('[Theater] nextInstruction:', index)

	if (index >= sessionInstructions.value.length) {
		// Stop previous if exists

		if (currentInstr.value) {
			currentInstr.value.stop()
		}

		// Increment index to trigger instruction fade out

		instrIndex.value = index

		// Wait for instruction transition to complete (3s per style)

		setTimeout(() => {
			finishSession()
		}, 3000)

		return
	}

	// Stop previous if exists

	if (currentInstr.value) {
		currentInstr.value.stop()
	}

	instrIndex.value = index

	state.value = SessionState.INSTRUCTING

	console.log(
		'[Theater] State set to INSTRUCTING, currentInstr:',
		currentInstr.value?.options?.id
	)

	// Apply Instruction Audio Settings if present

	if (currentInstr.value?.options.audio?.binaural) {
		const b = currentInstr.value.options.audio.binaural

		if (audioSession.binaural.isActive) {
			if (b.hertz !== undefined) audioSession.binaural.setBeatFrequency(b.hertz)

			if (b.volume !== undefined) audioSession.binaural.setVolume(b.volume)
		}
	}

	if (timerRef.value) clearTimeout(timerRef.value)

	timerRef.value = window.setTimeout(() => {
		state.value = SessionState.VALIDATING

		if (currentInstr.value) {
			currentInstr.value.start({
				complete: (success, metrics, result) =>
					triggerReinforcement(success, metrics, result),

				resolvedTheme: currentResolvedTheme.value
			})
		}
	}, 500)
}

const findInstructionIndexById = (id: string): number => {
	return sessionInstructions.value.findIndex(instr => instr.id === id)
}

// Trigger reinforcement ... (rest of function unchanged, just verifying use of sessionInstructions/instrIndex)

const triggerReinforcement = (success: boolean, metrics: any, result?: any) => {
	if (timerRef.value) clearTimeout(timerRef.value)

	// Stop instruction logic (stop listening/tracking)
	currentInstr.value?.stop()

	const cooldown = currentInstr.value?.options.cooldown ?? 2000

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
					}, cooldown)
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
			}, cooldown)
		} else {
			// Skip reinforcement visuals but respect cooldown
			setTimeout(() => {
				nextInstruction(instrIndex.value + 1)
			}, cooldown)
		}
	} else {
		if (isNegEnabled) {
			score.value -= 50
			state.value = SessionState.REINFORCING_NEG

			// Time in reinforcement state
			setTimeout(() => {
				// Retry
				nextInstruction(instrIndex.value)
			}, cooldown)
		} else {
			// Skip reinforcement visuals but respect cooldown
			setTimeout(() => {
				nextInstruction(instrIndex.value)
			}, cooldown)
		}
	}
}

const finishSession = () => {
	// Check if we should show the session selector
	if (activeProgram.value.id === 'initial_training') {
		state.value = SessionState.SELECTION
		const log: SessionLog = {
			id: `SES_${Date.now()}`,
			subjectId: props.subjectId,
			programId: activeProgram.value.id,
			startTime: new Date(startTimeRef.value).toISOString(),
			endTime: new Date().toISOString(),
			totalScore: score.value,
			metrics: metricsRef.value
		}
		saveSession(log)
		// Do not emit exit
		return
	}

	state.value = SessionState.FINISHED
	audioSession.binaural.stop(3)
	audioSession.musicLooper.stop(3)
	const log: SessionLog = {
		id: `SES_${Date.now()}`,
		subjectId: props.subjectId,
		programId: activeProgram.value.id,
		startTime: new Date(startTimeRef.value).toISOString(),
		endTime: new Date().toISOString(),
		totalScore: score.value,
		metrics: metricsRef.value
	}
	saveSession(log)
	setTimeout(() => emit('exit'), 3000)
}

const handleSessionSelect = async (program: Program) => {
	console.log('[Theater] Transitioning to session:', program.title)

	// 1. Swap Program
	activeProgram.value = program

	// 2. Reset Data
	score.value = 0
	metricsRef.value = []
	startTimeRef.value = Date.now()

	// 3. Update Audio (Music)
	if (activeProgram.value.audio?.musicTrack && activeProgram.value.audio.musicTrack !== 'none') {
		try {
			// Smoothly switch track
			await audioSession.musicLooper.start({
				track: activeProgram.value.audio.musicTrack,
				volume: 0.8
			})
		} catch (e) {
			console.warn(`[Theater] Failed to update music track`, e)
		}
	} else {
		// If no music in new program, fade out
		audioSession.musicLooper.stop(2)
	}

	// 4. Update Audio (Binaural)
	const bConfig = activeProgram.value.audio?.binaural
	if (bConfig) {
		if (audioSession.binaural.isActive) {
			audioSession.binaural.setBeatFrequency(bConfig.hertz ?? 6)
			audioSession.binaural.setVolume(bConfig.volume ?? 0.5)
		} else {
			audioSession.binaural.start({
				carrierFreq: 100,
				beatFreq: bConfig.hertz ?? 6,
				volume: bConfig.volume ?? 0.5
			})
		}
	}

	// 5. Setup Instructions
	// Load program instructions directly, skipping the initialization reminders
	// since the user has already completed the tutorial/setup.
	sessionInstructions.value = [...activeProgram.value.instructions]

	// 6. Start
	// Trigger first instruction. This will switch state to INSTRUCTING,
	// causing the Selection overlay to fade out and the new instruction to fade in.
	nextInstruction(0)
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
	<div
		class="relative w-full h-full bg-black overflow-hidden transition-all duration-300"
		:class="controlsVisible ? 'cursor-default' : 'cursor-none'"
		@mousemove="showControls"
		@click="handleScreenClick"
	>
		<!-- Video Background -->
		<video
			v-if="activeProgram.videoBackground"
			autoplay
			loop
			muted
			playsinline
			disablePictureInPicture
			class="absolute top-0 left-0 w-full h-full object-cover z-0"
		>
			<source
				:src="activeProgram.videoBackground"
				type="video/mp4"
			/>
		</video>

		<!-- Spiral Background (Blurred Base) -->
		<div
			v-if="activeProgram.spiralBackground"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square spiral-rotation z-0"
			:style="{
				backgroundImage: `url(${activeProgram.spiralBackground})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				width: '150vmax',
				height: '150vmax',
				filter: 'blur(8px)',
				opacity: 0.8
			}"
		></div>

		<!-- Spiral Background (Sharp Center Mask) -->
		<div
			v-if="activeProgram.spiralBackground"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square spiral-rotation z-0"
			:style="{
				backgroundImage: `url(${activeProgram.spiralBackground})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				width: '150vmax',
				height: '150vmax',
				filter: 'blur(3px)',
				'-webkit-mask-image': 'radial-gradient(circle, black 0%, transparent 20%)',
				'mask-image': 'radial-gradient(circle, black 0%, transparent 20%)'
			}"
		></div>

		<!-- Tint Overlay -->
		<div
			v-if="currentResolvedTheme.tint"
			class="absolute inset-0 pointer-events-none"
			:style="{
				backgroundColor: currentResolvedTheme.tint.color,
				opacity: currentResolvedTheme.tint.opacity,
				zIndex: 5
			}"
		></div>

		<!-- 3D Background -->
		<Visuals :state="state" />

		<!-- Loading Overlay -->
		<Transition name="fade-slow">
			<div
				v-if="state === SessionState.INITIALIZING"
				class="absolute inset-0 z-50 bg-black text-white"
			>
				<div
					class="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out"
					:class="showLoadingContent ? 'opacity-100' : 'opacity-0'"
				>
					<div
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-24 text-2xl text-center w-full"
						:style="{ color: currentResolvedTheme.positiveColor || '#10b981' }"
					>
						{{ loadingMessage }}
					</div>
					<ProgressBar
						v-if="!showPermissionRequest"
						:progress="loadingProgress"
						:fill-color="currentResolvedTheme.positiveColor || '#10b981'"
					/>

					<!-- Permission Request Button -->
					<div
						v-if="showPermissionRequest"
						class="mt-8 text-center px-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
					>
						<p class="text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
							This session uses biofeedback. To proceed, we need temporary access to
							your
							<span class="text-white font-bold">{{
								permissionType === 'both'
									? 'Camera & Microphone'
									: permissionType === 'camera'
									? 'Camera'
									: 'Microphone'
							}}</span
							>. <br /><span class="text-xs opacity-50 block mt-2"
								>Data is processed locally on your device and is never
								recorded.</span
							>
						</p>
						<button
							@click.stop="handleGrantAccess"
							class="px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-105"
							:style="{
								backgroundColor: currentResolvedTheme.positiveColor || '#10b981',
								color: '#000',
								boxShadow: `0 0 20px ${
									currentResolvedTheme.positiveColor || '#10b981'
								}40`
							}"
						>
							Grant Access
						</button>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Selection Overlay -->
		<Transition name="selector">
			<div
				v-if="state === SessionState.SELECTION"
				class="absolute inset-0 z-[60] flex flex-col items-center justify-center p-8 overflow-y-auto"
			>
				<div class="max-w-6xl w-full">
					<h2 class="text-3xl font-light text-white mb-2 text-center">
						Select a Session
					</h2>
					<p class="text-zinc-400 text-center mb-12">Choose your journey.</p>

					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<SessionCard
							v-for="prog in FULL_PROGRAMS"
							:key="prog.id"
							:program="prog"
							@start="handleSessionSelect"
						/>
					</div>

					<div class="mt-12 text-center">
						<button
							@click="$emit('exit')"
							class="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-widest"
						>
							Return to Dashboard
						</button>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Active Instruction View -->
		<div class="absolute inset-0 z-10 pointer-events-none">
			<Transition
				name="instruction"
				mode="out-in"
			>
				<component
					v-if="
						(state === SessionState.INSTRUCTING || state === SessionState.VALIDATING) &&
						currentInstr
					"
					:is="currentInstr.component"
					:instruction="currentInstr"
					:key="currentInstr.options.id"
					class="pointer-events-auto"
				/>
			</Transition>
		</div>

		<!-- Heads Up Display -->
		<HUD
			:state="state"
			:currentInstruction="currentInstr"
			:score="score"
			@exit="emit('exit')"
			class="z-50"
		/>

		<Transition name="fade">
			<TransportControl
				v-show="controlsVisible && state !== SessionState.SELECTION"
				:instructions="sessionInstructions"
				:currentIndex="instrIndex"
				:isPlaying="
					!isPaused && state !== SessionState.FINISHED && state !== SessionState.IDLE
				"
				@play="handlePlay"
				@pause="handlePause"
				@restart="handleRestart"
				@select="nextInstruction"
				@menu-toggle="val => (isMenuOpen = val)"
				@mouseenter="isHoveringControls = true"
				@mouseleave="isHoveringControls = false"
				@click.stop
			/>
		</Transition>
	</div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.selector-enter-active {
	transition: opacity 2s cubic-bezier(0.25, 1, 0.5, 1), transform 2s cubic-bezier(0.25, 1, 0.5, 1);
}

.selector-leave-active {
	transition: opacity 1s ease-in, transform 1s ease-in;
}

.selector-enter-from {
	opacity: 0;
	transform: scale(1.08);
}

.selector-leave-to {
	opacity: 0;
	transform: scale(0.95);
}

/* Global styles if needed */
.instruction-enter-active {
	/* Define fallbacks just in case */
	--duration-slow: 3s;
	--ease-glacial: cubic-bezier(0.19, 1, 0.22, 1);

	transition: opacity var(--duration-slow) var(--ease-glacial),
		transform var(--duration-slow) var(--ease-glacial);
	/* Ensure layout is stable during transition */
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.instruction-leave-active {
	/* Define fallbacks just in case */
	--duration-slow: 3s;
	--ease-in-glacial: cubic-bezier(0.75, 0, 1, 1);

	transition: opacity var(--duration-slow) var(--ease-in-glacial),
		transform var(--duration-slow) var(--ease-in-glacial);
	/* Ensure layout is stable during transition */
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.instruction-enter-from {
	opacity: 0;
	transform: scale(1.1);
}

.instruction-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.instruction-leave-from {
	opacity: 1;
	transform: scale(1);
}

.spiral-rotation {
	animation: spiral-rotate 4s linear infinite;
}

@keyframes spiral-rotate {
	from {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	to {
		transform: translate(-50%, -50%) rotate(360deg);
	}
}

.fade-slow-leave-active {
	transition: opacity 2s ease-in-out;
}

.fade-slow-leave-to {
	opacity: 0;
}
</style>
