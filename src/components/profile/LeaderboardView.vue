<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { profilesApi, type LeaderboardEntry } from '@/api/profiles'
import AppShell from '@/components/ui/AppShell.vue'

const route = useRoute()
const router = useRouter()

const items = ref<LeaderboardEntry[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const total = ref(0)
const hasMore = ref(false)

function currentPage(): number {
	return Math.max(Number(route.query.page) || 1, 1)
}

async function load() {
	loading.value = true
	error.value = ''
	try {
		const res = await profilesApi.leaderboard(page.value)
		items.value = res.items
		total.value = res.total
		hasMore.value = res.hasMore
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
}

function goPage(p: number) {
	router.push({ query: { page: p > 1 ? String(p) : undefined } })
}

watch(
	() => route.query.page,
	() => {
		page.value = currentPage()
		load()
	},
)

function formatMinutes(m: number): string {
	if (m < 60) return `${m}m`
	const h = Math.floor(m / 60)
	const rem = m % 60
	return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

onMounted(() => {
	page.value = currentPage()
	load()
})
</script>

<template>
	<AppShell>
		<div class="p-6">
			<div class="max-w-3xl mx-auto">
				<h1 class="text-3xl font-semibold mb-6">Leaderboard</h1>

				<!-- Loading -->
				<div v-if="loading" class="text-center py-20 text-content-secondary">
					Loading...
				</div>

				<!-- Error -->
				<div v-else-if="error" class="text-center py-20 text-content-secondary">
					{{ error }}
				</div>

				<template v-else>
					<!-- Empty -->
					<div v-if="items.length === 0" class="text-center py-20 text-content-tertiary">
						No entries yet.
					</div>

					<!-- Table -->
					<div v-else class="bg-surface-secondary/80 border border-edge rounded-2xl overflow-hidden">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-edge text-xs uppercase tracking-wider text-content-secondary">
									<th class="text-left px-4 py-3 w-16">#</th>
									<th class="text-left px-4 py-3">User</th>
									<th class="text-right px-4 py-3">Level</th>
									<th class="text-right px-4 py-3">Time</th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="entry in items"
									:key="entry.rank"
									class="border-b border-edge/50 last:border-0 hover:bg-surface-tertiary/30 transition-colors"
								>
									<td class="px-4 py-3 tabular-nums font-medium text-content-secondary">
										{{ entry.rank }}
									</td>
									<td class="px-4 py-3">
										<RouterLink
											:to="`/profile/${entry.username}`"
											class="text-content hover:text-accent transition font-medium"
										>
											{{ entry.username }}
										</RouterLink>
									</td>
									<td class="px-4 py-3 text-right tabular-nums text-content-secondary">
										{{ entry.level }}
									</td>
									<td class="px-4 py-3 text-right tabular-nums font-medium">
										{{ formatMinutes(entry.totalMinutes) }}
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					<div v-if="total > 100" class="flex items-center justify-between mt-4">
						<button
							class="text-sm px-3 py-1.5 rounded-lg bg-surface-tertiary text-content hover:opacity-80 transition disabled:opacity-30 disabled:cursor-not-allowed"
							:disabled="page <= 1"
							@click="goPage(page - 1)"
						>
							&larr; Previous
						</button>
						<span class="text-sm text-content-secondary">
							Page {{ page }} of {{ Math.ceil(total / 100) }}
						</span>
						<button
							class="text-sm px-3 py-1.5 rounded-lg bg-surface-tertiary text-content hover:opacity-80 transition disabled:opacity-30 disabled:cursor-not-allowed"
							:disabled="!hasMore"
							@click="goPage(page + 1)"
						>
							Next &rarr;
						</button>
					</div>
				</template>
			</div>
		</div>
	</AppShell>
</template>
