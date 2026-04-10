<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import StudioShell from '@/components/ui/StudioShell.vue'
import { su } from '@/components/ui/studioUi'
import PlaylistSessionPicker from './PlaylistSessionPicker.vue'
import { useDirtyTracking } from '@/composables/useDirtyTracking'
import { playlistsApi, type PlaylistDoc } from '@/api/playlists'
import type { Session } from '@/api/sessions'

/**
 * Playlist editor: metadata card + ordered session list with drag/drop.
 * Uses ?populate=1 on load so we can render full session cards without a
 * second round-trip. Save pushes metadata + ordering back in one PATCH.
 */
const route = useRoute()

const playlist = ref<PlaylistDoc | null>(null)
const sessionsById = ref(new Map<string, Session>())
const { dirty, markClean } = useDirtyTracking(playlist)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const pickerOpen = ref(false)

async function load() {
	loading.value = true
	try {
		const p = await playlistsApi.get(String(route.params.id), true)
		playlist.value = p
		sessionsById.value = new Map((p.sessionDocs ?? []).map((s) => [s.id, s]))
		markClean()
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
}

async function save() {
	if (!playlist.value) return
	saving.value = true
	try {
		const p = playlist.value
		const updated = await playlistsApi.update(p.id, {
			title: p.title,
			description: p.description,
			visibility: p.visibility,
			sessions: p.sessions,
		})
		playlist.value = { ...updated, sessionDocs: p.sessionDocs }
		markClean()
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		saving.value = false
	}
}

function onPick(s: Session) {
	if (!playlist.value) return
	if (!playlist.value.sessions.includes(s.id)) {
		playlist.value.sessions = [...playlist.value.sessions, s.id]
		sessionsById.value.set(s.id, s)
	}
	pickerOpen.value = false
}

function remove(sessionId: string) {
	if (!playlist.value) return
	playlist.value.sessions = playlist.value.sessions.filter((id) => id !== sessionId)
}

// --- Drag/drop reorder ---
const dragIndex = ref<number | null>(null)
function onDragStart(i: number) {
	dragIndex.value = i
}
function onDrop(target: number) {
	if (!playlist.value || dragIndex.value === null || dragIndex.value === target) return
	const arr = playlist.value.sessions.slice()
	const [moved] = arr.splice(dragIndex.value, 1)
	if (!moved) return
	arr.splice(target, 0, moved)
	playlist.value.sessions = arr
	dragIndex.value = null
}

onMounted(() => {
	load()
})
</script>

<template>
	<StudioShell>
		<div :class="su.container">
			<div :class="su.header">
				<div>
					<RouterLink to="/studio/playlists" class="text-sm text-zinc-400 hover:text-white">
						← Playlists
					</RouterLink>
					<h1 :class="[su.h1, 'mt-1']">
						{{ playlist?.title || (loading ? 'Loading…' : 'Playlist') }}
					</h1>
					<p class="text-xs text-zinc-500 mt-1">
						<span v-if="dirty" class="text-amber-300">Unsaved changes</span>
						<span v-else-if="playlist">All changes saved</span>
					</p>
				</div>
				<button :class="su.btn" :disabled="saving || !dirty || !playlist" @click="save">
					{{ saving ? 'Saving…' : 'Save' }}
				</button>
			</div>

			<div v-if="error" :class="[su.error, 'mb-6']">{{ error }}</div>

			<div v-if="loading" class="text-zinc-500 text-sm py-12 text-center">Loading…</div>

			<template v-else-if="playlist">
				<section :class="su.card">
					<h2 :class="[su.h2, 'mb-4']">Playlist details</h2>
					<div class="grid gap-4">
						<div>
							<label :class="su.label">Title</label>
							<input v-model="playlist.title" :class="su.input" />
						</div>
						<div>
							<label :class="su.label">Description</label>
							<textarea
								v-model="playlist.description"
								:class="[su.textarea, 'min-h-[80px] !font-sans !text-base']" />
						</div>
						<div class="max-w-xs">
							<label :class="su.label">Visibility</label>
							<select v-model="playlist.visibility" :class="su.select">
								<option value="private">Private</option>
								<option value="public">Public</option>
							</select>
						</div>
					</div>
				</section>

				<section :class="su.card">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h2 :class="su.h2">Sessions</h2>
							<p class="text-xs text-zinc-500 mt-1">Drag to reorder.</p>
						</div>
						<button :class="su.btn" @click="pickerOpen = true">+ Add sessions</button>
					</div>

					<div
						v-if="playlist.sessions.length === 0"
						class="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-lg">
						No sessions yet.
					</div>

					<div v-else class="grid gap-2">
						<div
							v-for="(sid, i) in playlist.sessions"
							:key="sid"
							class="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-3"
							:draggable="true"
							@dragstart="onDragStart(i)"
							@dragover.prevent
							@drop.prevent="onDrop(i)">
							<span class="cursor-grab active:cursor-grabbing text-zinc-500">⋮⋮</span>
							<span class="text-xs font-mono text-zinc-500 w-6 text-right">{{ i + 1 }}</span>
							<div class="flex-1 min-w-0">
								<div class="text-sm text-zinc-100 truncate">
									{{ sessionsById.get(sid)?.title || sid }}
								</div>
								<div class="text-xs text-zinc-500 truncate">
									{{ sessionsById.get(sid)?.description || '' }}
								</div>
							</div>
							<button :class="su.btnDanger" @click="remove(sid)">Remove</button>
						</div>
					</div>
				</section>
			</template>
		</div>

		<PlaylistSessionPicker
			v-if="pickerOpen && playlist"
			:exclude-ids="playlist.sessions"
			@pick="onPick"
			@close="pickerOpen = false" />
	</StudioShell>
</template>
