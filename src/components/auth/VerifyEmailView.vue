<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { authApi } from '@/api/auth'
import { auth } from '@/state/auth'
import { ui } from './authStyles'

const route = useRoute()
const status = ref<'pending' | 'ok' | 'error'>('pending')
const message = ref('')

onMounted(async () => {
	const token = route.query.token as string
	if (!token) {
		status.value = 'error'
		message.value = 'Missing verification token.'
		return
	}
	try {
		const res = await authApi.verifyEmail(token)
		message.value = `${res.email} verified.`
		status.value = 'ok'
		// Refresh the logged-in user so the UI reflects verified state.
		try {
			auth.setUser(await authApi.me())
		} catch {
			/* not signed in — that's fine */
		}
	} catch (e) {
		status.value = 'error'
		message.value = (e as Error).message
	}
})
</script>

<template>
	<div :class="ui.page">
		<div :class="ui.card">
			<h1 :class="ui.title">Email verification</h1>
			<p v-if="status === 'pending'" :class="ui.subtitle">Verifying…</p>
			<div v-else-if="status === 'ok'" :class="[ui.success, 'mb-4']">{{ message }}</div>
			<div v-else :class="[ui.error, 'mb-4']">{{ message }}</div>

			<div class="text-sm text-zinc-400 text-center mt-4">
				<RouterLink to="/account" :class="ui.link">Go to account</RouterLink>
			</div>
		</div>
	</div>
</template>
