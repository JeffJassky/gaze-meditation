<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { auth } from '@/state/auth'
import LevelBadge from '@/components/profile/LevelBadge.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

const mainNav = [
	{ to: '/home', label: 'Home', match: ['/home'] },
	{ to: '/sessions', label: 'Sessions', match: ['/sessions'] },
	{ to: '/leaderboard', label: 'Leaderboard', match: ['/leaderboard'] },
]

const studioNav = { to: '/studio/sessions', label: 'Studio', match: ['/studio'], authOnly: true }

function isActive(item: { match: string[] }): boolean {
	return item.match.some((m) => route.path === m || route.path.startsWith(m + '/'))
}

/** Which section sub-nav should show, derived from current route */
function inSection(prefix: string): boolean {
	return route.path === prefix || route.path.startsWith(prefix + '/')
}
</script>

<template>
	<div class="min-h-screen w-full bg-surface text-content flex flex-col">
		<!-- Primary nav -->
		<header class="border-b border-edge bg-surface/80 backdrop-blur sticky top-0 z-30">
			<div class="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
				<div class="flex items-center gap-6 md:gap-8 min-w-0">
					<RouterLink to="/home" class="font-semibold tracking-tight text-content whitespace-nowrap">
						GAZE
					</RouterLink>
					<nav class="hidden md:flex gap-1">
						<RouterLink
							v-for="item in mainNav"
							:key="item.to"
							:to="item.to"
							class="px-3 py-1.5 rounded-lg text-sm transition"
							:class="isActive(item) ? 'bg-surface-tertiary text-content' : 'text-content-secondary hover:text-content'"
						>
							{{ item.label }}
						</RouterLink>
						<RouterLink
							v-if="auth.state.user"
							:to="studioNav.to"
							class="px-3 py-1.5 rounded-lg text-sm transition"
							:class="isActive(studioNav) ? 'bg-surface-tertiary text-content' : 'text-content-secondary hover:text-content'"
						>
							{{ studioNav.label }}
						</RouterLink>
					</nav>
				</div>

				<div class="flex items-center gap-3">
					<template v-if="auth.state.user">
						<RouterLink
							to="/account"
							class="hidden md:flex items-center gap-2 text-sm transition"
							:class="inSection('/account') ? 'text-content' : 'text-content-secondary hover:text-content'"
						>
							<LevelBadge :level="auth.state.user.level" :progress="auth.state.user.levelProgress" size="sm" />
							<span>{{ auth.state.user.username }}</span>
						</RouterLink>
					</template>
					<template v-else>
						<RouterLink to="/login" class="hidden md:inline text-sm text-content-secondary hover:text-content transition">
							Sign in
						</RouterLink>
						<RouterLink
							to="/register"
							class="hidden md:inline text-sm px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent-text hover:bg-accent/10 transition"
						>
							Create account
						</RouterLink>
					</template>

					<button
						@click="isSidebarOpen = !isSidebarOpen"
						class="md:hidden p-2 text-content-secondary hover:text-content transition-colors"
						aria-label="Toggle menu"
					>
						<svg v-if="!isSidebarOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
						<svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Mobile dropdown -->
			<div
				v-if="isSidebarOpen"
				class="md:hidden border-t border-edge bg-surface px-4 py-4 flex flex-col gap-2"
			>
				<RouterLink v-for="item in mainNav" :key="item.to" :to="item.to" @click="isSidebarOpen = false"
					:class="['px-3 py-2 rounded-lg text-sm', isActive(item) ? 'bg-surface-tertiary text-content' : 'text-content-secondary']"
				>{{ item.label }}</RouterLink>
				<RouterLink v-if="auth.state.user" :to="studioNav.to" @click="isSidebarOpen = false"
					:class="['px-3 py-2 rounded-lg text-sm', isActive(studioNav) ? 'bg-surface-tertiary text-content' : 'text-content-secondary']"
				>{{ studioNav.label }}</RouterLink>
				<div class="border-t border-edge mt-2 pt-2 flex flex-col gap-1">
					<template v-if="auth.state.user">
						<RouterLink to="/account" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-content-secondary flex items-center gap-2">
							<LevelBadge :level="auth.state.user.level" :progress="auth.state.user.levelProgress" size="sm" />
							<span>{{ auth.state.user.username }}</span>
						</RouterLink>
					</template>
					<template v-else>
						<RouterLink to="/login" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-content-secondary">Sign in</RouterLink>
						<RouterLink to="/register" @click="isSidebarOpen = false" class="px-3 py-2 rounded-lg text-sm text-accent-text">Create account</RouterLink>
					</template>
				</div>
			</div>
		</header>

		<!-- Section sub-nav (studio, account, etc.) -->
		<nav
			v-if="$slots.subnav"
			class="border-b border-edge bg-surface/60 backdrop-blur sticky top-14 z-20"
		>
			<div class="max-w-7xl mx-auto px-4 md:px-6 h-10 flex items-center gap-1">
				<slot name="subnav" />
			</div>
		</nav>

		<main class="flex-1">
			<slot />
		</main>
	</div>
</template>
