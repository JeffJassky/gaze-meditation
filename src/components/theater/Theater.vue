<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { SessionState, type ThemeConfig } from '@/types'
import { DEFAULT_THEME } from '@/theme'
import { Scene } from '@/core/Scene'
import { defaultDeviceContext } from '@/devices'
import Visuals from './Visuals.vue'
import HUD from './HUD.vue'
import TransportControl from './TransportControl.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import TheaterLoadingOverlay from './TheaterLoadingOverlay.vue'
import SessionCard from '@/components/dashboard/SessionCard.vue'
import { getSceneEffectiveTheme } from '@/utils/themeResolver'
import { assetUrl } from '@/utils/assetUrl'
import { voiceService } from '@/services/voiceService'
import { playbackSpeed } from '@/state/playback'
import { auth } from '@/state/auth'
import { useRouter } from 'vue-router'
import { sessionsApi, type Session } from '@/api/sessions'

// Composables — each owns its service layer and exposes a controlled interface.
import { useTheaterControls } from '@/composables/useTheaterControls'
import { useTheaterAudio } from '@/composables/useTheaterAudio'
import { useTheaterHaptics } from '@/composables/useTheaterHaptics'
import { useTheaterBiofeedback } from '@/composables/useTheaterBiofeedback'
import { useTheaterScoring } from '@/composables/useTheaterScoring'

// ---------------------------------------------------------------------------
// Props / Emits
// ---------------------------------------------------------------------------

interface TheaterProps {
	program?: Session
	sessionSlug?: string
	subjectId?: string
	embedded?: boolean
	enableBiofeedback?: boolean
	initialMuted?: boolean
}

const props = withDefaults(defineProps<TheaterProps>(), {
	subjectId: 'guest',
	embedded: false,
	enableBiofeedback: undefined,
	initialMuted: false,
})

const biofeedbackEnabled = computed(() => props.enableBiofeedback ?? !props.embedded)

const emit = defineEmits<{
	(e: 'exit'): void
	(e: 'scene-change', index: number): void
	(e: 'playing-change', isPlaying: boolean): void
}>()

const router = useRouter()

// ---------------------------------------------------------------------------
// Session state (owned by Theater — the orchestration root)
// ---------------------------------------------------------------------------

const FULL_SESSIONS = ref<Session[]>([])
const activeSession = shallowRef<Session | null>(null)

// ---------------------------------------------------------------------------
// Scene state
// ---------------------------------------------------------------------------

const state = ref<SessionState>(SessionState.INITIALIZING)
const sessionScenes = shallowRef<Scene[]>([])
const sceneIndex = ref(0)
const isPaused = ref(props.embedded)
const timerRef = ref<number | null>(null)
const isTransitioningBetweenScenes = ref(false)
const transitionTimerRef = ref<number | null>(null)
const showBeginButton = ref(false)

// Loading UI
const loadingMessage = ref('Preparing Session')
const loadingProgress = ref(0)
const showLoadingContent = ref(false)

const currentScene = computed(() => {
	if (sceneIndex.value < sessionScenes.value.length) {
		return sessionScenes.value[sceneIndex.value]
	}
	return undefined
})

const currentResolvedTheme = computed<ThemeConfig>(() => {
	const scene = currentScene.value
	const session = activeSession.value
	if (scene && session) return getSceneEffectiveTheme(session, scene as any)
	return { ...DEFAULT_THEME, ...session?.theme }
})

const isPlayingComputed = computed(
	() =>
		!isPaused.value &&
		state.value !== SessionState.FINISHED &&
		state.value !== SessionState.IDLE &&
		state.value !== SessionState.INITIALIZING,
)

// Outward state contract — events only, no ref leaking.
watch(sceneIndex, i => emit('scene-change', i))
watch(isPlayingComputed, p => emit('playing-change', p), { immediate: false })

provide('resolvedTheme', currentResolvedTheme)

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------

const controls = useTheaterControls()
const audio = useTheaterAudio(activeSession, sessionScenes)
const haptics = useTheaterHaptics(activeSession, sessionScenes)
const biofeedback = useTheaterBiofeedback(biofeedbackEnabled)
const scoring = useTheaterScoring()

provide('sessionReport', scoring.sessionReport)

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

function cleanupSession(fadeDuration = 0.5) {
	if (timerRef.value) { clearTimeout(timerRef.value); timerRef.value = null }
	if (transitionTimerRef.value) { clearTimeout(transitionTimerRef.value); transitionTimerRef.value = null }
	isTransitioningBetweenScenes.value = false

	// Stop all scenes (each scene now also stops voice internally)
	for (const scene of sessionScenes.value) scene.stop()
	// Belt-and-suspenders: stop voice at the theater level too
	voiceService.stop()

	audio.stopAll(fadeDuration)
	haptics.stopAll()
	biofeedback.stopDevices()
}

function exitSession() {
	emit('exit')
	cleanupSession(0)
	router.push('/sessions')
}

onUnmounted(() => cleanupSession(0))

// ---------------------------------------------------------------------------
// Playback controls
// ---------------------------------------------------------------------------

function handlePause() {
	isPaused.value = true
	if (timerRef.value) clearTimeout(timerRef.value)
	currentScene.value?.stop()
}

function handlePlay() {
	isPaused.value = false
	nextScene(sceneIndex.value)
}

function handleRestart() {
	isPaused.value = false
	nextScene(0)
}

function handleScreenClick(e: MouseEvent) {
	if (biofeedback.showPermissionRequest.value) return
	if (state.value === SessionState.SELECTION) return

	controls.showControls()

	const width = window.innerWidth
	const x = e.clientX
	const threshold = width * 0.25

	if (x < threshold) {
		if (sceneIndex.value > 0) nextScene(sceneIndex.value - 1)
	} else if (x > width - threshold) {
		if (sceneIndex.value < sessionScenes.value.length - 1) nextScene(sceneIndex.value + 1)
	}
}

function handleBegin() {
	try {
		document.documentElement.requestFullscreen().catch(() => {})
	} catch {}
	showBeginButton.value = false
}

// ---------------------------------------------------------------------------
// Scene progression
// ---------------------------------------------------------------------------

function transitionToScene(index: number, cooldown: number) {
	currentScene.value?.stop()

	const rawFade = currentScene.value?.config?.fadeOutDuration || 3000
	const fadeMs = rawFade / playbackSpeed.value

	isTransitioningBetweenScenes.value = true
	if (transitionTimerRef.value) clearTimeout(transitionTimerRef.value)

	transitionTimerRef.value = window.setTimeout(() => {
		isTransitioningBetweenScenes.value = false
		nextScene(index)
	}, fadeMs + cooldown)
}

function findSceneIndexById(id: string): number {
	return sessionScenes.value.findIndex(s => s.id === id)
}

function nextScene(index: number) {
	console.log('[Theater] nextScene:', index)

	if (transitionTimerRef.value) { clearTimeout(transitionTimerRef.value); transitionTimerRef.value = null }
	isTransitioningBetweenScenes.value = false

	const isSequential = index === sceneIndex.value + 1

	if (index === 0) {
		scoring.startTracking()
		if (!props.embedded && activeSession.value) {
			scoring.beginRun(
				activeSession.value.id,
				activeSession.value.title,
				activeSession.value.scenes.length,
			)
		}
	}

	if (index >= sessionScenes.value.length) {
		currentScene.value?.stop()
		sceneIndex.value = index
		setTimeout(() => finishSession(), 3000 / playbackSpeed.value)
		return
	}

	currentScene.value?.stop()
	sceneIndex.value = index
	state.value = SessionState.INSTRUCTING

	// Delegate to composables.
	if (currentScene.value) {
		audio.applySceneBinaural(currentScene.value)
		audio.reconcileSoundboard(index, currentScene.value, isSequential)
		audio.playSceneFx(currentScene.value)
		haptics.applySceneOverride(currentScene.value)
		haptics.reconcileHaptics(index, currentScene.value, isSequential)
	}

	if (timerRef.value) clearTimeout(timerRef.value)

	timerRef.value = window.setTimeout(() => {
		state.value = SessionState.VALIDATING

		if (currentScene.value) {
			let previousVoiceText: string | undefined
			if (sceneIndex.value > 0) {
				const prevScene = sessionScenes.value[sceneIndex.value - 1]
				if (prevScene?.config?.voice) {
					previousVoiceText = Array.isArray(prevScene.config.voice)
						? prevScene.config.voice[prevScene.config.voice.length - 1]
						: prevScene.config.voice as string
				}
			}

			currentScene.value.start({
				complete: (success, metrics, result) =>
					triggerReinforcement(success, metrics, result),
				programId: activeSession.value!.id,
				previousVoiceText,
				masterAudioKey: activeSession.value!.masterAudio?.key,
			})
		}
	}, 500 / playbackSpeed.value)
}

// ---------------------------------------------------------------------------
// Reinforcement (bridges scoring → scene progression)
// ---------------------------------------------------------------------------

function triggerReinforcement(success: boolean, metrics: any, result?: any) {
	if (timerRef.value) clearTimeout(timerRef.value)
	currentScene.value?.stop()
	haptics.fireBehaviorResponse(success)

	if (!currentScene.value) return

	const instruction = scoring.handleReinforcement(
		currentScene.value,
		sceneIndex.value,
		success,
		metrics,
		result,
		isPaused.value,
		findSceneIndexById,
		playbackSpeed.value,
	)

	if (!instruction) return // paused

	// Sync progress to server after each scene completes.
	if (!props.embedded && activeSession.value) {
		scoring.syncProgress(activeSession.value.scenes.length)
	}

	if (instruction.state === 'REINFORCING_POS') state.value = SessionState.REINFORCING_POS
	else if (instruction.state === 'REINFORCING_NEG') state.value = SessionState.REINFORCING_NEG

	transitionToScene(instruction.targetIndex, instruction.cooldown)
}

// ---------------------------------------------------------------------------
// Session finish
// ---------------------------------------------------------------------------

function finishSession() {
	if (props.embedded) {
		scoring.resetForSession()
		nextScene(0)
		return
	}

	scoring.finishSession(
		activeSession.value!.id,
		activeSession.value!.title,
		props.subjectId,
		sessionScenes.value,
		activeSession.value!.scenes.length,
	)

	audio.fadeOutAll(3)
	haptics.fadeOutAll(3)

	// Refresh user stats (level/xp) after server recalculation
	auth.refreshUser()

	// Initial training session: show session selector instead of exiting
	if (activeSession.value!.slug === 'initial-training-short') {
		state.value = SessionState.SELECTION
		return
	}

	state.value = SessionState.FINISHED
	setTimeout(() => exitSession(), 10000 / playbackSpeed.value)
}

// ---------------------------------------------------------------------------
// Session switching (in-theater session selector)
// ---------------------------------------------------------------------------

async function handleSessionSelect(program: Session) {
	console.log('[Theater] Transitioning to session:', program.title)

	activeSession.value = program
	scoring.resetForSession()

	await audio.switchSession(program)
	haptics.switchSession(program)

	sessionScenes.value = program.scenes.map(
		s => new Scene(s, { skipBehaviors: !biofeedbackEnabled.value, devices: defaultDeviceContext }),
	)
	nextScene(0)
}

// ---------------------------------------------------------------------------
// Initialization orchestration
// ---------------------------------------------------------------------------

async function initSession() {
	if (!activeSession.value) return
	console.log('[Theater] Starting initSession')

	state.value = SessionState.INITIALIZING
	loadingProgress.value = 0
	showLoadingContent.value = false
	setTimeout(() => { showLoadingContent.value = true }, 100)

	// 1. Detect required hardware.
	const needs = biofeedback.detectRequiredDevices(activeSession.value)
	const needsAudio =
		activeSession.value.audio?.musicTrack !== 'none' || !!activeSession.value.audio?.binaural
	const needsHaptics = activeSession.value.scenes.some(s => (s.config.haptics?.events?.length ?? 0) > 0)

	console.log('[Theater] Hardware Requirements:', { ...needs, needsAudio, needsHaptics })

	// 2. Permission gate (non-embedded only).
	if (!props.embedded) {
		// If haptics needed, set up the scan callback so it runs inside the user gesture
		if (needsHaptics) {
			haptics.setup(activeSession.value)
			biofeedback.setOnGrantHaptics(async () => {
				await haptics.connect()
			})
		}
		loadingMessage.value = 'Enable Biofeedback'
		await biofeedback.requestPermissions({ ...needs, needsHaptics })
		loadingMessage.value = 'Preparing Session'
	}

	loadingProgress.value = 20

	// 3. Audio setup.
	if (needsAudio) {
		try {
			await audio.setup(activeSession.value)
		} catch (e) {
			console.warn('Audio Initialization Failed', e)
		}
	}
	loadingProgress.value = 50


	// 4. Device init.
	const devicesOk = await biofeedback.initDevices(needs, props.embedded)
	if (!devicesOk) {
		alert('Required device access was denied. Please enable it in your browser settings.')
		emit('exit')
		return
	}
	loadingProgress.value = 90

	// 5. Build scenes.
	sessionScenes.value = activeSession.value.scenes.map(
		s => new Scene(s, { skipBehaviors: !biofeedbackEnabled.value, devices: defaultDeviceContext }),
	)
	console.log('[Theater] Scenes Prepared:', sessionScenes.value.length)

	loadingProgress.value = 100

	// 6. Begin-session gate (fullscreen prompt, non-embedded).
	if (!props.embedded && !document.fullscreenElement) {
		loadingMessage.value = 'Session Ready'
		showBeginButton.value = true

		await new Promise<void>(resolve => {
			const unwatch = watch(showBeginButton, val => {
				if (!val) { unwatch(); resolve() }
			})
		})
		loadingMessage.value = 'Preparing Session'
	}

	// 7. Kick off scene 0.
	setTimeout(() => {
		showLoadingContent.value = false
		setTimeout(() => {
			console.log('[Theater] Starting first scene')
			nextScene(0)
		}, 1200 / playbackSpeed.value)
	}, 500 / playbackSpeed.value)
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

onMounted(async () => {
	if (props.program) {
		activeSession.value = props.program
	} else if (props.sessionSlug) {
		try {
			activeSession.value = await sessionsApi.get(props.sessionSlug)
		} catch (e) {
			console.error(`[Theater] Failed to load session ${props.sessionSlug}`, e)
			exitSession()
			return
		}
	}

	if (!activeSession.value) { exitSession(); return }

	try {
		const list = await sessionsApi.list({ status: 'published', limit: 200 })
		FULL_SESSIONS.value = list.items.filter(s => s.slug !== 'initial-training-short')
	} catch (e) {
		console.warn('[Theater] Failed to load session list', e)
	}

	if (props.initialMuted) {
		try { audio.setMasterVolume(0) } catch {}
	}

	if (!props.embedded) {
		try { document.documentElement.requestFullscreen().catch(() => {}) } catch {}
	}

	initSession()

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') exitSession()
	}
	window.addEventListener('keydown', handleKeyDown)
})

// ---------------------------------------------------------------------------
// Imperative API (for studio editor's live preview)
// ---------------------------------------------------------------------------

function jumpToScene(index: number) {
	if (index < 0 || index >= sessionScenes.value.length) return
	nextScene(index)
}

defineExpose({ jumpToScene, play: handlePlay, pause: handlePause, restart: handleRestart })
</script>

<template>
	<div
		class="overflow-hidden transition-all duration-300"
		:class="[
			embedded
				? 'relative w-full h-full'
				: 'fixed inset-0 z-40',
			controls.controlsVisible.value ? 'cursor-default' : 'cursor-none',
		]"
		:style="{
			'--speed-factor': playbackSpeed,
			backgroundColor: currentResolvedTheme.backgroundColor || '#000',
			color: currentResolvedTheme.uiTextColor || '#fff',
		}"
		@mousemove="controls.showControls"
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
			<TheaterLoadingOverlay
				v-if="state === SessionState.INITIALIZING"
				:message="loadingMessage"
				:progress="loadingProgress"
				:show-content="showLoadingContent"
				:show-permission-request="biofeedback.showPermissionRequest.value"
				:permission-label="biofeedback.permissionLabel.value"
				:show-begin-button="showBeginButton"
				:theme="currentResolvedTheme"
				@grant-access="biofeedback.handleGrantAccess"
				@begin="handleBegin"
			/>
		</Transition>

		<!-- Selection Overlay -->
		<Transition name="selector">
			<div
				v-if="state === SessionState.SELECTION"
				style="zoom: 0.85"
				class="absolute inset-0 z-[60] flex flex-col items-center justify-center p-8 overflow-y-auto"
			>
				<div class="max-w-6xl w-full">
					<h2 class="text-3xl font-light text-content mb-12 text-center">
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
							@click="exitSession()"
							class="text-content-tertiary hover:text-content transition-colors text-sm uppercase tracking-widest"
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
						'--fade-duration': `${currentScene?.config?.fadeOutDuration || 3000}ms`
					}"
				/>
			</Transition>
		</div>

		<!-- Heads Up Display -->
		<HUD
			:state="state"
			:currentScene="currentScene"
			:score="scoring.score.value"
			@exit="exitSession"
			class="z-50"
		/>

		<Transition name="fade">
			<TransportControl
				v-if="!embedded"
				v-show="controls.controlsVisible.value && state !== SessionState.SELECTION"
				:scenes="sessionScenes"
				:currentIndex="sceneIndex"
				:isPlaying="
					!isPaused && state !== SessionState.FINISHED && state !== SessionState.IDLE
				"
				:isVisible="controls.controlsVisible.value"
				:soundboardSamples="activeSession?.audio?.soundboard || []"
				:activeSoundboardIds="audio.activeSoundboardIds.value"
				:soundboardErrors="audio.soundboardErrors.value"
				:hapticStatus="haptics.connectionStatus.value"
				:hapticDeviceCount="haptics.connectedDevices.value.length"
				@play="handlePlay"
				@pause="handlePause"
				@restart="handleRestart"
				@select="nextScene"
				@menu-toggle="val => (controls.isMenuOpen.value = val)"
				@hide="controls.controlsVisible.value = false"
				@exit="exitSession"
				@toggle-soundboard="audio.toggleSoundboardSample"
				@mouseenter="controls.isHoveringControls.value = true"
				@mouseleave="controls.isHoveringControls.value = false"
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

.scene-enter-active {
	--duration-slow: calc(var(--fade-duration, 3000ms) / var(--speed-factor, 1));
	--ease-glacial: cubic-bezier(0.19, 1, 0.22, 1);

	transition: opacity var(--duration-slow) var(--ease-glacial),
		transform var(--duration-slow) var(--ease-glacial);
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.scene-leave-active {
	--duration-slow: calc(var(--fade-duration, 3000ms) / var(--speed-factor, 1));
	--ease-in-glacial: cubic-bezier(0.75, 0, 1, 1);

	transition: opacity var(--duration-slow) var(--ease-in-glacial),
		transform var(--duration-slow) var(--ease-in-glacial);
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
