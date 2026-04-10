<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authApi } from '@/api/auth'
import { ui } from './authStyles'

const route = useRoute()
const router = useRouter()

const token = computed(() => (route.query.token as string) || '')
const password = ref('')
const confirm = ref('')
const submitting = ref(false)
const done = ref(false)
const error = ref<string | null>(null)

async function submit() {
	error.value = null
	if (password.value !== confirm.value) {
		error.value = 'Passwords do not match'
		return
	}
	if (!token.value) {
		error.value = 'Missing reset token'
		return
	}
	submitting.value = true
	try {
		await authApi.resetPassword({ token: token.value, password: password.value })
		done.value = true
		setTimeout(() => router.push('/login'), 1500)
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
			<h1 :class="ui.title">Reset password</h1>
			<p :class="ui.subtitle">Choose a new password for your account.</p>

			<div v-if="error" :class="[ui.error, 'mb-4']">{{ error }}</div>
			<div v-if="done" :class="[ui.success, 'mb-4']">
				Password reset. Redirecting to sign in…
			</div>

			<div :class="ui.field">
				<label :class="ui.label">New password</label>
				<input
					v-model="password"
					type="password"
					:class="ui.input"
					minlength="8"
					autocomplete="new-password"
					required />
			</div>

			<div :class="ui.field">
				<label :class="ui.label">Confirm password</label>
				<input
					v-model="confirm"
					type="password"
					:class="ui.input"
					minlength="8"
					autocomplete="new-password"
					required />
			</div>

			<button
				type="submit"
				:class="ui.button"
				:disabled="submitting || done">
				{{ submitting ? 'Saving…' : 'Reset password' }}
			</button>

			<p class="mt-6 text-sm text-zinc-400 text-center">
				<RouterLink to="/login" :class="ui.link">Back to sign in</RouterLink>
			</p>
		</form>
	</div>
</template>
