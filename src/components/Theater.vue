<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import {
	SessionState,
	type Session,
	type SessionLog,
	type SessionMetric,
	type ThemeConfig
} from '../types'
import { DEFAULT_THEME } from '../theme'
import { Scene } from '../../src-new/core/Scene'
import Visuals from './Visuals.vue'
import HUD from './HUD.vue'
import TransportControl from './TransportControl.vue'
import ProgressBar from './ProgressBar.vue'
import SessionCard from './SessionCard.vue'
import { saveSession } from '../services/storageService'
import { getSceneEffectiveTheme } from '../utils/themeResolver' // Import theme resolver
import { faceMeshService } from '../services/faceMeshService'
import { sessionTracker } from '../services/sessionTracker'
import { audioSession } from '../services/audio'
import { speechService } from '../services/speechService'
import { camera } from '../../src-new/services'
import { playbackSpeed } from '../state/playback'
import somaticResetFull from '../programs/somatic-relaxaton'
import theBlueDoor from '../programs/the-blue-door'
import councilOfFireLong from '../programs/council-of-fire'

interface TheaterProps {
	program: Session
	subjectId: string
}

const props = defineProps<TheaterProps>()
const emit = defineEmits<{
	(e: 'exit'): void
}>()

const FULL_SESSIONS: Session[] = [somaticResetFull, theBlueDoor, councilOfFireLong]

const activeSession = shallowRef<Session>(props.program)
const state = ref<SessionState>(SessionState.INITIALIZING)
const sessionScenes = shallowRef<Scene[]>([]) 
const sceneIndex = ref(0)
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

watch([isMenuOpen, isHoveringControls], ([menuOpen, hovering]) => {
	if (menuOpen || hovering) {
		controlsVisible.value = true
		if (controlsTimer.value) clearTimeout(controlsTimer.value)
	} else {
		showControls()
	}
})

const handlePause = () => {
	isPaused.value = true
	if (timerRef.value) clearTimeout(timerRef.value)
	currentScene.value?.stop()
}

const handlePlay = () => {
	isPaused.value = false
	nextScene(sceneIndex.value)
}

const handleRestart = () => {
	isPaused.value = false
	nextScene(0)
}

const timerRef = ref<number | null>(null)
const startTimeRef = ref<number>(Date.now())
const metricsRef = ref<SessionMetric[]>([])

const currentResolvedTheme = ref<ThemeConfig>(DEFAULT_THEME)

// Loading State
const loadingMessage = ref('Preparing Session')
const loadingProgress = ref(0)
const showLoadingContent = ref(false)
const showPermissionRequest = ref(false)
const permissionType = ref<'camera' | 'microphone' | 'both'>('both')

const handleScreenClick = (e: MouseEvent) => {
	if (showPermissionRequest.value) return
	if (state.value === SessionState.SELECTION) return

	showControls()

	const width = window.innerWidth
	const x = e.clientX
	const threshold = width * 0.25

	if (x < threshold) {
		if (sceneIndex.value > 0) {
			nextScene(sceneIndex.value - 1)
		}
	} else if (x > width - threshold) {
		if (sceneIndex.value < sessionScenes.value.length - 1) {
			nextScene(sceneIndex.value + 1)
		}
	}
}

const currentScene = computed(() => {
	if (sceneIndex.value < sessionScenes.value.length) {
		return sessionScenes.value[sceneIndex.value]
	}
	return undefined
})

watch(
	[currentScene, activeSession],
	([newScene, newSession]) => {
		console.log('[Theater] currentScene changed:', newScene?.id)
		if (newScene) {
			currentResolvedTheme.value = getSceneEffectiveTheme(
				newSession as Session,
				newScene as any
			)
		} else {
			currentResolvedTheme.value = newSession?.theme || DEFAULT_THEME
		}
	},
	{ immediate: true }
)

provide('resolvedTheme', currentResolvedTheme)

const initSession = async () => {
	console.log('[Theater] Starting initSession')
	state.value = SessionState.INITIALIZING
	loadingProgress.value = 0
	showLoadingContent.value = false

	setTimeout(() => {
		showLoadingContent.value = true
	}, 100)

	let needsCamera = false
	let needsMicrophone = false

	activeSession.value.scenes.forEach(s => {
		s.behavior?.suggestions?.forEach(sig => {
			const BehaviorClass = Scene.getBehaviorClass(sig.type)
			if (BehaviorClass) {
				if ((BehaviorClass as any).requiredDevices?.includes('camera')) needsCamera = true
				if ((BehaviorClass as any).requiredDevices?.includes('microphone')) needsMicrophone = true
			}
		})
	})

	const needsAudio =
		activeSession.value.audio?.musicTrack !== 'none' ||
		activeSession.value.audio?.binaural

	console.log('[Theater] Hardware Requirements:', { needsCamera, needsMicrophone, needsAudio })

	if (needsCamera || needsMicrophone) {
		try {
			const camQuery = needsCamera
				? navigator.permissions.query({ name: 'camera' as any })
				: Promise.resolve(null)
			const micQuery = needsMicrophone
				? navigator.permissions.query({ name: 'microphone' as any })
				: Promise.resolve(null)

			const [camStatus, micStatus] = await Promise.all([camQuery, micQuery])

			let missingCam = camStatus?.state === 'prompt'
			let missingMic = micStatus?.state === 'prompt'

			if (missingCam || missingMic) {
				loadingMessage.value = 'Enable Biofeedback'
				permissionType.value =
					missingCam && missingMic ? 'both' : missingCam ? 'camera' : 'microphone'
				showPermissionRequest.value = true

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
		}
	}

	loadingProgress.value = 20

	if (needsAudio) {
		try {
			await audioSession.setup()
			if (
				activeSession.value.audio?.musicTrack &&
				activeSession.value.audio.musicTrack !== 'none'
			) {
				try {
					await audioSession.musicLooper.start({
						track: activeSession.value.audio.musicTrack,
						volume: 0.8
					})
				} catch (e) {
					console.warn(
						`[Theater] Failed to start music track: ${activeSession.value.audio.musicTrack}`,
						e
					)
				}
			}

			const bConfig = activeSession.value.audio?.binaural
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

	if (needsMicrophone) {
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

	if (needsCamera) {
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
	const reminders: Scene[] = []
	const reminderText: string[] = []
	const shouldSkipIntro = activeSession.value.skipIntro === true

	if (!shouldSkipIntro) {
		if (needsCamera && needsMicrophone) {
			reminderText.push('Find yourself in a quiet, well-lit space ~ for optimal biofeedback.')
		} else if (needsMicrophone) {
			reminderText.push('Find yourself in a quiet space ~ for optimal biofeedback.')
		} else if (needsCamera) {
			reminderText.push('Find yourself in a well-lit space ~ for optimal biofeedback.')
		}

		reminders.push(
			new Scene({
				id: 'reminder-dnd',
				text: [
					...reminderText,
					'Use headphones for best results.',
					'To avoid interruptions,',
					'consider putting your device ~ into do not disturb mode.'
				],
				duration: 8000
			})
		)
	}

	const programScenes = activeSession.value.scenes.map(s => new Scene(s))
	sessionScenes.value = [...reminders, ...programScenes]
	console.log('[Theater] Scenes Prepared:', sessionScenes.value.length)

	loadingProgress.value = 100

	if (!document.fullscreenElement) {
		loadingMessage.value = 'Session Ready'
		showBeginButton.value = true

		await new Promise<void>(resolve => {
			const unwatch = watch(showBeginButton, val => {
				if (!val) {
					unwatch()
					resolve()
				}
			})
		})

		loadingMessage.value = 'Preparing Session'
	}

	setTimeout(() => {
		showLoadingContent.value = false
		setTimeout(() => {
			console.log('[Theater] Starting first scene')
			nextScene(0)
		}, 1200 / playbackSpeed.value)
	}, 500 / playbackSpeed.value)
}

const handleGrantAccess = () => {
	showPermissionRequest.value = false
}

const showBeginButton = ref(false)

const handleBegin = () => {
	try {
		document.documentElement
			.requestFullscreen()
			.catch(e => console.warn('Fullscreen failed', e))
	} catch (e) {}
	showBeginButton.value = false
}

const nextScene = (index: number) => {
	console.log('[Theater] nextScene:', index)

	if (index === 0) {
		sessionTracker.startSession()
	}

	if (index >= sessionScenes.value.length) {
		if (currentScene.value) {
			currentScene.value.stop()
		}
		sceneIndex.value = index
		setTimeout(() => {
			finishSession()
		}, 3000 / playbackSpeed.value)
		return
	}

	if (currentScene.value) {
		currentScene.value.stop()
	}

	sceneIndex.value = index
	state.value = SessionState.INSTRUCTING

	if (currentScene.value?.config.audio?.binaural) {
		const b = currentScene.value.config.audio.binaural
		if (audioSession.binaural.isActive) {
			if (b.hertz !== undefined) audioSession.binaural.setBeatFrequency(b.hertz)
			if (b.volume !== undefined) audioSession.binaural.setVolume(b.volume)
		}
	}

	if (timerRef.value) clearTimeout(timerRef.value)

	timerRef.value = window.setTimeout(() => {
		state.value = SessionState.VALIDATING

		if (currentScene.value) {
			let previousVoiceText: string | undefined
			if (sceneIndex.value > 0) {
				const prevScene = sessionScenes.value[sceneIndex.value - 1]
				if (prevScene && prevScene.config.voice) {
					if (Array.isArray(prevScene.config.voice)) {
						previousVoiceText =
							prevScene.config.voice[prevScene.config.voice.length - 1]
					} else {
						previousVoiceText = prevScene.config.voice as string
					}
				}
			}

			currentScene.value.start({
				complete: (success, metrics, result) =>
					triggerReinforcement(success, metrics, result),
				programId: activeSession.value.id,
				previousVoiceText
			})
		}
	}, 500 / playbackSpeed.value)
}

const findSceneIndexById = (id: string): number => {
	return sessionScenes.value.findIndex(s => s.id === id)
}

const triggerReinforcement = (success: boolean, metrics: any, result?: any) => {
	if (timerRef.value) clearTimeout(timerRef.value)

	currentScene.value?.stop()

	const cooldown = currentScene.value?.cooldown ?? 2000 / playbackSpeed.value

	if (currentScene.value) {
		metricsRef.value.push({
			sceneId: currentScene.value.id,
			success,
			timestamp: Date.now(),
			reactionTime: metrics?.reactionTime || 0
		})

		if (currentScene.value.onComplete) {
			const nextSceneId = currentScene.value.onComplete(success, result)
			if (nextSceneId) {
				const jumpToIndex = findSceneIndexById(nextSceneId)
				if (jumpToIndex !== -1) {
					setTimeout(() => {
						nextScene(jumpToIndex)
					}, cooldown)
					return 
				} else {
					console.warn(
						`Scene with ID '${nextSceneId}' not found. Continuing sequentially.`
					)
				}
			}
		}
	}

	const isPosEnabled = currentScene.value?.config.behavior?.success?.enabled === true
	const isNegEnabled = currentScene.value?.config.behavior?.fail?.enabled === true

	if (success) {
		if (isPosEnabled) {
			const duration = currentScene.value?.duration || 5000
			const reaction = metrics?.reactionTime || 0
			const remainingRatio = Math.max(0, (duration - reaction) / duration)
			const points = Math.round(100 * remainingRatio)

			score.value += points
			state.value = SessionState.REINFORCING_POS

			setTimeout(() => {
				nextScene(sceneIndex.value + 1)
			}, cooldown)
		} else {
			setTimeout(() => {
				nextScene(sceneIndex.value + 1)
			}, cooldown)
		}
	} else {
		if (isNegEnabled) {
			score.value -= 50
			state.value = SessionState.REINFORCING_NEG

			setTimeout(() => {
				nextScene(sceneIndex.value)
			}, cooldown)
		} else {
			setTimeout(() => {
				nextScene(sceneIndex.value)
			}, cooldown)
		}
	}
}

const finishSession = () => {
	if (activeSession.value.id.includes('initial_training')) {
		state.value = SessionState.SELECTION
		const physData = sessionTracker.stopSession()
		const log: SessionLog = {
			id: `SES_${Date.now()}`,
			subjectId: props.subjectId,
			programId: activeSession.value.id,
			startTime: new Date(startTimeRef.value).toISOString(),
			endTime: new Date().toISOString(),
			totalScore: score.value,
			metrics: metricsRef.value,
			physiologicalData: physData
		}
		saveSession(log)
		return
	}

	state.value = SessionState.FINISHED
	audioSession.binaural.stop(3)
	audioSession.musicLooper.stop(3)
	const physData = sessionTracker.stopSession()
	const log: SessionLog = {
		id: `SES_${Date.now()}`,
		subjectId: props.subjectId,
		programId: activeSession.value.id,
		startTime: new Date(startTimeRef.value).toISOString(),
		endTime: new Date().toISOString(),
		totalScore: score.value,
		metrics: metricsRef.value,
		physiologicalData: physData
	}
	saveSession(log)
	setTimeout(() => emit('exit'), 3000 / playbackSpeed.value)
}

const handleSessionSelect = async (program: Session) => {
	console.log('[Theater] Transitioning to session:', program.title)

	activeSession.value = program
	score.value = 0
	metricsRef.value = []
	startTimeRef.value = Date.now()

	if (activeSession.value.audio?.musicTrack && activeSession.value.audio.musicTrack !== 'none') {
		try {
			await audioSession.musicLooper.start({
				track: activeSession.value.audio.musicTrack,
				volume: 0.8
			})
		} catch (e) {
			console.warn(`[Theater] Failed to update music track`, e)
		}
	} else {
		audioSession.musicLooper.stop(2)
	}

	const bConfig = activeSession.value.audio?.binaural
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

	sessionScenes.value = activeSession.value.scenes.map(s => new Scene(s))
	nextScene(0)
}

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
		currentScene.value?.stop()

		sessionTracker.stopSession()
		faceMeshService.stop()
		camera.stop()
		audioSession.binaural.stop()
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
		:style="{ '--speed-factor': playbackSpeed }"
		@mousemove="showControls"
		@click="handleScreenClick"
	>
		<!-- Video Background -->
		<video
			v-if="activeSession.videoBackground"
			autoplay
			loop
			muted
			playsinline
			disablePictureInPicture
			class="absolute top-0 left-0 w-full h-full object-cover z-0"
		>
			<source
				:src="activeSession.videoBackground"
				type="video/mp4"
			/>
		</video>

		<!-- Spiral Background -->
		<div
			v-if="activeSession.spiralBackground"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square spiral-rotation z-0"
			:style="{
				backgroundImage: `url(${activeSession.spiralBackground})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				width: '150vmax',
				height: '150vmax',
				filter: 'blur(8px)',
				opacity: 0.8
			}"
		></div>

		<div
			v-if="activeSession.spiralBackground"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square spiral-rotation z-0"
			:style="{
				backgroundImage: `url(${activeSession.spiralBackground})`,
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
						v-if="!showPermissionRequest && !showBeginButton"
						:progress="loadingProgress"
						:fill-color="currentResolvedTheme.positiveColor || '#10b981'"
					/>

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

					<div
						v-if="showBeginButton"
						class="mt-8 text-center px-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
					>
						<button
							@click.stop="handleBegin"
							class="px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-105"
							:style="{
								backgroundColor: currentResolvedTheme.positiveColor || '#10b981',
								color: '#000',
								boxShadow: `0 0 20px ${
									currentResolvedTheme.positiveColor || '#10b981'
								}40`
							}"
						>
							Begin Session
						</button>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Selection Overlay -->
		<Transition name="selector">
			<div
				v-if="state === SessionState.SELECTION"
				style="zoom: 0.85"
				class="absolute inset-0 z-[60] flex flex-col items-center justify-center p-8 overflow-y-auto"
			>
				<div class="max-w-6xl w-full">
					<h2 class="text-3xl font-light text-white mb-12 text-center">
						Select a Session
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SessionCard
							v-for="prog in FULL_SESSIONS"
							:key="prog.id"
							:program="prog"
							@start="handleSessionSelect"
						/>
					</div>

					<div class="mt-8 text-center">
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

		<!-- Active Scene View -->
		<div class="absolute inset-0 z-10 pointer-events-none">
			<Transition
				name="scene"
				mode="out-in"
			>
				<component
					v-if="
						(state === SessionState.INSTRUCTING || state === SessionState.VALIDATING) &&
						currentScene
					"
					:is="currentScene.component"
					:scene="currentScene"
					:key="currentScene.id"
					class="pointer-events-auto"
				/>
			</Transition>
		</div>

		<!-- Heads Up Display -->
		<HUD
			:state="state"
			:currentScene="currentScene"
			:score="score"
			@exit="emit('exit')"
			class="z-50"
		/>

		<Transition name="fade">
			<TransportControl
				v-show="controlsVisible && state !== SessionState.SELECTION"
				:scenes="sessionScenes"
				:currentIndex="sceneIndex"
				:isPlaying="
					!isPaused && state !== SessionState.FINISHED && state !== SessionState.IDLE
				"
				@play="handlePlay"
				@pause="handlePause"
				@restart="handleRestart"
				@select="nextScene"
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
.scene-enter-active {
	/* Define fallbacks just in case */
	--duration-slow: calc(3s / var(--speed-factor, 1));
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

.scene-leave-active {
	/* Define fallbacks just in case */
	--duration-slow: calc(3s / var(--speed-factor, 1));
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

.scene-enter-from {
	opacity: 0;
	transform: scale(1.1);
}

.scene-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.scene-leave-from {
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
	transition: opacity calc(2s / var(--speed-factor, 1)) ease-in-out;
}

.fade-slow-leave-to {
	opacity: 0;
}
</style>