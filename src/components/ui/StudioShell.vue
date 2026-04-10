<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import AppShell from './AppShell.vue'

const route = useRoute()

const tabs = [
	{ to: '/studio/sessions', label: 'Sessions' },
	{ to: '/studio/playlists', label: 'Playlists' },
]

function isActive(to: string): boolean {
	return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
	<AppShell>
		<template #subnav>
			<RouterLink
				v-for="tab in tabs"
				:key="tab.to"
				:to="tab.to"
				class="px-3 py-1 rounded-md text-sm transition"
				:class="
					isActive(tab.to)
						? 'bg-surface-tertiary text-content'
						: 'text-content-secondary hover:text-content'
				">
				{{ tab.label }}
			</RouterLink>
		</template>

		<slot />
	</AppShell>
</template>
