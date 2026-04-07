<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import StudioShell from '@new/components/ui/StudioShell.vue'
import { su } from '@new/components/ui/studioUi'
import SessionDetailsPanel from './SessionDetailsPanel.vue'
import SessionAssetsPanel from './SessionAssetsPanel.vue'
import SceneList from './SceneList.vue'
import { sessionsApi, type SessionDoc } from '@/services/sessions'
import { listElevenLabsVoices, type ElevenLabsVoice } from '@/services/elevenlabs'
import { auth } from '@/state/auth'
import { VOICES_KEY } from './voicesKey'

/**
 * Top-level session editor. Loads a session, holds it in a reactive ref, and
 * passes slices down to focused sub-panels via v-model. Save is explicit and
 * pushes the whitelisted fields back to the API in one shot.
 *
 * Dirty tracking is a cheap JSON-diff against the last-saved snapshot —
 * plenty fast for session-sized payloads and avoids a lot of ceremony.
 */
const route = useRoute()

const session = ref<SessionDoc | null>(null)
const snapshot = ref<string>('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const dirty = computed(() =>
	session.value ? JSON.stringify(session.value) !== snapshot.value : false,
)

const audioAssets = computed(() => session.value?.assets.filter((a) => a.kind === 'audio') ?? [])

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

provide(VOICES_KEY, {
	voices,
	loading: voicesLoading,
	error: voicesError,
	enabled: voicesEnabled,
})

async function load() {
	loading.value = true
	error.value = null
	try {
		session.value = await sessionsApi.get(String(route.params.id))
		snapshot.value = JSON.stringify(session.value)
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
		snapshot.value = JSON.stringify(updated)
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
		snapshot.value = JSON.stringify(session.value)
	} catch (e) {
		error.value = (e as Error).message
	}
}

// Warn on accidental close/navigation when unsaved.
function onBeforeUnload(e: BeforeUnloadEvent) {
	if (dirty.value) {
		e.preventDefault()
		e.returnValue = ''
	}
}
onMounted(() => {
	load()
	loadVoices()
	window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

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
		<div :class="su.container">
			<div :class="su.header">
				<div>
					<RouterLink to="/studio/sessions" class="text-sm text-zinc-400 hover:text-white">
						← Sessions
					</RouterLink>
					<h1 :class="[su.h1, 'mt-1']">
						{{ session?.title || (loading ? 'Loading…' : 'Session') }}
					</h1>
					<p class="text-xs text-zinc-500 mt-1">
						<span v-if="dirty" class="text-amber-300">Unsaved changes</span>
						<span v-else-if="session">All changes saved</span>
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						:class="su.btn"
						:disabled="saving || !dirty || !session"
						@click="save">
						{{ saving ? 'Saving…' : 'Save' }}
					</button>
				</div>
			</div>

			<div v-if="error" :class="[su.error, 'mb-6']">{{ error }}</div>

			<div v-if="loading" class="text-zinc-500 text-sm py-12 text-center">Loading…</div>

			<template v-else-if="session">
				<SessionDetailsPanel
					v-model="session"
					@publish="togglePublish"
					@unpublish="togglePublish" />

				<SessionAssetsPanel v-model="session" />

				<SceneList v-model="session.scenes" :audio-assets="audioAssets" />
			</template>
		</div>
	</StudioShell>
</template>
