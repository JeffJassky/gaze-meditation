<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudioEditorToolbar from './StudioEditorToolbar.vue'
import SceneStack, { type FocusRequest } from './SceneStack.vue'
import SessionLivePreview from './SessionLivePreview.vue'
import { useSceneSelection } from './composables/useSceneSelection'
import { useSceneHistory } from './composables/useSceneHistory'
import { useSoftDelete } from './composables/useSoftDelete'
import { useStudioShortcuts } from './composables/useStudioShortcuts'
import { useDirtyTracking } from '@/composables/useDirtyTracking'
import ToastStack from './ToastStack.vue'
import SessionSettingsPanel from './SessionSettingsPanel.vue'
import WaveformTimeline from './waveform/WaveformTimeline.vue'
import {
	sessionsApi,
	type SceneBlock,
	type Session,
	type SessionAsset,
} from '@/api/sessions'
import { assetsApi, type AssetDoc } from '@/api/assets'
import { assetUrl } from '@/utils/assetUrl'
import { listElevenLabsVoices, type ElevenLabsVoice } from '@/vendors/elevenlabs'
import { auth } from '@/state/auth'
import { VOICES_KEY } from './voicesKey'
import { AUDIO_ASSETS_KEY } from './audioAssetsKey'
import { SOUNDBOARD_SAMPLES_KEY } from './soundboardSamplesKey'
import { SCENE_CONTEXT_KEY } from './sceneContextKey'

/**
 * Top-level session editor — three-pane shell.
 *
 * Loads a session, holds it in a reactive ref, and routes slices into the
 * left rail / center stage / right inspector. Save is explicit and pushes
 * the whitelisted fields back to the API in one shot.
 *
 * Dirty tracking is a cheap JSON-diff against the last-saved snapshot —
 * plenty fast for session-sized payloads and avoids a lot of ceremony.
 */
const route = useRoute()

const session = ref<Session | null>(null)
const { dirty, markClean } = useDirtyTracking(session)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const timelineOpen = ref(false)
const justSaved = ref(false)
const focusRequest = ref<FocusRequest | null>(null)
const timelineRef = ref<InstanceType<typeof WaveformTimeline> | null>(null)

// --- Master audio ----------------------------------------------------------
const hasMasterAudio = computed(() => !!session.value?.masterAudio?.key)
const masterAudioUrl = computed(() => {
	const key = session.value?.masterAudio?.key
	return key ? assetUrl(key) : null
})

// --- Asset pool ------------------------------------------------------------
// The editor's audio picker draws from two places, merged:
//   1. Assets embedded in the current Session (those uploaded via the
//      assets drawer before a full reload).
//   2. The shared Asset collection (all of the owner's assets across every
//      session).
// Merging by `key` dedupes when the same file appears in both places.
const sharedAssets = ref<AssetDoc[]>([])
async function loadSharedAssets() {
	try {
		const pages: AssetDoc[] = []
		let page = 1
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const res = await assetsApi.list({ limit: 1000, page })
			pages.push(...res.items)
			if (!res.hasMore) break
			page++
		}
		sharedAssets.value = pages
	} catch (e) {
		console.warn('[editor] failed to load shared audio assets', e)
	}
}

const allAssets = computed<SessionAsset[]>(() => {
	const byKey = new Map<string, SessionAsset>()
	// Embedded first — those win when the same key appears in both (the
	// embedded copy may have session-specific label edits).
	for (const a of session.value?.assets ?? []) {
		byKey.set(a.key, a)
	}
	// Then the shared pool, in newest-first order.
	for (const a of sharedAssets.value) {
		if (byKey.has(a.key)) continue
		byKey.set(a.key, {
			id: a.id,
			kind: a.kind,
			key: a.key,
			label: a.label,
			contentType: a.contentType,
			size: a.size,
			meta: a.meta,
		})
	}
	return Array.from(byKey.values())
})

// Selection model — wraps a writable computed view of session.scenes so the
// composable can react to scene mutations even when session itself is null.
const scenesRef = computed<SceneBlock[]>({
	get: () => session.value?.scenes ?? [],
	set: (v) => {
		if (session.value) session.value.scenes = v
	},
})
const selection = useSceneSelection(scenesRef)
const history = useSceneHistory(session)

// --- ElevenLabs voices (provided to all descendants via inject) -------------
const voices = ref<ElevenLabsVoice[]>([])
const voicesLoading = ref(false)
const voicesError = ref<string | null>(null)
const voicesEnabled = computed(
	() => !!auth.state.user?.settings?.studio?.hasElevenlabsApiKey,
)

async function loadVoices() {
	if (!voicesEnabled.value) return
	voicesLoading.value = true
	voicesError.value = null
	try {
		voices.value = await listElevenLabsVoices()
	} catch (e) {
		voicesError.value = (e as Error).message
	} finally {
		voicesLoading.value = false
	}
}

const sessionVoiceId = computed(() => session.value?.elevenlabsVoiceId ?? undefined)
const sessionVoiceOrigin = computed(() => session.value?.voiceOrigin ?? undefined)
const sessionBinauralEnabled = computed(() => session.value?.audio?.binaural?.enabled !== false)
provide(VOICES_KEY, {
	voices,
	loading: voicesLoading,
	error: voicesError,
	enabled: voicesEnabled,
	sessionVoiceId,
	voiceOrigin: sessionVoiceOrigin,
	binauralEnabled: sessionBinauralEnabled,
})
provide(AUDIO_ASSETS_KEY, allAssets)
provide(SOUNDBOARD_SAMPLES_KEY, computed(() => session.value?.audio?.soundboard ?? []))
provide(SCENE_CONTEXT_KEY, {
	scenes: computed(() => session.value?.scenes ?? []),
	selectedIndex: computed(() => selection.selectedIndex.value),
})

async function load() {
	loading.value = true
	error.value = null
	try {
		const doc = await sessionsApi.get(String(route.params.slug))
		// Seed an empty session with a starter scene so the writer always has
		// somewhere to type. Only when voiceStructure is already chosen —
		// otherwise the voice mode picker shows first.
		if (doc.scenes.length === 0 && doc.voiceStructure) {
			doc.scenes = [
				{ id: crypto.randomUUID(), type: 'scene', label: '', config: {} },
			]
		}
		session.value = doc
		markClean()
		// Select the first scene so the inspector and preview have something
		// to render immediately.
		if (doc.scenes[0]) selection.select(doc.scenes[0].id)
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
}

async function save() {
	if (!session.value) return
	saving.value = true
	error.value = null
	try {
		const s = session.value
		const updated = await sessionsApi.update(s.id, {
			title: s.title,
			description: s.description,
			visibility: s.visibility,
			audience: s.audience,
			tags: s.tags,
			isAdult: s.isAdult,
			theme: s.theme,
			coverAssetId: s.coverAssetId,
			audio: s.audio,
			elevenlabsVoiceId: s.elevenlabsVoiceId,
			voiceOrigin: s.voiceOrigin,
			voiceStructure: s.voiceStructure,
			assets: s.assets,
			scenes: s.scenes,
			settings: s.settings,
			masterAudio: s.masterAudio,
		})
		session.value = updated
		markClean()
		// Reset history baseline so undo can't cross the save boundary —
		// crossing it would silently re-dirty the doc against the server.
		history.reset()
		justSaved.value = true
		setTimeout(() => {
			justSaved.value = false
		}, 1500)
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		saving.value = false
	}
}

async function togglePublish() {
	if (!session.value) return
	try {
		session.value =
			session.value.status === 'draft'
				? await sessionsApi.publish(session.value.id)
				: await sessionsApi.unpublish(session.value.id)
		markClean()
	} catch (e) {
		error.value = (e as Error).message
	}
}

function duplicateSelected() {
	if (!session.value) return
	const i = selection.selectedIndex.value
	const src = session.value.scenes[i]
	if (!src) return
	const copy: SceneBlock = {
		id: crypto.randomUUID(),
		type: src.type,
		label: src.label,
		config: JSON.parse(JSON.stringify(src.config)),
	}
	const next = session.value.scenes.slice()
	next.splice(i + 1, 0, copy)
	session.value.scenes = next
	selection.select(copy.id)
}

function deleteSelected() {
	if (!session.value) return
	const i = selection.selectedIndex.value
	if (i < 0) return
	removeSceneAt(i)
}

function duplicateAt(i: number) {
	if (!session.value) return
	const src = session.value.scenes[i]
	if (!src) return
	const copy: SceneBlock = {
		id: crypto.randomUUID(),
		type: src.type,
		label: src.label,
		config: JSON.parse(JSON.stringify(src.config)),
	}
	const next = session.value.scenes.slice()
	next.splice(i + 1, 0, copy)
	session.value.scenes = next
	selection.select(copy.id)
}

const softDelete = useSoftDelete((scene, index) => {
	if (!session.value) return
	const next = session.value.scenes.slice()
	// Clamp the original index in case the array shrank further while the
	// toast was open (other deletes, undo/redo, etc.).
	const insertAt = Math.max(0, Math.min(index, next.length))
	next.splice(insertAt, 0, scene)
	session.value.scenes = next
	selection.select(scene.id)
})

function removeSceneAt(i: number) {
	if (!session.value) return
	const scene = session.value.scenes[i]
	if (!scene) return
	const next = session.value.scenes.slice()
	next.splice(i, 1)
	session.value.scenes = next
	softDelete.enqueue(scene, i)
}

function addSceneAfter(index: number, opts: { focus?: boolean } = {}) {
	if (!session.value) return
	const newScene: SceneBlock = {
		id: crypto.randomUUID(),
		type: 'scene',
		label: '',
		config: {},
	}
	const next = session.value.scenes.slice()
	next.splice(index + 1, 0, newScene)
	session.value.scenes = next
	selection.select(newScene.id)
	if (opts.focus) focusRequest.value = { id: newScene.id, field: 'voice' }
}

/**
 * Backspace-collapse: user hit backspace in an already-empty scene. Remove
 * the scene and focus the previous scene's last non-empty field (caret at
 * end). If there's no previous scene, do nothing — we don't want the editor
 * to end up with zero scenes this way.
 */
function deleteBackwardFrom(index: number) {
	if (!session.value) return
	if (index <= 0) return
	const prev = session.value.scenes[index - 1]
	if (!prev) return
	const next = session.value.scenes.slice()
	next.splice(index, 1)
	session.value.scenes = next
	selection.select(prev.id)
	focusRequest.value = { id: prev.id, field: 'auto', atEnd: true }
}

function addSceneAtEnd() {
	if (!session.value) return
	addSceneAfter(session.value.scenes.length - 1)
}

useStudioShortcuts({
	onSave: () => {
		if (dirty.value && !saving.value) save()
	},
	onUndo: () => history.undo(),
	onRedo: () => history.redo(),
	onNext: () => selection.next(),
	onPrev: () => selection.prev(),
	onDuplicate: () => duplicateSelected(),
	onDelete: () => deleteSelected(),
	onNewScene: () => {
		if (!session.value) return
		const idx = selection.selectedIndex.value
		if (idx < 0) addSceneAtEnd()
		else addSceneAfter(idx)
	},
	onToggleMeta: () => {},
	onToggleTimeline: () => {
		timelineOpen.value = !timelineOpen.value
	},
})

onMounted(() => {
	load()
	loadVoices()
	loadSharedAssets()
})

// Reload if the route id changes (e.g. duplicate → new edit page).
watch(
	() => route.params.slug,
	(slug) => {
		if (slug) load()
	},
)

// When voiceStructure is first set (user picks a mode), seed a starter scene
// and auto-open the timeline for session-level audio.
watch(
	() => session.value?.voiceStructure,
	(vs, prev) => {
		if (!vs || prev) return // only react to the initial choice
		if (!session.value) return
		if (session.value.scenes.length === 0) {
			session.value.scenes = [
				{ id: crypto.randomUUID(), type: 'scene', label: '', config: {} },
			]
			selection.select(session.value.scenes[0]!.id)
		}
		if (vs === 'session') timelineOpen.value = true
	},
)
</script>

<template>
	<div class="h-screen w-full bg-surface text-content flex flex-col">
			<StudioEditorToolbar
				:session="session"
				:dirty="dirty"
				:saving="saving"
				:can-undo="history.canUndo.value"
				:can-redo="history.canRedo.value"
				:just-saved="justSaved"
				@save="save"
				@undo="history.undo"
				@redo="history.redo"
				@publish="togglePublish"
				@unpublish="togglePublish"
				@update-title="(t) => session && (session.title = t)"
				/>

			<div
				v-if="error"
				class="px-4 py-2 text-sm text-danger border-b border-edge">
				{{ error }}
			</div>

			<div
				v-if="loading"
				class="flex-1 flex items-center justify-center text-content-tertiary text-sm">
				Loading…
			</div>

			<div
				v-else-if="session"
				class="flex-1 flex flex-col min-h-0">
				<div class="flex-1 flex min-h-0">
					<SessionSettingsPanel
						v-model="session"
						:preview-session="session"
						:preview-selected-id="selection.selectedId.value"
						:preview-selected-index="selection.selectedIndex.value" />

					<SceneStack
						class="flex-1 min-w-0"
						v-model="session.scenes"
						v-model:session="session"
						:selected-id="selection.selectedId.value"
						:focus-request="focusRequest"
						@select="selection.select"
						@deselect="selection.deselect"
						@duplicate="duplicateAt"
						@remove="removeSceneAt"
						@advance="(i) => addSceneAfter(i, { focus: true })"
						@delete-backward="deleteBackwardFrom"
						@focus-consumed="focusRequest = null" />

				</div>

				<!-- Timeline (collapsible) -->
				<div class="border-t border-edge flex flex-col shrink-0">
					<div
						class="h-7 flex items-center gap-2 px-3 text-xs text-content-tertiary cursor-pointer hover:text-content transition"
						@click="timelineOpen = !timelineOpen">
						<svg
							width="12" height="12" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
							class="shrink-0 transition-transform duration-200"
							:class="timelineOpen ? 'rotate-180' : ''">
							<polyline points="6 9 12 15 18 9" />
						</svg>
						<span class="text-[10px] uppercase tracking-wider">Timeline</span>

						<!-- Inline toolbar (only when open) -->
						<template v-if="timelineOpen && timelineRef">
							<template v-if="timelineRef.isMasterMode">
								<button
									type="button"
									class="ml-2 text-base leading-none hover:text-content transition"
									:disabled="!timelineRef.isReady"
									:title="timelineRef.isPlaying ? 'Pause' : 'Play'"
									@click.stop="timelineRef.togglePlayback">
									{{ timelineRef.isPlaying ? '⏸' : '▶' }}
								</button>
								<span class="text-[10px] tabular-nums">
									{{ timelineRef.fmt(timelineRef.currentTime) }} / {{ timelineRef.fmt(timelineRef.duration) }}
								</span>
								<div class="flex-1" />
								<button
									type="button"
									class="text-[10px] hover:text-content transition"
									:disabled="!timelineRef.isReady"
									@click.stop="timelineRef.distributeEvenly">
									Distribute evenly
								</button>
								<button
									type="button"
									class="text-[10px] hover:text-content transition"
									:disabled="!timelineRef.isReady || !timelineRef.decodedBuffer"
									@click.stop="timelineRef.autoSplit">
									Auto-split
								</button>
								<button
									type="button"
									class="text-[10px] hover:text-content transition opacity-50"
									:disabled="!timelineRef.isReady"
									@click.stop="timelineRef.clearRegions">
									Clear
								</button>
							</template>
							<template v-else>
								<span class="ml-2 text-[10px]">
									{{ session!.scenes.length }} scene{{ session!.scenes.length === 1 ? '' : 's' }}
								</span>
								<span class="text-[10px] tabular-nums">
									~{{ timelineRef.fmt(timelineRef.totalPerSceneDuration) }}
								</span>
								<div class="flex-1" />
							</template>
						</template>
					</div>
					<WaveformTimeline
						v-if="timelineOpen"
						ref="timelineRef"
						v-model="session.scenes"
						:audio-url="masterAudioUrl"
						:selected-id="selection.selectedId.value"
						@select="selection.select"
						@update:duration="(d) => { if (session!.masterAudio) session!.masterAudio.duration = d }" />
				</div>
			</div>

		<ToastStack
			:pending="softDelete.pending.value"
			:window-ms="softDelete.UNDO_WINDOW_MS"
			@undo="softDelete.undo" />

	</div>
</template>

