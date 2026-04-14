<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { su } from '@/components/ui/studioUi'
import { sessionsApi, type Session } from '@/api/sessions'

/**
 * Modal session picker for playlists. Lists the user's own sessions plus
 * (optionally) public ones so they can add external sessions too.
 *
 * Search is server-side via the sessions list endpoint's `q` param.
 */
const emit = defineEmits<{
	pick: [session: Session]
	close: []
}>()

const props = defineProps<{ excludeIds: string[] }>()

const mode = ref<'mine' | 'public'>('mine')
const search = ref('')
const results = ref<Session[]>([])
const loading = ref(false)

async function load() {
	loading.value = true
	try {
		const res = await sessionsApi.list({
			mine: mode.value === 'mine' || undefined,
			q: search.value.trim() || undefined,
			limit: 30,
		})
		// Hide sessions that are already in the playlist.
		results.value = res.items.filter((s) => !props.excludeIds.includes(s.id))
	} finally {
		loading.value = false
	}
}

onMounted(load)

let searchTimer: number | undefined
watch(search, () => {
	if (searchTimer) window.clearTimeout(searchTimer)
	searchTimer = window.setTimeout(load, 250)
})
watch(mode, load)
</script>

<template>
	<div class="fixed inset-0 z-30 bg-black/70 flex items-center justify-center p-6">
		<div class="bg-surface-secondary border border-edge rounded-2xl p-6 w-full max-w-xl max-h-[80vh] flex flex-col">
			<div class="flex items-center justify-between mb-4">
				<h2 :class="su.h2">Add sessions</h2>
				<button :class="su.btnGhost" @click="emit('close')">Close</button>
			</div>

			<div class="grid grid-cols-[1fr_auto] gap-2 mb-4">
				<input v-model="search" :class="su.input" placeholder="Search sessions…" />
				<select v-model="mode" :class="su.select">
					<option value="mine">Mine</option>
					<option value="public">Public</option>
				</select>
			</div>

			<div class="flex-1 overflow-auto">
				<div v-if="loading" class="text-sm text-content-tertiary text-center py-4">Loading…</div>
				<div
					v-else-if="results.length === 0"
					class="text-sm text-content-tertiary text-center py-4">
					No matches.
				</div>
				<div v-else class="grid gap-2">
					<button
						v-for="s in results"
						:key="s.id"
						class="text-left bg-surface border border-edge rounded-lg p-3 hover:border-edge-secondary transition"
						@click="emit('pick', s)">
						<div class="flex items-center gap-2">
							<span class="font-medium text-content truncate">{{ s.title }}</span>
							<span :class="s.status === 'published' ? su.badgePublished : su.badgeDraft">
								{{ s.status }}
							</span>
						</div>
						<div class="text-xs text-content-tertiary mt-1 line-clamp-1">{{ s.description }}</div>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
