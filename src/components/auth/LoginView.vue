<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { auth } from '@/state/auth'
import { ui } from './authStyles'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function submit() {
	error.value = null
	submitting.value = true
	try {
		await auth.login(username.value.trim(), password.value)
		const next = (router.currentRoute.value.query.next as string) || '/home'
		router.push(next)
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		submitting.value = false
	}
}
</script>

<template>
	<div :class="ui.page">
		<form
			:class="ui.card"
			@submit.prevent="submit">
			<h1 :class="ui.title">Sign in</h1>
			<p :class="ui.subtitle">Welcome back to Gaze.</p>

			<div v-if="error" :class="[ui.error, 'mb-4']">{{ error }}</div>

			<div :class="ui.field">
				<label :class="ui.label">Username</label>
				<input
					v-model="username"
					:class="ui.input"
					autocomplete="username"
					required />
			</div>

			<div :class="ui.field">
				<label :class="ui.label">Password</label>
				<input
					v-model="password"
					type="password"
					:class="ui.input"
					autocomplete="current-password"
					required />
			</div>

			<button
				type="submit"
				:class="ui.button"
				:disabled="submitting">
				{{ submitting ? 'Signing in…' : 'Sign in' }}
			</button>

			<div class="mt-6 text-sm text-content-secondary flex justify-between">
				<RouterLink to="/forgot-password" :class="ui.link">Forgot password?</RouterLink>
				<RouterLink to="/register" :class="ui.link">Create account</RouterLink>
			</div>
		</form>
	</div>
</template>
