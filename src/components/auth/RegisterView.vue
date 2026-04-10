<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { auth } from '@/state/auth'
import { ui } from './authStyles'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function submit() {
	error.value = null
	submitting.value = true
	try {
		await auth.register(username.value.trim(), password.value, email.value.trim() || undefined)
		router.push('/home')
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
			<h1 :class="ui.title">Create account</h1>
			<p :class="ui.subtitle">Only a username and password are required.</p>

			<div v-if="error" :class="[ui.error, 'mb-4']">{{ error }}</div>

			<div :class="ui.field">
				<label :class="ui.label">Username</label>
				<input
					v-model="username"
					:class="ui.input"
					autocomplete="username"
					required
					minlength="2"
					maxlength="32"
					pattern="[a-zA-Z0-9_.\-]+" />
			</div>

			<div :class="ui.field">
				<label :class="ui.label">Email <span class="text-zinc-600 normal-case">(optional)</span></label>
				<input
					v-model="email"
					type="email"
					:class="ui.input"
					autocomplete="email" />
			</div>

			<div :class="ui.field">
				<label :class="ui.label">Password</label>
				<input
					v-model="password"
					type="password"
					:class="ui.input"
					autocomplete="new-password"
					minlength="8"
					required />
			</div>

			<button
				type="submit"
				:class="ui.button"
				:disabled="submitting">
				{{ submitting ? 'Creating…' : 'Create account' }}
			</button>

			<p class="mt-6 text-sm text-zinc-400 text-center">
				Already have an account?
				<RouterLink to="/login" :class="ui.link">Sign in</RouterLink>
			</p>
		</form>
	</div>
</template>
