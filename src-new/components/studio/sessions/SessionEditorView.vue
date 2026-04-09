<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudioShell from '@new/components/ui/StudioShell.vue'
import StudioEditorToolbar from './StudioEditorToolbar.vue'
import SessionMetaDrawer from './SessionMetaDrawer.vue'
import SceneStack, { type FocusRequest } from './SceneStack.vue'
import SceneInspector from './SceneInspector.vue'
import SessionLivePreview from './SessionLivePreview.vue'
import { useSceneSelection } from './composables/useSceneSelection'
import { useSceneHistory } from './composables/useSceneHistory'
import { useSoftDelete } from './composables/useSoftDelete'
import { useStudioShortcuts } from './composables/useStudioShortcuts'
import { useDirtyTracking } from '@new/composables/useDirtyTracking'
import ToastStack from './ToastStack.vue'
import {
	sessionsApi,
	type SceneBlock,
	type Session,
	type SessionAsset,
} from '@/services/sessions'
import { assetsApi, type AssetDoc } from '@/services/assets'
import { listElevenLabsVoices, type ElevenLabsVoice } from '@/services/elevenlabs'
import { auth } from '@/state/auth'
import { VOICES_KEY } from './voicesKey'

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
const metaDrawerOpen = ref(false)
const justSaved = ref(false)
const focusRequest = ref<FocusRequest | null>(null)

// --- Asset pool ------------------------------------------------------------
// The editor's audio picker draws from two places, merged:
//   1. Assets embedded in the current Session (those uploaded via the
//      assets drawer before a full reload).
//   2. The shared Asset collection (all of the owner's assets across every
//      session).
// Merging by `key` dedupes when the same file appears in both places.
const sharedAudioAssets = ref<AssetDoc[]>([])
async function loadSharedAudioAssets() {
	try {
		// Paginate through in case there are many. The server caps limit at 1000
		// per page, which is plenty for any realistic library.
		const pages: AssetDoc[] = []
		let page = 1
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const res = await assetsApi.list({ kind: 'audio', limit: 1000, page })
			pages.push(...res.items)
			if (!res.hasMore) break
			page++
		}
		sharedAudioAssets.value = pages
	} catch (e) {
		console.warn('[editor] failed to load shared audio assets', e)
	}
}

const audioAssets = computed<SessionAsset[]>(() => {
	const byKey = new Map<string, SessionAsset>()
	// Embedded first — those win when the same key appears in both (the
	// embedded copy may have session-specific label edits).
	for (const a of session.value?.assets ?? []) {
		if (a.kind !== 'audio') continue
		byKey.set(a.key, a)
	}
	// Then the shared pool, in newest-first order.
	for (const a of sharedAudioAssets.value) {
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
provide(VOICES_KEY, {
	voices,
	loading: voicesLoading,
	error: voicesError,
	enabled: voicesEnabled,
	sessionVoiceId,
})

async function load() {
	loading.value = true
	error.value = null
	try {
		const doc = await sessionsApi.get(String(route.params.id))
		// Seed an empty session with a starter scene so the writer always has
		// somewhere to type. Not saved until the user actually hits Save, so a
		// pristine untouched session won't get written back with a blank scene.
		if (doc.scenes.length === 0) {
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
			assets: s.assets,
			scenes: s.scenes,
			settings: s.settings,
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
	onToggleMeta: () => {
		metaDrawerOpen.value = !metaDrawerOpen.value
	},
})

onMounted(() => {
	load()
	loadVoices()
	loadSharedAudioAssets()
})

// Reload if the route id changes (e.g. duplicate → new edit page).
watch(
	() => route.params.id,
	(id) => {
		if (id) load()
	},
)
</script>

<template>
	<StudioShell>
		<div class="h-[calc(100vh-3.5rem)] flex flex-col">
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
				@open-meta="metaDrawerOpen = true" />

			<div
				v-if="error"
				class="px-4 py-2 text-sm text-red-400 border-b border-zinc-800">
				{{ error }}
			</div>

			<div
				v-if="loading"
				class="flex-1 flex items-center justify-center text-zinc-500 text-sm">
				Loading…
			</div>

			<div
				v-else-if="session"
				class="flex-1 grid grid-cols-[1fr_360px] min-h-0">
				<SceneStack
					v-model="session.scenes"
					v-model:session="session"
					:selected-id="selection.selectedId.value"
					:focus-request="focusRequest"
					@select="selection.select"
					@duplicate="duplicateAt"
					@remove="removeSceneAt"
					@advance="(i) => addSceneAfter(i, { focus: true })"
					@delete-backward="deleteBackwardFrom"
					@focus-consumed="focusRequest = null" />

				<div class="flex flex-col min-h-0 border-l border-zinc-800 bg-zinc-950/80">
					<SessionLivePreview
						class="shrink-0"
						:session="session"
						:selected-id="selection.selectedId.value"
						:selected-index="selection.selectedIndex.value" />
					<SceneInspector
						v-if="selection.selectedScene.value"
						v-model="session.scenes[selection.selectedIndex.value]"
						:audio-assets="audioAssets"
						class="flex-1 min-h-0" />
					<div v-else class="flex-1" />
				</div>
			</div>
		</div>

		<ToastStack
			:pending="softDelete.pending.value"
			:window-ms="softDelete.UNDO_WINDOW_MS"
			@undo="softDelete.undo" />

		<SessionMetaDrawer
			v-if="session"
			v-model:open="metaDrawerOpen"
			v-model:session="session" />
	</StudioShell>
</template>

