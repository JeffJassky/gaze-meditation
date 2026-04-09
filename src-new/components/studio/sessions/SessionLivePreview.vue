<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import Theater from '@/components/Theater.vue'
import { audioSession } from '@/services/audio'
import type { Session as LegacySession } from '@/types'
import type { SessionDoc } from '@/services/sessions'
import { sessionDocToLegacy } from '@/utils/sessionAdapter'
import PreviewPermissionGate from './PreviewPermissionGate.vue'

/**
 * Live miniature Theatre embedded in the session editor.
 *
 * ── Boundary with Theater ─────────────────────────────────────────────────
 * Theater is a black box from here. We never read its internal refs. The
 * ONLY contact surface is:
 *
 *   props  →  program, embedded, initialMuted
 *   emits  ←  scene-change(index), playing-change(bool)
 *   methods (via ref) → jumpToScene(i), play(), pause(), restart()
 *
 * All display state for the transport (currentIndex, isPlaying, sceneCount)
 * lives locally in this component and is updated exclusively from Theater's
 * emitted events. That way the transport stays in sync whether the user
 * clicked a button here, scrolled a scene in the editor, or (if ever
 * re-enabled) touched Theater's own internal transport.
 *
 * ── Boundary with the editor ──────────────────────────────────────────────
 * The editor passes in `session`, `selectedId`, `selectedIndex`. We react to
 * selection changes by calling Theater.jumpToScene. We never call back into
 * the editor — preview→editor sync is an explicit v2 feature.
 */
const props = defineProps<{
	session: SessionDoc
	selectedId: string | null
	selectedIndex: number
}>()

// ──────────────────────────────────────────────────────────────────────────
// Audio muting
// ──────────────────────────────────────────────────────────────────────────
// Mute master bus synchronously in setup() so nothing leaks before Theater
// has even mounted. onBeforeUnmount restores the volume.
try {
	audioSession.setMasterVolume(0)
} catch (e) {
	/* audio context not yet initialised — Theater will apply initialMuted on mount */
}
const isMuted = ref(true)
function toggleMute() {
	isMuted.value = !isMuted.value
	try {
		audioSession.setMasterVolume(isMuted.value ? 0 : 1)
	} catch (e) {
		console.warn('[SessionLivePreview] setMasterVolume failed', e)
	}
}
onBeforeUnmount(() => {
	try {
		audioSession.setMasterVolume(1)
	} catch (e) {
		/* ignore */
	}
})

// ──────────────────────────────────────────────────────────────────────────
// SessionDoc → legacy Session conversion (shared with Theater)
// ──────────────────────────────────────────────────────────────────────────
const legacySession = computed<LegacySession>(() =>
	sessionDocToLegacy(props.session),
)

// ──────────────────────────────────────────────────────────────────────────
// Biofeedback opt-in
// ──────────────────────────────────────────────────────────────────────────
// Off by default — enabling triggers a Theater remount (via sessionKey)
// which runs initSession with device acquisition + behavior wiring.
const biofeedbackEnabled = ref(false)
const showPermissionGate = ref(false)

function toggleBiofeedback() {
	if (biofeedbackEnabled.value) {
		biofeedbackEnabled.value = false
		return
	}
	// Turning on — let the gate scan requirements and request permissions.
	// If no devices are needed it'll emit 'granted' synchronously.
	showPermissionGate.value = true
}
function onPermissionGranted() {
	showPermissionGate.value = false
	biofeedbackEnabled.value = true
}
function onPermissionCancel() {
	showPermissionGate.value = false
}

// Re-mount Theater when:
//   - the session id changes
//   - the scene structure changes (add / remove / reorder)
//   - biofeedback is toggled
//   - any behavior suggestion is edited (runtime Behavior instances are
//     built once in the Scene constructor, so they need a fresh Scene to
//     pick up a new suggestion list)
//
// Everything else (text, voice, theme, scene audio) flows through by
// reference via the Vue reactive proxy — no remount needed. Theme in
// particular is a live computed inside Theater now.
const sessionKey = computed(() => {
	const scenePart = props.session.scenes
		.map((s) => {
			const sugs = (s.config as any)?.behavior?.suggestions ?? []
			// Stringify only the stable keys that define a behavior's
			// identity. Changing a text or duration shouldn't remount —
			// only adding/removing/retyping a suggestion should.
			const sugSig = sugs
				.map((sg: any) => `${sg.type}`)
				.join(',')
			return `${s.id}[${sugs.length}:${sugSig}]`
		})
		.join('|')
	return `${props.session.id}::${scenePart}::bf=${biofeedbackEnabled.value ? 1 : 0}`
})

// ──────────────────────────────────────────────────────────────────────────
// Theater handle + locally-tracked display state
// ──────────────────────────────────────────────────────────────────────────
interface TheaterHandle {
	jumpToScene: (index: number) => void
	play: () => void
	pause: () => void
	restart: () => void
}
const theaterRef = useTemplateRef<TheaterHandle>('theater')

// Display state for the transport. These are the single source of truth for
// anything rendered in *this* component — updated exclusively via Theater's
// emitted events, never by reading Theater's internals.
const currentIndex = ref(0)
const isPlaying = ref(false)

function onSceneChange(index: number) {
	currentIndex.value = index
}
function onPlayingChange(playing: boolean) {
	isPlaying.value = playing
}

const sceneCount = computed(() => props.session.scenes.length)

// ──────────────────────────────────────────────────────────────────────────
// Transport handlers — drive Theater imperatively
// ──────────────────────────────────────────────────────────────────────────
function play() {
	theaterRef.value?.play()
}
function pause() {
	theaterRef.value?.pause()
}
function restart() {
	theaterRef.value?.restart()
}
function prev() {
	const i = currentIndex.value
	if (i > 0) theaterRef.value?.jumpToScene(i - 1)
}
function next() {
	const i = currentIndex.value
	if (i < sceneCount.value - 1) theaterRef.value?.jumpToScene(i + 1)
}

// ──────────────────────────────────────────────────────────────────────────
// Editor → preview sync
// ──────────────────────────────────────────────────────────────────────────
// When the writer selects/scrolls to a scene in the editor, jump the
// preview there. Debounced so the scroll-based IO observer can't thrash us.
let pendingJump: number | undefined
watch(
	() => props.selectedIndex,
	(idx) => {
		if (idx < 0) return
		if (pendingJump !== undefined) clearTimeout(pendingJump)
		pendingJump = window.setTimeout(() => {
			const t = theaterRef.value
			if (!t) return
			if (idx === currentIndex.value) return
			t.jumpToScene(idx)
		}, 150)
	},
)

// Re-trigger the current scene when any of its config fields are edited
// in place. Scene reads most of its state (text, voice, audio, duration,
// cooldown) from `this.config` at start(), so without this the preview
// would feel dead while typing into the scene that's currently playing.
//
// Behaviors are intentionally NOT covered here: structural behavior
// changes force a full Theater remount via `sessionKey` because Scene
// behavior instances are constructed once per Scene lifetime. Theme
// edits technically don't need a replay either — Theater's theme computed
// is reactive through the proxy — but replaying is cheap and covers
// audio/duration which really do need it.
//
// Heavy debounce so it doesn't restart on every keystroke.
let pendingReplay: number | undefined
const selectedConfigSignal = computed(() => {
	const i = props.selectedIndex
	if (i < 0) return ''
	const cfg = props.session.scenes[i]?.config as Record<string, unknown> | undefined
	if (!cfg) return ''
	// JSON the full config — but strip `audio.binaural`, which has a
	// dedicated live watcher that pushes changes straight into the
	// running binaural engine without a scene restart. Everything else
	// (text, voice, theme, duration, cooldown, audio.fx, behavior
	// options) triggers a 600ms-debounced scene restart; Scene.start()
	// rebuilds behavior instances from the current config on every
	// run so new behavior options take effect on the same restart.
	try {
		const { audio, ...rest } = cfg as any
		const audioMinusBinaural = audio
			? Object.fromEntries(
				Object.entries(audio).filter(([k]) => k !== 'binaural'),
			)
			: undefined
		return JSON.stringify({ ...rest, audio: audioMinusBinaural })
	} catch {
		return ''
	}
})
watch(selectedConfigSignal, (next, prev) => {
	if (next === prev) return
	if (pendingReplay !== undefined) clearTimeout(pendingReplay)
	pendingReplay = window.setTimeout(() => {
		const t = theaterRef.value
		if (!t) return
		if (props.selectedIndex !== currentIndex.value) return
		t.jumpToScene(currentIndex.value)
	}, 600)
})

// ──────────────────────────────────────────────────────────────────────────
// Binaural audio — fully live
// ──────────────────────────────────────────────────────────────────────────
// The binaural engine exposes imperative setters (`setBeatFrequency`,
// `setVolume`), so instead of restarting the scene we push changes
// straight into the running engine. Scene-level binaural (from the
// currently playing scene) takes precedence; otherwise we fall back to
// session-level binaural. A scene with no binaural override reverts to
// the session default.
interface BinauralSpec {
	hertz?: number
	volume?: number
}
function readBinaural(source: unknown): BinauralSpec | null {
	if (!source || typeof source !== 'object') return null
	const b = source as any
	if (b.hertz === undefined && b.volume === undefined) return null
	return { hertz: b.hertz, volume: b.volume }
}
const activeBinaural = computed<BinauralSpec | null>(() => {
	const i = currentIndex.value
	const sceneCfg = props.session.scenes[i]?.config as any
	const sceneBin = readBinaural(sceneCfg?.audio?.binaural)
	if (sceneBin) return sceneBin
	const sessionBin = readBinaural((props.session.audio as any)?.binaural)
	return sessionBin
})
watch(
	activeBinaural,
	(spec) => {
		if (!spec) return
		if (!audioSession.binaural.isActive) return
		try {
			if (spec.hertz !== undefined && Number.isFinite(spec.hertz)) {
				audioSession.binaural.setBeatFrequency(spec.hertz)
			}
			if (spec.volume !== undefined && Number.isFinite(spec.volume)) {
				audioSession.binaural.setVolume(spec.volume)
			}
		} catch (e) {
			console.warn('[SessionLivePreview] binaural live-update failed', e)
		}
	},
	{ deep: true },
)

// ──────────────────────────────────────────────────────────────────────────
// Orientation (landscape ↔ portrait) + scaling
// ──────────────────────────────────────────────────────────────────────────
type Orientation = 'landscape' | 'portrait'
const orientation = ref<Orientation>('landscape')

const STAGE_MAX_WIDTH = 320
const STAGE_MAX_HEIGHT = 360

const stageStyle = computed(() => {
	const nominal =
		orientation.value === 'landscape' ? { w: 960, h: 540 } : { w: 540, h: 960 }
	const scale = Math.min(STAGE_MAX_WIDTH / nominal.w, STAGE_MAX_HEIGHT / nominal.h)
	return {
		box: {
			width: `${Math.round(nominal.w * scale)}px`,
			height: `${Math.round(nominal.h * scale)}px`,
		},
		inner: {
			width: `${nominal.w}px`,
			height: `${nominal.h}px`,
			transform: `scale(${scale})`,
			transformOrigin: 'top left',
		},
	}
})

</script>

<template>
	<div class="bg-black border-b border-zinc-800">
		<!-- Permission gate takes over the preview area while active, at
		     editor-native size rather than squashed into the scaled stage. -->
		<PreviewPermissionGate
			v-if="showPermissionGate"
			:session="session"
			@granted="onPermissionGranted"
			@cancel="onPermissionCancel" />
		<div v-else class="flex justify-center px-4 pt-4">
			<div
				class="relative overflow-hidden rounded-md bg-black ring-1 ring-zinc-800"
				:style="stageStyle.box">
				<div class="absolute top-0 left-0" :style="stageStyle.inner">
					<Theater
						:key="sessionKey"
						ref="theater"
						:program="legacySession"
						embedded
						:enable-biofeedback="biofeedbackEnabled"
						:initial-muted="true"
						@scene-change="onSceneChange"
						@playing-change="onPlayingChange" />
				</div>
			</div>
		</div>

		<!-- Transport -->
		<div class="flex items-center justify-between gap-2 px-3 py-2 text-zinc-400">
			<div class="flex items-center gap-1">
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100"
					title="Restart"
					@click="restart">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</svg>
				</button>
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-30"
					title="Previous scene"
					:disabled="currentIndex === 0"
					@click="prev">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="19 20 9 12 19 4" />
						<rect x="5" y="5" width="2" height="14" />
					</svg>
				</button>
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100"
					:title="isPlaying ? 'Pause' : 'Play'"
					@click="isPlaying ? pause() : play()">
					<svg
						v-if="isPlaying"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="currentColor">
						<rect x="6" y="4" width="4" height="16" />
						<rect x="14" y="4" width="4" height="16" />
					</svg>
					<svg
						v-else
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="currentColor">
						<polygon points="5 3 19 12 5 21" />
					</svg>
				</button>
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-30"
					title="Next scene"
					:disabled="currentIndex >= sceneCount - 1"
					@click="next">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5 4 15 12 5 20" />
						<rect x="17" y="5" width="2" height="14" />
					</svg>
				</button>
			</div>

			<div class="text-[10px] font-mono tabular-nums text-zinc-500">
				{{ currentIndex + 1 }} / {{ sceneCount }}
			</div>

			<div class="flex items-center gap-1">
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100"
					:class="biofeedbackEnabled ? 'text-emerald-400 hover:text-emerald-300' : ''"
					:title="
						biofeedbackEnabled
							? 'Biofeedback enabled — click to disable'
							: 'Enable biofeedback (camera / microphone)'
					"
					@click="toggleBiofeedback">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
					</svg>
				</button>
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100"
					:title="
						orientation === 'landscape' ? 'Switch to portrait' : 'Switch to landscape'
					"
					@click="orientation = orientation === 'landscape' ? 'portrait' : 'landscape'">
					<svg
						v-if="orientation === 'landscape'"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<rect x="2" y="6" width="20" height="12" rx="2" />
					</svg>
					<svg
						v-else
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<rect x="6" y="2" width="12" height="20" rx="2" />
					</svg>
				</button>
				<button
					type="button"
					class="p-1.5 rounded hover:bg-zinc-900 hover:text-zinc-100"
					:title="isMuted ? 'Unmute' : 'Mute'"
					@click="toggleMute">
					<svg
						v-if="isMuted"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
						<line x1="23" y1="9" x2="17" y2="15" />
						<line x1="17" y1="9" x2="23" y2="15" />
					</svg>
					<svg
						v-else
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
					</svg>
				</button>
			</div>
		</div>
	</div>
</template>
