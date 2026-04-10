<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dropdown as VDropdown } from 'floating-vue'
import StudioShell from '@/components/ui/StudioShell.vue'
import { su } from '@/components/ui/studioUi'
import { sessionsApi, type Session, type SessionStatus } from '@/api/sessions'

const router = useRouter()
const confirmingDelete = ref<Session | null>(null)

// --- Query state -------------------------------------------------------------

const search = ref('')
const audienceFilter = ref('')
const statusFilter = ref<'' | SessionStatus>('')
const visibilityFilter = ref<'' | 'private' | 'public'>('')
const sortBy = ref<'updated' | 'title'>('updated')
const groupBy = ref<'none' | 'status' | 'audience' | 'visibility'>('none')

const items = ref<Session[]>([])
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
	const map = new Map<string, Session[]>()
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
		router.push(`/studio/sessions/${doc.slug}`)
	} catch (e) {
		error.value = (e as Error).message
	}
}

async function duplicate(s: Session) {
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
	router.push(`/studio/sessions/${copy.slug}`)
}

function confirmDelete(s: Session) {
	confirmingDelete.value = s
}

async function remove() {
	const s = confirmingDelete.value
	if (!s) return
	confirmingDelete.value = null
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
					<p class="text-sm text-content-secondary mt-1">Create, manage, and publish your sessions.</p>
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
						<option value="t4t">t4t</option>
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

			<div v-if="loading && items.length === 0" class="text-content-tertiary text-sm py-12 text-center">
				Loading…
			</div>

			<div v-else-if="filtered.length === 0" class="text-content-tertiary text-sm py-12 text-center">
				No sessions yet. Click <span class="text-content-secondary">+ New session</span> to start.
			</div>

			<!-- Grouped list -->
			<div v-for="group in grouped" :key="group.label || 'all'" class="mb-6">
				<h3 v-if="group.label" :class="[su.h3, 'mb-3']">{{ group.label }}</h3>

				<div class="grid gap-3">
					<RouterLink
						v-for="s in group.items"
						:key="s.id"
						:to="`/studio/sessions/${s.slug}`"
						class="bg-surface-secondary/80 border border-edge rounded-xl p-4 flex items-start gap-4 hover:border-edge-secondary transition cursor-pointer no-underline">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="font-medium text-content truncate">
									{{ s.title }}
								</span>
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
							<p v-if="s.description" class="text-sm text-content-secondary line-clamp-1">
								{{ s.description }}
							</p>
							<div class="flex items-center gap-3 mt-2 text-xs text-content-tertiary">
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

						<VDropdown placement="bottom-end" @click.prevent>
							<button
								:class="su.btnGhost"
								class="!px-2"
								@click.prevent>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
								</svg>
							</button>
							<template #popper>
								<div class="bg-surface-secondary border border-edge-secondary rounded-lg shadow-theme-lg py-1 min-w-[140px]">
									<button
										class="w-full text-left px-4 py-2 text-sm text-content hover:bg-surface-tertiary transition"
										@click="duplicate(s)">
										Duplicate
									</button>
									<button
										class="w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface-tertiary transition"
										@click="confirmDelete(s)">
										Delete
									</button>
								</div>
							</template>
						</VDropdown>
					</RouterLink>
				</div>
			</div>
		</div>

		<!-- Delete confirmation modal -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="confirmingDelete"
					class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
					@click.self="confirmingDelete = null">
					<div class="bg-surface-secondary border border-edge-secondary rounded-2xl p-6 max-w-sm w-full mx-4 shadow-theme-lg">
						<h2 class="text-lg font-semibold text-content mb-2">Delete session?</h2>
						<p class="text-sm text-content-secondary mb-6">
							Are you sure you want to delete
							<span class="text-content">"{{ confirmingDelete.title }}"</span>?
							This cannot be undone.
						</p>
						<div class="flex justify-end gap-3">
							<button :class="su.btnSecondary" @click="confirmingDelete = null">Cancel</button>
							<button :class="su.btnDanger" @click="remove">Delete</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</StudioShell>
</template>
