<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import {
	SessionState,
	type SessionLog,
	type SessionMetric,
	type ThemeConfig,
	type SessionReport
} from '../types'
import { DEFAULT_THEME } from '../theme'
import { Scene } from '../../src-new/core/Scene'
import Visuals from './Visuals.vue'
import HUD from './HUD.vue'
import TransportControl from './TransportControl.vue'
import ProgressBar from './ProgressBar.vue'
import SessionCard from './SessionCard.vue'
import { saveSession } from '../services/storageService'
import { historyApi } from '../services/history'
import { getSceneEffectiveTheme } from '../utils/themeResolver' // Import theme resolver
import { assetUrl } from '../utils/assetUrl'
import { sessionTracker } from '../services/sessionTracker'
import { audioSession } from '../services/audio'
import { playOneShot } from '../services/audio/oneShot'
import { voiceService } from '../services/voiceService'
import { camera, microphone, accelerometer } from '../../src-new/services'
import { playbackSpeed } from '../state/playback'
import { useRouter } from 'vue-router'
import { sessionsApi, type Session } from '../services/sessions'

interface TheaterProps {
	program?: Session
	sessionId?: string
	subjectId?: string
	/**
	 * Embed mode: used by the studio editor's live preview pane. Changes
	 * chrome only — skips the fullscreen request, hides the internal
	 * transport, suppresses the finish screen, starts paused, and routes
	 * around any UI that assumes full-viewport rendering. It does NOT by
	 * itself disable biofeedback — see `enableBiofeedback`.
	 */
	embedded?: boolean
	/**
	 * Whether to wire up camera / microphone / accelerometer devices and
	 * instantiate scene behaviors. Defaults to `!embedded`:
	 *
	 *   - Normal playback (embedded = false):     defaults to true
	 *   - Editor preview (embedded = true):       defaults to false
	 *
	 * The editor's live-preview wrapper flips this on when the writer
	 * explicitly opts in to test biofeedback. When this is false, scene
	 * behaviors are not instantiated at all (Scene is constructed with
	 * `skipBehaviors: true`) and the device acquisition path is skipped.
	 */
	enableBiofeedback?: boolean
	/** Start with master audio muted (used together with `embedded`). */
	initialMuted?: boolean
}

const props = withDefaults(defineProps<TheaterProps>(), {
	subjectId: 'guest',
	embedded: false,
	enableBiofeedback: undefined,
	initialMuted: false
})

/**
 * Resolved biofeedback flag — honours an explicit prop, else falls back to
 * "on in normal mode, off in embedded mode".
 */
const biofeedbackEnabled = computed(() =>
	props.enableBiofeedback ?? !props.embedded,
)
const emit = defineEmits<{
	(e: 'exit'): void
	/** Fired whenever the active scene index changes. */
	(e: 'scene-change', index: number): void
	/** Fired when playback transitions between playing and paused. */
	(e: 'playing-change', isPlaying: boolean): void
}>()

const router = useRouter()

/**
 * List of sessions shown in the in-Theater "Select a Session" grid that
 * appears between plays. Populated once on mount from `/sessions?mine=1`.
 */
const FULL_SESSIONS = ref<Session[]>([])

const activeSession = shallowRef<Session | null>(null)
const sessionReport = ref<SessionReport | undefined>(undefined)

const cleanupSession = (fadeDuration: number = 0.5) => {
	// Stop scene progression
	if (timerRef.value) {
		clearTimeout(timerRef.value)
		timerRef.value = null
	}
	if (transitionTimerRef.value) {
		clearTimeout(transitionTimerRef.value)
		transitionTimerRef.value = null
	}
	isTransitioningBetweenScenes.value = false
	
	if (currentScene.value) {
		currentScene.value.stop()
	}

	// Ensure all audio is stopped
	audioSession.binaural.stop(fadeDuration)
	audioSession.musicLooper.stop(fadeDuration)
	microphone.stop()
	voiceService.stop()
	
	// Stop hardware
	camera.stop()
	accelerometer.stop()
	
	activeFxStops.value.forEach(stop => stop(fadeDuration))
	activeFxStops.value.clear()

	activeSoundboardStops.value.forEach(stop => stop(fadeDuration))
	activeSoundboardStops.value.clear()
}

const exitSession = () => {
	emit('exit')
	cleanupSession(0.5)
	router.push('/sessions')
}

onUnmounted(() => {
	cleanupSession(0.5)
})

const state = ref<SessionState>(SessionState.INITIALIZING)
const sessionScenes = shallowRef<Scene[]>([])
const sceneIndex = ref(0)
const score = ref(0)
// Embedded preview mounts start paused — the writer hasn't asked for
// playback, they just want to see the scene they're editing. The auto-
// advance guard in triggerReinforcement will hold on whatever scene they
// select until they hit play.
const isPaused = ref(props.embedded)

// --- Outward state contract -------------------------------------------------
// Anything outside Theater (e.g. the studio editor's live preview) should
// observe Theater purely through these events. Do not read internal refs.
watch(sceneIndex, (i) => emit('scene-change', i))

const isPlayingComputed = computed(
	() =>
		!isPaused.value &&
		state.value !== SessionState.FINISHED &&
		state.value !== SessionState.IDLE &&
		state.value !== SessionState.INITIALIZING,
)
watch(isPlayingComputed, (p) => emit('playing-change', p), { immediate: false })
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

// Loading State
const loadingMessage = ref('Preparing Session')
const loadingProgress = ref(0)
const showLoadingContent = ref(false)
const showPermissionRequest = ref(false)
const pendingPermissions = ref({
	camera: false,
	microphone: false,
	accelerometer: false
})

const permissionLabel = computed(() => {
	const list = []
	if (pendingPermissions.value.camera) list.push('Camera')
	if (pendingPermissions.value.microphone) list.push('Microphone')
	if (pendingPermissions.value.accelerometer) list.push('GAZE Motion Device')

	if (list.length === 0) return 'Devices'
	if (list.length === 1) return list[0]
	if (list.length === 2) return list.join(' & ')
	return list.slice(0, -1).join(', ') + ' & ' + list[list.length - 1]
})

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

/**
 * Resolved theme for the active scene. Computed (not watched) so Vue's
 * dep tracker follows reads through the reactive scene config proxy —
 * editing `scene.config.theme.backgroundColor` in the studio editor will
 * invalidate this and re-render without a Theater remount or a scene
 * re-trigger.
 */
const currentResolvedTheme = computed<ThemeConfig>(() => {
	const scene = currentScene.value
	const session = activeSession.value
	if (scene && session) {
		return getSceneEffectiveTheme(session, scene as any)
	}
	return session?.theme || DEFAULT_THEME
})

provide('resolvedTheme', currentResolvedTheme)
provide('sessionReport', sessionReport)

const initSession = async () => {
	if (!activeSession.value) return
	console.log('[Theater] Starting initSession')
	state.value = SessionState.INITIALIZING
	loadingProgress.value = 0
	showLoadingContent.value = false

	setTimeout(() => {
		showLoadingContent.value = true
	}, 100)

	let needsCamera = false
	let needsMicrophone = false
	let needsAccelerometer = false

	// Only scan for required hardware when biofeedback is enabled. In
	// embedded-preview-without-biofeedback mode this block is skipped
	// entirely so the writer never sees device prompts on editor load.
	if (biofeedbackEnabled.value) {
		activeSession.value!.scenes.forEach(s => {
			s.config.behavior?.suggestions?.forEach(sig => {
				const BehaviorClass = Scene.getBehaviorClass(sig.type)
				if (BehaviorClass) {
					const devices = (BehaviorClass as any).requiredDevices || []
					if (devices.includes('camera')) needsCamera = true
					if (devices.includes('microphone')) needsMicrophone = true
					if (devices.includes('accelerometer')) needsAccelerometer = true
				}
			})
		})
	}

	const needsAudio =
		activeSession.value!.audio?.musicTrack !== 'none' || activeSession.value!.audio?.binaural

	console.log('[Theater] Hardware Requirements:', {
		needsCamera,
		needsMicrophone,
		needsAccelerometer,
		needsAudio
	})

	// In embedded mode the editor owns the permission-request UX — it shows
	// its own gate before even setting enableBiofeedback to true, so by the
	// time we reach this point permissions have already been granted and we
	// can skip the in-theater prompt entirely.
	if (!props.embedded && (needsCamera || needsMicrophone || needsAccelerometer)) {
		try {
			const camQuery = needsCamera
				? navigator.permissions.query({ name: 'camera' as any })
				: Promise.resolve(null)
			const micQuery = needsMicrophone
				? navigator.permissions.query({ name: 'microphone' as any })
				: Promise.resolve(null)
			const accelGranted = needsAccelerometer ? await accelerometer.isAccessGranted() : true

			const [camStatus, micStatus] = await Promise.all([camQuery, micQuery])

			let missingCam = camStatus?.state === 'prompt'
			let missingMic = micStatus?.state === 'prompt'
			let missingAccel = needsAccelerometer && !accelGranted

			if (missingCam || missingMic || missingAccel) {
				loadingMessage.value = 'Enable Biofeedback'
				pendingPermissions.value = {
					camera: missingCam,
					microphone: missingMic,
					accelerometer: missingAccel
				}
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
				activeSession.value!.audio?.musicTrack &&
				activeSession.value!.audio.musicTrack !== 'none'
			) {
				try {
					await audioSession.musicLooper.start({
						track: activeSession.value!.audio.musicTrack,
						volume: 0.8
					})
				} catch (e) {
					console.warn(
						`[Theater] Failed to start music track: ${
							activeSession.value!.audio.musicTrack
						}`,
						e
					)
				}
			}

			// Preload & Validate Soundboard
			soundboardErrors.value.clear()
			if (activeSession.value!.audio?.soundboard) {
				const loadPromises = activeSession.value!.audio.soundboard.map(async sample => {
					try {
						await audioSession.loadBuffer(sample.path)
					} catch (e) {
						console.error(`[Theater] Failed to load soundboard sample: ${sample.id}`, e)
						soundboardErrors.value.add(sample.id)
					}
				})
				// We don't necessarily await this strictly before starting, 
				// but it's better to know errors early.
				// Let's await it to ensure status is ready when UI shows up.
				await Promise.allSettled(loadPromises)
			}

			const bConfig = activeSession.value!.audio?.binaural
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
			await microphone.start()
		} catch (e) {
			console.warn('Speech Initialization Failed', e)
			if (!props.embedded) {
				alert(
					'Microphone access is required for this session. Please enable it in your browser settings and try again.'
				)
				emit('exit')
				return
			}
			// In embedded mode the editor owns the permission UX. Fail soft.
		}
	}

	loadingProgress.value = 75

	if (needsCamera) {
		try {
			await camera.start()
		} catch (e) {
			console.error('Camera Initialization Failed', e)
			if (!props.embedded) {
				alert('Camera access required for this session.')
				emit('exit')
				return
			}
			// In embedded mode the editor owns the permission UX. Fail soft.
		}
	}
	loadingProgress.value = 90

	// Skip behavior initialization whenever biofeedback is disabled. Configs
	// are passed by reference so in-place editor edits flow through live.
	sessionScenes.value = activeSession.value.scenes.map(
		s => new Scene(s, { skipBehaviors: !biofeedbackEnabled.value })
	)
	console.log('[Theater] Scenes Prepared:', sessionScenes.value.length)

	loadingProgress.value = 100

	if (!props.embedded && !document.fullscreenElement) {
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

const handleGrantAccess = async () => {
	if (pendingPermissions.value.accelerometer) {
		try {
			await accelerometer.requestAccess()
		} catch (e) {
			console.warn('Accelerometer access failed', e)
		}
	}
	showPermissionRequest.value = false
}

const showBeginButton = ref(false)
const isTransitioningBetweenScenes = ref(false)
const transitionTimerRef = ref<number | null>(null)

const handleBegin = () => {
	try {
		document.documentElement
			.requestFullscreen()
			.catch(e => console.warn('Fullscreen failed', e))
	} catch (e) {}
	showBeginButton.value = false
}

const transitionToScene = (index: number, cooldown: number) => {
	currentScene.value?.stop()

	const rawFade = currentScene.value?.config.fadeOutDuration || 3000
	const fadeMs = rawFade / playbackSpeed.value

	isTransitioningBetweenScenes.value = true

	if (transitionTimerRef.value) clearTimeout(transitionTimerRef.value)

	transitionTimerRef.value = window.setTimeout(() => {
		isTransitioningBetweenScenes.value = false
		nextScene(index)
	}, fadeMs + cooldown)
}

const activeFxStops = ref<Set<(fade?: number) => void>>(new Set())
const activeSoundboardStops = ref(new Map<string, (fade?: number) => void>())
const soundboardErrors = ref<Set<string>>(new Set())

const getSoundboardSample = (id: string) => {
	return activeSession.value?.audio?.soundboard?.find(s => s.id === id)
}

const isLoopingSample = (id: string) => {
	const sample = getSoundboardSample(id)
	return sample?.loop === true
}

const activeSoundboardIds = computed(() => Array.from(activeSoundboardStops.value.keys()))

const toggleSoundboardSample = (id: string) => {
	if (soundboardErrors.value.has(id)) return // Don't play errored samples

	if (activeSoundboardStops.value.has(id)) {
		// Stop
		const stop = activeSoundboardStops.value.get(id)
		const sample = getSoundboardSample(id)
		stop?.(sample?.fadeOutDuration ?? 0.5)
		activeSoundboardStops.value.delete(id)
	} else {
		// Start
		const sample = getSoundboardSample(id)
		if (sample) {
			playOneShot(
				audioSession,
				sample.path,
				'fx',
				sample.volume ?? 1,
				sample.loop ?? false,
				sample.fadeInDuration ?? 0
			)
				.then(control => {
					activeSoundboardStops.value.set(id, control.stop)
					control.promise.then(() => {
						if (activeSoundboardStops.value.get(id) === control.stop) {
							activeSoundboardStops.value.delete(id)
						}
					})
				})
				.catch(e => console.warn(`Failed to manual start ${id}`, e))
		}
	}
}

const getExpectedLoopState = (targetIndex: number): Set<string> => {
	const activeLoops = new Set<string>()
	
	// Iterate from start to target index to build state
	for (let i = 0; i <= targetIndex; i++) {
		const scene = sessionScenes.value[i]
		if (scene && scene.config.audio?.soundboard) {
			scene.config.audio.soundboard.forEach(evt => {
				if (!isLoopingSample(evt.id)) return // Only track loops
				
				if (evt.event === 'start') {
					activeLoops.add(evt.id)
				} else if (evt.event === 'stop') {
					activeLoops.delete(evt.id)
				}
			})
		}
	}
	return activeLoops
}

const nextScene = (index: number) => {
	console.log('[Theater] nextScene:', index)

	// Cancel any pending transitions if manually triggered or re-triggered
	if (transitionTimerRef.value) {
		clearTimeout(transitionTimerRef.value)
		transitionTimerRef.value = null
	}
	isTransitioningBetweenScenes.value = false

	const isSequential = index === sceneIndex.value + 1

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

	// ==========================================
	// Soundboard State Reconciliation (NLE Style)
	// ==========================================
	
	const expectedLoops = getExpectedLoopState(index)
	const currentActiveIDs = Array.from(activeSoundboardStops.value.keys())

	// 1. Stop sounds that shouldn't be playing
	currentActiveIDs.forEach(id => {
		const isLoop = isLoopingSample(id)
		
		// If it's a loop and NOT expected -> Stop it
		if (isLoop && !expectedLoops.has(id)) {
			const stop = activeSoundboardStops.value.get(id)
			const sample = getSoundboardSample(id)
			stop?.(sample?.fadeOutDuration ?? 0.5)
			activeSoundboardStops.value.delete(id)
		} 
		// If it's a One-Shot and we JUMPED -> Stop it (clean slate)
		else if (!isLoop && !isSequential) {
			const stop = activeSoundboardStops.value.get(id)
			stop?.(0.5) // Quick fade for cut one-shots
			activeSoundboardStops.value.delete(id)
		}
	})

	// 2. Start expected loops that aren't playing
	expectedLoops.forEach(id => {
		if (!activeSoundboardStops.value.has(id)) {
			const sample = getSoundboardSample(id)
			if (sample) {
				playOneShot(
					audioSession,
					sample.path,
					'fx',
					sample.volume ?? 1,
					sample.loop ?? false,
					sample.fadeInDuration ?? 0
				).then(control => {
					activeSoundboardStops.value.set(id, control.stop)
					control.promise.then(() => {
						if (activeSoundboardStops.value.get(id) === control.stop) {
							activeSoundboardStops.value.delete(id)
						}
					})
				}).catch(e => console.warn(`Failed to start loop ${id}`, e))
			}
		}
	})

	// 3. Trigger One-Shots for this specific scene
	// (Only if they are defined in THIS scene)
	if (currentScene.value?.config.audio?.soundboard) {
		currentScene.value.config.audio.soundboard.forEach(evt => {
			if (!isLoopingSample(evt.id)) {
				if (evt.event === 'start') {
					const sample = getSoundboardSample(evt.id)
					if (sample) {
						playOneShot(
							audioSession,
							sample.path,
							'fx',
							sample.volume ?? 1,
							sample.loop ?? false,
							sample.fadeInDuration ?? 0
						).then(control => {
							activeSoundboardStops.value.set(evt.id, control.stop)
							control.promise.then(() => {
								if (activeSoundboardStops.value.get(evt.id) === control.stop) {
									activeSoundboardStops.value.delete(evt.id)
								}
							})
						}).catch(e => console.warn(`Failed to play one-shot ${evt.id}`, e))
					}
				} else if (evt.event === 'stop') {
					// Explicit stop for one-shot?
					const stop = activeSoundboardStops.value.get(evt.id)
					stop?.(0.5)
					activeSoundboardStops.value.delete(evt.id)
				}
			}
		})
	}

	// Handle scene-level FX (one-shot audio).
	if (currentScene.value?.config.audio?.fx) {
		const fx = currentScene.value.config.audio.fx
		playOneShot(
			audioSession,
			fx.path,
			'fx',
			fx.volume ?? 1,
			fx.loop ?? false
		)
			.then(control => {
				activeFxStops.value.add(control.stop)
				control.promise.then(() => activeFxStops.value.delete(control.stop))
			})
			.catch(e => console.warn('Failed to play FX', e))
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
				programId: activeSession.value!.id,
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

	// If the user has paused, don't auto-advance to the next scene. The
	// current scene has already rendered; hold here until they hit play or
	// jump to a different scene. This matters for the embedded editor
	// preview where clicking a scene should show it without kicking off
	// the auto-progression chain.
	if (isPaused.value) {
		return
	}

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

			transitionToScene(sceneIndex.value + 1, cooldown)
		} else {
			transitionToScene(sceneIndex.value + 1, cooldown)
		}
	} else {
		if (isNegEnabled) {
			score.value -= 50
			state.value = SessionState.REINFORCING_NEG

			transitionToScene(sceneIndex.value, cooldown)
		} else {
			transitionToScene(sceneIndex.value, cooldown)
		}
	}
}

const persistRun = (log: SessionLog, extras: { report?: SessionReport | null } = {}) => {
	// Local cache (offline fallback).
	saveSession(log)
	// Canonical persistence: POST to /history. Fire-and-forget so a server
	// hiccup never blocks session teardown. Errors are logged, not thrown.
	const prog = activeSession.value!
	const totalScenes = prog.scenes.length
	const scenesCompleted = log.metrics.length
	historyApi
		.create({
			programId: log.programId,
			programTitle: prog.title,
			startTime: log.startTime,
			endTime: log.endTime,
			totalScore: log.totalScore,
			scenesCompleted,
			totalScenes,
			completeness: totalScenes
				? Math.min(100, Math.round((scenesCompleted / totalScenes) * 100))
				: 0,
			durationMs: log.endTime
				? new Date(log.endTime).getTime() - new Date(log.startTime).getTime()
				: 0,
			metrics: log.metrics,
			physiologicalData: log.physiologicalData,
			biometrics: log.biometrics ?? null,
			report: extras.report ?? null,
		})
		.catch((err) => console.warn('[Theater] failed to persist session run', err))
}

const finishSession = () => {
	// In embedded preview mode, never show the score card or redirect —
	// just loop back to scene 0 so the writer can keep scrubbing.
	if (props.embedded) {
		metricsRef.value = []
		sessionReport.value = undefined
		startTimeRef.value = Date.now()
		nextScene(0)
		return
	}

	// Calculate Report
	const successfulSceneIds = new Set(
		metricsRef.value.filter(m => m.success).map(m => m.sceneId)
	)

	const suggestionsCompleted = sessionScenes.value.filter(
		s =>
			s.config.behavior?.suggestions &&
			s.config.behavior.suggestions.length > 0 &&
			successfulSceneIds.has(s.id)
	).length

	const { snapshots: physData, summary: biometricSummary } = sessionTracker.stopSession()

	sessionReport.value = {
		durationMs: Date.now() - startTimeRef.value,
		scenesCompleted: metricsRef.value.length, // Only count scenes we have metrics for (visited)
		totalScenes: sessionScenes.value.length,
		suggestionsCompleted,
		points: score.value,
		biometrics: biometricSummary
	}

	state.value = SessionState.FINISHED
	audioSession.binaural.stop(3)
	audioSession.musicLooper.stop(3)
	
	activeFxStops.value.forEach(stop => stop(3))
	// activeFxStops.value.clear() // Allow onUnmounted to stop if needed

	activeSoundboardStops.value.forEach(stop => stop(3))
	// activeSoundboardStops.value.clear() // Allow onUnmounted to stop if needed

	// const physData = sessionTracker.stopSession() // ALREADY STOPPED ABOVE
	const log: SessionLog = {
		id: `SES_${Date.now()}`,
		subjectId: props.subjectId,
		programId: activeSession.value!.id,
		startTime: new Date(startTimeRef.value).toISOString(),
		endTime: new Date().toISOString(),
		totalScore: score.value,
		metrics: metricsRef.value,
		physiologicalData: physData,
		biometrics: biometricSummary
	}
	persistRun(log, { report: sessionReport.value })
	setTimeout(() => exitSession(), 10000 / playbackSpeed.value)
}

const handleSessionSelect = async (program: Session) => {
	console.log('[Theater] Transitioning to session:', program.title)

	activeSession.value = program
	score.value = 0
	metricsRef.value = []
	sessionReport.value = undefined
	startTimeRef.value = Date.now()

	if (
		activeSession.value!.audio?.musicTrack &&
		activeSession.value!.audio.musicTrack !== 'none'
	) {
		try {
			await audioSession.musicLooper.start({
				track: activeSession.value!.audio.musicTrack,
				volume: 0.8
			})
		} catch (e) {
			console.warn(`[Theater] Failed to update music track`, e)
		}
	} else {
		audioSession.musicLooper.stop(2)
	}

	const bConfig = activeSession.value!.audio?.binaural
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

	sessionScenes.value = activeSession.value!.scenes.map(
		s => new Scene(s, { skipBehaviors: !biofeedbackEnabled.value })
	)
	nextScene(0)
}

onMounted(async () => {
	// Initialize activeSession — either from a directly-passed Session
	// (used by SessionLivePreview when it already has the doc) or by
	// fetching from /sessions/:id.
	if (props.program) {
		activeSession.value = props.program
	} else if (props.sessionId) {
		try {
			activeSession.value = await sessionsApi.get(props.sessionId)
		} catch (e) {
			console.error(`[Theater] Failed to load session ${props.sessionId}`, e)
			exitSession()
			return
		}
	}

	if (!activeSession.value) {
		exitSession()
		return
	}

	// Populate the in-Theater "Select a Session" grid from the API. Non-
	// fatal on failure — the grid just stays empty.
	try {
		const list = await sessionsApi.list({ mine: true, limit: 50 })
		FULL_SESSIONS.value = list.items
	} catch (e) {
		console.warn('[Theater] Failed to load session list', e)
	}

	if (props.initialMuted) {
		try {
			audioSession.setMasterVolume(0)
		} catch (e) {
			console.warn('[Theater] initialMuted: setMasterVolume failed', e)
		}
	}

	if (!props.embedded) {
		try {
			document.documentElement
				.requestFullscreen()
				.catch(e => console.log('Fullscreen blocked', e))
		} catch (e) {}
	}

	initSession()

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') exitSession()
	}
	window.addEventListener('keydown', handleKeyDown)
})

// --- Imperative API ---------------------------------------------------------
// A narrow, stable surface for parents that embed Theater (e.g. the studio
// editor's live preview). These methods are plain functions — no ref
// unwrapping pitfalls. Observers should subscribe to `scene-change` /
// `playing-change` events instead of reading internal refs.
function jumpToScene(index: number) {
	if (index < 0 || index >= sessionScenes.value.length) return
	if (index === sceneIndex.value) {
		// Re-trigger the current scene (used by the preview to replay after
		// an in-place text/voice edit).
		nextScene(index)
		return
	}
	nextScene(index)
}
function play() {
	handlePlay()
}
function pause() {
	handlePause()
}
function restart() {
	handleRestart()
}

defineExpose({
	jumpToScene,
	play,
	pause,
	restart,
})
</script>

<template>
	<div
		class="overflow-hidden transition-all duration-300"
		:class="[
			embedded
				? 'relative w-full h-full'
				: 'fixed inset-0 z-40',
			controlsVisible ? 'cursor-default' : 'cursor-none',
		]"
		:style="{
			'--speed-factor': playbackSpeed,
			backgroundColor: currentResolvedTheme.backgroundColor || '#000',
			color: currentResolvedTheme.uiTextColor || '#fff',
		}"
		@mousemove="showControls"
		@click="handleScreenClick"
	>
		<!-- Video Background -->
		<video
			v-if="activeSession?.settings?.videoBackground"
			autoplay
			loop
			muted
			playsinline
			disablePictureInPicture
			class="absolute top-0 left-0 w-full h-full object-cover z-0"
		>
			<source
				:src="assetUrl(activeSession!.settings!.videoBackground)"
				type="video/mp4"
			/>
		</video>

		<!-- Spiral Background -->
		<div
			v-if="activeSession?.settings?.spiralBackground"
			class="spiral-bg spiral-rotation"
			:style="{
				backgroundImage: `url(${assetUrl(activeSession!.settings!.spiralBackground)})`,
				filter: 'blur(8px)'
			}"
		></div>

		<div
			v-if="activeSession?.settings?.spiralBackground"
			class="spiral-bg spiral-rotation"
			:style="{
				backgroundImage: `url(${assetUrl(activeSession!.settings!.spiralBackground)})`,
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
							<span class="text-white font-bold">{{ permissionLabel }}</span
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
							@start="(doc) => handleSessionSelect(doc)"
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
						currentScene &&
						!isTransitioningBetweenScenes
					"
					:is="currentScene.component"
					:scene="currentScene"
					:key="currentScene.id"
					class="pointer-events-auto"
					:style="{
						'--fade-duration': `${currentScene.config.fadeOutDuration || 3000}ms`
					}"
				/>
			</Transition>
		</div>

		<!-- Heads Up Display -->
		<HUD
			:state="state"
			:currentScene="currentScene"
			:score="score"
			@exit="exitSession"
			class="z-50"
		/>

		<Transition name="fade">
			<TransportControl
				v-if="!embedded"
				v-show="controlsVisible && state !== SessionState.SELECTION"
				:scenes="sessionScenes"
				:currentIndex="sceneIndex"
				:isPlaying="
					!isPaused && state !== SessionState.FINISHED && state !== SessionState.IDLE
				"
				:isVisible="controlsVisible"
				:soundboardSamples="activeSession?.audio?.soundboard || []"
				:activeSoundboardIds="activeSoundboardIds"
				:soundboardErrors="soundboardErrors"
				@play="handlePlay"
				@pause="handlePause"
				@restart="handleRestart"
				@select="nextScene"
				@menu-toggle="val => (isMenuOpen = val)"
				@hide="controlsVisible = false"
				@exit="exitSession"
				@toggle-soundboard="toggleSoundboardSample"
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
	--duration-slow: calc(var(--fade-duration, 3000ms) / var(--speed-factor, 1));
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
	--duration-slow: calc(var(--fade-duration, 3000ms) / var(--speed-factor, 1));
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

.spiral-bg {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 150vmax;
	height: 150vmax;
	background-size: cover;
	background-position: center;
	z-index: 1;
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
