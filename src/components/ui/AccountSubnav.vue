<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth } from '@/state/auth'

const route = useRoute()
const router = useRouter()

const tabs = [
	{ to: '/account', label: 'Settings', exact: true },
	{ to: '/logs', label: 'History', exact: true },
]

function isActive(tab: { to: string; exact?: boolean }): boolean {
	return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}

async function signOut() {
	await auth.logout()
	router.push('/login')
}
</script>

<template>
	<RouterLink
		v-for="tab in tabs"
		:key="tab.to"
		:to="tab.to"
		class="px-3 py-1 rounded-md text-sm transition"
		:class="isActive(tab) ? 'bg-surface-tertiary text-content' : 'text-content-secondary hover:text-content'"
	>
		{{ tab.label }}
	</RouterLink>
	<button
		@click="signOut"
		class="px-3 py-1 rounded-md text-sm transition text-content-tertiary hover:text-content ml-auto"
	>
		Sign out
	</button>
</template>
