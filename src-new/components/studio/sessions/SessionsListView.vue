<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StudioShell from '@new/components/ui/StudioShell.vue'
import { su } from '@new/components/ui/studioUi'
import { sessionsApi, type SessionDoc, type SessionStatus } from '@/services/sessions'

const router = useRouter()

// --- Query state -------------------------------------------------------------

const search = ref('')
const audienceFilter = ref('')
const statusFilter = ref<'' | SessionStatus>('')
const visibilityFilter = ref<'' | 'private' | 'public'>('')
const sortBy = ref<'updated' | 'title'>('updated')
const groupBy = ref<'none' | 'status' | 'audience' | 'visibility'>('none')

const items = ref<SessionDoc[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// --- Fetch -------------------------------------------------------------------

async function load() {
	loading.value = true
	error.value = null
	try {
		// Server supports `q`, `audience`, `status`. We fetch the user's own
		// sessions (mine=1) and filter visibility client-side since it's cheap.
		const res = await sessionsApi.list({
			mine: true,
			q: search.value.trim() || undefined,
			audience: audienceFilter.value || undefined,
			status: statusFilter.value || undefined,
			limit: 100,
		})
		items.value = res.items
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
}

onMounted(load)

// Debounced reload on search input so we don't hammer the server.
let searchTimer: number | undefined
watch(search, () => {
	if (searchTimer) window.clearTimeout(searchTimer)
	searchTimer = window.setTimeout(load, 250)
})
watch([audienceFilter, statusFilter], load)

// --- Local filtering, sorting, grouping --------------------------------------

const filtered = computed(() => {
	let rows = items.value.slice()
	if (visibilityFilter.value) {
		rows = rows.filter((s) => s.visibility === visibilityFilter.value)
	}
	if (sortBy.value === 'title') {
		rows.sort((a, b) => a.title.localeCompare(b.title))
	} else {
		rows.sort(
			(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		)
	}
	return rows
})

const grouped = computed(() => {
	if (groupBy.value === 'none') return [{ label: '', items: filtered.value }]
	const map = new Map<string, SessionDoc[]>()
	for (const s of filtered.value) {
		const key =
			groupBy.value === 'status'
				? s.status
				: groupBy.value === 'audience'
					? s.audience
					: s.visibility
		const arr = map.get(key) ?? []
		arr.push(s)
		map.set(key, arr)
	}
	return Array.from(map.entries())
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([label, items]) => ({ label, items }))
})

// --- Actions -----------------------------------------------------------------

async function createNew() {
	try {
		const doc = await sessionsApi.create({ title: 'Untitled session' })
		router.push(`/studio/sessions/${doc.id}`)
	} catch (e) {
		error.value = (e as Error).message
	}
}

async function duplicate(s: SessionDoc) {
	const copy = await sessionsApi.create({
		title: `${s.title} (copy)`,
		description: s.description,
		audience: s.audience,
		tags: s.tags,
		theme: s.theme,
		audio: s.audio,
		scenes: s.scenes,
		assets: s.assets,
		isAdult: s.isAdult,
	})
	router.push(`/studio/sessions/${copy.id}`)
}

async function remove(s: SessionDoc) {
	if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return
	await sessionsApi.delete(s.id)
	items.value = items.value.filter((x) => x.id !== s.id)
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}
</script>

<template>
	<StudioShell>
		<div :class="su.container">
			<div :class="su.header">
				<div>
					<h1 :class="su.h1">Sessions</h1>
					<p class="text-sm text-zinc-400 mt-1">Create, manage, and publish your sessions.</p>
				</div>
				<button :class="su.btn" @click="createNew">+ New session</button>
			</div>

			<!-- Toolbar -->
			<div :class="[su.card, '!p-4']">
				<div class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3">
					<input
						v-model="search"
						:class="su.input"
						placeholder="Search title, description, tags…" />

					<select v-model="audienceFilter" :class="su.select">
						<option value="">All audiences</option>
						<option value="f4a">f4a</option>
						<option value="m4a">m4a</option>
						<option value="m4f">m4f</option>
						<option value="m4m">m4m</option>
						<option value="f4f">f4f</option>
						<option value="f4m">f4m</option>
						<option value="t4a">t4a</option>
						<option value="t4f">t4f</option>
						<option value="t4m">t4m</option>
						<option value="unspecified">unspecified</option>
					</select>

					<select v-model="statusFilter" :class="su.select">
						<option value="">Any status</option>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>

					<select v-model="visibilityFilter" :class="su.select">
						<option value="">Any visibility</option>
						<option value="private">Private</option>
						<option value="public">Public</option>
					</select>

					<select v-model="sortBy" :class="su.select">
						<option value="updated">Recently updated</option>
						<option value="title">Title A–Z</option>
					</select>

					<select v-model="groupBy" :class="su.select">
						<option value="none">No grouping</option>
						<option value="status">Group: status</option>
						<option value="audience">Group: audience</option>
						<option value="visibility">Group: visibility</option>
					</select>
				</div>
			</div>

			<div v-if="error" :class="[su.error, 'mb-6']">{{ error }}</div>

			<div v-if="loading && items.length === 0" class="text-zinc-500 text-sm py-12 text-center">
				Loading…
			</div>

			<div v-else-if="filtered.length === 0" class="text-zinc-500 text-sm py-12 text-center">
				No sessions yet. Click <span class="text-zinc-300">+ New session</span> to start.
			</div>

			<!-- Grouped list -->
			<div v-for="group in grouped" :key="group.label || 'all'" class="mb-6">
				<h3 v-if="group.label" :class="[su.h3, 'mb-3']">{{ group.label }}</h3>

				<div class="grid gap-3">
					<div
						v-for="s in group.items"
						:key="s.id"
						class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-start gap-4 hover:border-zinc-700 transition">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<RouterLink
									:to="`/studio/sessions/${s.id}`"
									class="font-medium text-zinc-100 hover:text-white truncate">
									{{ s.title }}
								</RouterLink>
								<span
									:class="s.status === 'published' ? su.badgePublished : su.badgeDraft">
									{{ s.status }}
								</span>
								<span
									:class="s.visibility === 'public' ? su.badgePublic : su.badgePrivate">
									{{ s.visibility }}
								</span>
								<span v-if="s.isAdult" :class="su.badge">18+</span>
							</div>
							<p v-if="s.description" class="text-sm text-zinc-400 line-clamp-1">
								{{ s.description }}
							</p>
							<div class="flex items-center gap-3 mt-2 text-xs text-zinc-500">
								<span>{{ s.scenes.length }} scenes</span>
								<span>·</span>
								<span>{{ s.audience }}</span>
								<span v-if="s.tags.length">·</span>
								<span v-if="s.tags.length" class="flex gap-1">
									<span v-for="t in s.tags.slice(0, 4)" :key="t" :class="su.badge">{{ t }}</span>
								</span>
								<span>·</span>
								<span>Updated {{ formatDate(s.updatedAt) }}</span>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<button :class="su.btnGhost" @click="duplicate(s)">Duplicate</button>
							<button :class="su.btnDanger" @click="remove(s)">Delete</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</StudioShell>
</template>
