<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi } from '@/services/auth'
import { ui } from './authStyles'

const identifier = ref('')
const submitting = ref(false)
const done = ref(false)
const error = ref<string | null>(null)

async function submit() {
	error.value = null
	submitting.value = true
	try {
		const body = identifier.value.includes('@')
			? { email: identifier.value.trim() }
			: { username: identifier.value.trim() }
		await authApi.forgotPassword(body)
		done.value = true
	} catch (e) {
		error.value = (e as Error).message
	} finally {
		submitting.value = false
	}
}
</script>

<template>
	<div :class="ui.page">
		<form :class="ui.card" @submit.prevent="submit">
			<h1 :class="ui.title">Forgot password</h1>
			<p :class="ui.subtitle">
				Enter your username or email. If an account exists, we'll send a reset link that
				expires in 30 minutes.
			</p>

			<div v-if="error" :class="[ui.error, 'mb-4']">{{ error }}</div>
			<div v-if="done" :class="[ui.success, 'mb-4']">
				If that account exists, a reset link has been sent.
			</div>

			<div :class="ui.field">
				<label :class="ui.label">Username or email</label>
				<input
					v-model="identifier"
					:class="ui.input"
					required
					:disabled="done" />
			</div>

			<button
				type="submit"
				:class="ui.button"
				:disabled="submitting || done">
				{{ submitting ? 'Sending…' : 'Send reset link' }}
			</button>

			<p class="mt-6 text-sm text-zinc-400 text-center">
				<RouterLink to="/login" :class="ui.link">Back to sign in</RouterLink>
			</p>
		</form>
	</div>
</template>
