<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import StudioShell from '@new/components/ui/StudioShell.vue'
import { su } from '@new/components/ui/studioUi'
import { playlistsApi, type PlaylistDoc } from '@/services/playlists'

const router = useRouter()

const items = ref<PlaylistDoc[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

async function load() {
	loading.value = true
	error.value = null
	try {
		const res = await playlistsApi.list({ mine: true, limit: 100 })
		items.value = res.items
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
}
onMounted(load)

// Playlists are typically a small list — local filter is fine.
const filtered = computed(() => {
	const q = search.value.trim().toLowerCase()
	if (!q) return items.value
	return items.value.filter(
		(p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
	)
})

async function createNew() {
	try {
		const doc = await playlistsApi.create({ title: 'Untitled playlist' })
		router.push(`/studio/playlists/${doc.id}`)
	} catch (e) {
		error.value = (e as Error).message
	}
}

async function remove(p: PlaylistDoc) {
	if (!confirm(`Delete "${p.title}"?`)) return
	await playlistsApi.delete(p.id)
	items.value = items.value.filter((x) => x.id !== p.id)
}
</script>

<template>
	<StudioShell>
		<div :class="su.container">
			<div :class="su.header">
				<div>
					<h1 :class="su.h1">Playlists</h1>
					<p class="text-sm text-zinc-400 mt-1">Group your sessions into shareable lists.</p>
				</div>
				<button :class="su.btn" @click="createNew">+ New playlist</button>
			</div>

			<div :class="[su.card, '!p-4']">
				<input v-model="search" :class="su.input" placeholder="Search playlists…" />
			</div>

			<div v-if="error" :class="[su.error, 'mb-6']">{{ error }}</div>

			<div v-if="loading && items.length === 0" class="text-zinc-500 text-sm py-12 text-center">
				Loading…
			</div>
			<div v-else-if="filtered.length === 0" class="text-zinc-500 text-sm py-12 text-center">
				No playlists yet.
			</div>

			<div v-else class="grid gap-3">
				<div
					v-for="p in filtered"
					:key="p.id"
					class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-start gap-4 hover:border-zinc-700 transition">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<RouterLink
								:to="`/studio/playlists/${p.id}`"
								class="font-medium text-zinc-100 hover:text-white truncate">
								{{ p.title }}
							</RouterLink>
							<span :class="p.visibility === 'public' ? su.badgePublic : su.badgePrivate">
								{{ p.visibility }}
							</span>
						</div>
						<p v-if="p.description" class="text-sm text-zinc-400 line-clamp-1">
							{{ p.description }}
						</p>
						<div class="text-xs text-zinc-500 mt-2">{{ p.sessions.length }} sessions</div>
					</div>
					<button :class="su.btnDanger" @click="remove(p)">Delete</button>
				</div>
			</div>
		</div>
	</StudioShell>
</template>
