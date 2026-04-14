<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { profilesApi, type PublicProfile } from '@/api/profiles'
import { API_BASE } from '@/api/client'
import AppShell from '@/components/ui/AppShell.vue'
import LevelBadge from './LevelBadge.vue'
import StreakBadge from './StreakBadge.vue'

const route = useRoute()
const profile = ref<PublicProfile | null>(null)
const loading = ref(true)
const error = ref('')

const username = computed(() => String(route.params.username))

const avatarUrl = computed(() => {
	if (!profile.value?.user.avatarAssetKey) return null
	return `${API_BASE}/users/${encodeURIComponent(username.value)}/avatar`
})

const initial = computed(() =>
	(profile.value?.user.username ?? '?')[0]!.toUpperCase(),
)

function formatMinutes(m: number): string {
	if (m < 60) return `${m}m`
	const h = Math.floor(m / 60)
	const rem = m % 60
	return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

onMounted(async () => {
	try {
		profile.value = await profilesApi.getProfile(username.value)
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<AppShell>
		<div class="p-6">
			<div class="max-w-3xl mx-auto">
				<!-- Loading -->
				<div v-if="loading" class="text-center py-20 text-content-secondary">
					Loading profile...
				</div>

				<!-- Error -->
				<div v-else-if="error" class="text-center py-20">
					<p class="text-content-secondary">{{ error }}</p>
				</div>

				<!-- Profile -->
				<template v-else-if="profile">
					<!-- Header -->
					<div class="flex items-start gap-5 mb-8">
						<div
							class="shrink-0 w-20 h-20 rounded-full bg-surface-tertiary border border-edge flex items-center justify-center overflow-hidden"
						>
							<img
								v-if="avatarUrl"
								:src="avatarUrl"
								:alt="profile.user.username"
								class="w-full h-full object-cover"
							/>
							<span v-else class="text-2xl font-bold text-content-tertiary">
								{{ initial }}
							</span>
						</div>

						<div class="min-w-0 flex-1">
							<h1 class="text-2xl font-semibold truncate">
								{{ profile.user.username }}
							</h1>
							<p
								v-if="profile.user.bio"
								class="text-content-secondary mt-1 whitespace-pre-line break-words"
							>
								{{ profile.user.bio }}
							</p>
							<p class="text-xs text-content-tertiary mt-2">
								Member since {{ new Date(profile.user.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) }}
							</p>
						</div>
					</div>

					<!-- Stats row -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
						<!-- Level -->
						<div class="bg-surface-secondary/80 border border-edge rounded-2xl p-4">
							<div class="text-xs uppercase tracking-wider text-content-secondary mb-2">Level</div>
							<LevelBadge :level="profile.user.level" :progress="profile.user.levelProgress" size="md" />
						</div>

						<!-- Streak -->
						<div class="bg-surface-secondary/80 border border-edge rounded-2xl p-4">
							<div class="text-xs uppercase tracking-wider text-content-secondary mb-2">Streak</div>
							<StreakBadge :days="profile.user.currentStreak" />
						</div>

						<!-- Sessions -->
						<div class="bg-surface-secondary/80 border border-edge rounded-2xl p-4">
							<div class="text-xs uppercase tracking-wider text-content-secondary mb-2">Sessions</div>
							<div class="font-semibold tabular-nums">{{ profile.user.totalSessions }}</div>
						</div>

						<!-- Time -->
						<div class="bg-surface-secondary/80 border border-edge rounded-2xl p-4">
							<div class="text-xs uppercase tracking-wider text-content-secondary mb-2">Time</div>
							<div class="font-semibold tabular-nums">{{ formatMinutes(profile.user.totalMinutes) }}</div>
						</div>
					</div>

					<!-- XP bar (full width) -->
					<div class="bg-surface-secondary/80 border border-edge rounded-2xl p-4 mb-8">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium">{{ profile.user.xp.toLocaleString() }} XP</span>
							<span class="text-xs text-content-secondary">
								Level {{ profile.user.level }} &rarr; {{ profile.user.level + 1 }}
							</span>
						</div>
						<div class="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
							<div
								class="h-full rounded-full bg-accent transition-all duration-500"
								:style="{ width: `${Math.round(profile.user.levelProgress * 100)}%` }"
							/>
						</div>
					</div>

					<!-- Public playlists -->
					<section v-if="profile.playlists.length > 0">
						<h2 class="text-lg font-semibold mb-4">Public playlists</h2>
						<div class="grid gap-3 sm:grid-cols-2">
							<div
								v-for="pl in profile.playlists"
								:key="pl.id"
								class="bg-surface-secondary/80 border border-edge rounded-2xl p-5 hover:border-edge-secondary transition"
							>
								<h3 class="font-medium truncate">{{ pl.title }}</h3>
								<p
									v-if="pl.description"
									class="text-sm text-content-secondary mt-1 line-clamp-2"
								>
									{{ pl.description }}
								</p>
								<p class="text-xs text-content-tertiary mt-2">
									{{ pl.sessions.length }} {{ pl.sessions.length === 1 ? 'session' : 'sessions' }}
								</p>
							</div>
						</div>
					</section>

					<p
						v-else
						class="text-content-tertiary text-sm text-center py-8"
					>
						No public playlists yet.
					</p>
				</template>
			</div>
		</div>
	</AppShell>
</template>
