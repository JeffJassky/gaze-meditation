<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { auth } from '@/state/auth'
import { su } from './studioUi'

const route = useRoute()

const tabs = [
	{ to: '/studio/sessions', label: 'Sessions' },
	{ to: '/studio/playlists', label: 'Playlists' },
]

// A tab is active if the current route path starts with its `to` — this keeps
// the nested editor pages (e.g. /studio/sessions/:id) highlighting the parent.
function isActive(to: string): boolean {
	return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
	<div :class="su.page">
		<header class="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
			<div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
				<div class="flex items-center gap-8">
					<RouterLink to="/home" class="font-semibold tracking-tight">Gaze</RouterLink>
					<nav class="flex gap-1">
						<RouterLink
							v-for="tab in tabs"
							:key="tab.to"
							:to="tab.to"
							class="px-3 py-1.5 rounded-lg text-sm transition"
							:class="
								isActive(tab.to)
									? 'bg-zinc-800 text-white'
									: 'text-zinc-400 hover:text-white'
							">
							{{ tab.label }}
						</RouterLink>
					</nav>
				</div>
				<RouterLink
					to="/account"
					class="text-sm text-zinc-400 hover:text-white transition">
					{{ auth.state.user?.username || 'account' }}
				</RouterLink>
			</div>
		</header>

		<main>
			<slot />
		</main>
	</div>
</template>
