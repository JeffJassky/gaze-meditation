<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { auth } from '@/state/auth'
import { authApi } from '@/api/auth'
import { ui } from './authStyles'

const router = useRouter()

// ---------- Username ----------
const usernameInput = ref('')
const usernameBusy = ref(false)
const usernameMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

async function saveUsername() {
	usernameMsg.value = null
	usernameBusy.value = true
	try {
		const user = await authApi.updateUsername(usernameInput.value.trim())
		auth.setUser(user)
		usernameMsg.value = { kind: 'ok', text: 'Username updated.' }
	} catch (e) {
		usernameMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		usernameBusy.value = false
	}
}

// ---------- Email ----------
const emailInput = ref('')
const emailBusy = ref(false)
const emailMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

async function saveEmail() {
	emailMsg.value = null
	emailBusy.value = true
	try {
		const user = await authApi.requestEmailChange(emailInput.value.trim())
		auth.setUser(user)
		emailMsg.value = {
			kind: 'ok',
			text: 'Verification email sent. Check your inbox to confirm.',
		}
		emailInput.value = ''
	} catch (e) {
		emailMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		emailBusy.value = false
	}
}

async function cancelPendingEmail() {
	const user = await authApi.cancelEmailChange()
	auth.setUser(user)
}

// ---------- Password ----------
const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const pwBusy = ref(false)
const pwMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

async function savePassword() {
	pwMsg.value = null
	if (pw.newPassword !== pw.confirm) {
		pwMsg.value = { kind: 'err', text: 'New passwords do not match.' }
		return
	}
	pwBusy.value = true
	try {
		await authApi.changePassword({
			currentPassword: pw.currentPassword,
			newPassword: pw.newPassword,
		})
		pw.currentPassword = pw.newPassword = pw.confirm = ''
		pwMsg.value = { kind: 'ok', text: 'Password updated.' }
	} catch (e) {
		pwMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		pwBusy.value = false
	}
}

// ---------- Studio settings ----------
/**
 * Structured settings sections. The server stores freeform `user.settings`
 * internally and sanitizes sensitive fields (e.g. ElevenLabs API key) out
 * of responses — so the client never sees a raw key. We only ever get a
 * `studio.hasElevenlabsApiKey` boolean back.
 */
const settings = ref<Record<string, any>>({})
const hasElevenlabsKey = computed<boolean>(
	() => !!settings.value.studio?.hasElevenlabsApiKey,
)

const elevenlabsKeyInput = ref('')
const studioBusy = ref(false)
const studioMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

async function loadSettings() {
	settings.value = await authApi.getSettings()
}

async function saveElevenlabsKey() {
	if (!elevenlabsKeyInput.value.trim()) return
	studioMsg.value = null
	studioBusy.value = true
	try {
		// Dot-notation patch — the transport stays dot-notated even though the
		// UI never exposes that to the user.
		settings.value = await authApi.updateSettings({
			'studio.elevenlabsApiKey': elevenlabsKeyInput.value.trim(),
		})
		elevenlabsKeyInput.value = ''
		studioMsg.value = { kind: 'ok', text: 'ElevenLabs API key saved.' }
		// Refresh the global user so any other page sees the new flag.
		try {
			auth.setUser(await authApi.me())
		} catch {
			/* ignore */
		}
	} catch (e) {
		studioMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		studioBusy.value = false
	}
}

async function clearElevenlabsKey() {
	if (!confirm('Remove your ElevenLabs API key?')) return
	studioMsg.value = null
	studioBusy.value = true
	try {
		settings.value = await authApi.updateSettings({
			'studio.elevenlabsApiKey': null,
		})
		studioMsg.value = { kind: 'ok', text: 'ElevenLabs API key removed.' }
		try {
			auth.setUser(await authApi.me())
		} catch {
			/* ignore */
		}
	} catch (e) {
		studioMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		studioBusy.value = false
	}
}

async function testElevenlabsKey() {
	studioMsg.value = null
	studioBusy.value = true
	try {
		const { listElevenLabsVoices } = await import('@/vendors/elevenlabs')
		const voices = await listElevenLabsVoices()
		studioMsg.value = {
			kind: 'ok',
			text: `Connected — ${voices.length} voices available.`,
		}
	} catch (e) {
		studioMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		studioBusy.value = false
	}
}

// ---------- Sign out ----------
async function signOut() {
	await auth.logout()
	router.push('/login')
}

onMounted(async () => {
	await auth.hydrate()
	if (!auth.state.user) {
		router.push('/login')
		return
	}
	usernameInput.value = auth.state.user.username
	await loadSettings()
})
</script>

<template>
	<div class="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6">
		<div class="max-w-2xl mx-auto">
			<div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
				<div>
					<h1 class="text-3xl font-semibold">Account</h1>
					<p class="text-sm text-zinc-400 mt-1">
						Signed in as <strong>{{ auth.state.user?.username }}</strong>
					</p>
				</div>
				<div class="flex items-center gap-2 flex-wrap">
					<RouterLink
						to="/studio/sessions"
						class="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2 text-sm font-medium">
						Sessions
					</RouterLink>
					<RouterLink
						to="/studio/playlists"
						class="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg px-4 py-2 text-sm">
						Playlists
					</RouterLink>
					<RouterLink
						to="/home"
						class="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg px-4 py-2 text-sm">
						Home
					</RouterLink>
					<button
						@click="signOut"
						class="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg px-4 py-2 text-sm">
						Sign out
					</button>
				</div>
			</div>

			<!-- Username -->
			<section class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Username</h2>
				<form @submit.prevent="saveUsername" class="space-y-3">
					<input v-model="usernameInput" :class="ui.input" />
					<div
						v-if="usernameMsg"
						:class="usernameMsg.kind === 'ok' ? ui.success : ui.error">
						{{ usernameMsg.text }}
					</div>
					<button :class="ui.button" :disabled="usernameBusy">
						{{ usernameBusy ? 'Saving…' : 'Save username' }}
					</button>
				</form>
			</section>

			<!-- Email -->
			<section class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-1">Email</h2>
				<p class="text-sm text-zinc-400 mb-4">
					Current:
					<span v-if="auth.state.user?.email" class="text-zinc-200">
						{{ auth.state.user?.email }}
						<span
							v-if="auth.state.user?.emailVerifiedAt"
							class="ml-2 text-xs text-emerald-400">verified</span>
						<span v-else class="ml-2 text-xs text-amber-400">unverified</span>
					</span>
					<span v-else class="text-zinc-500">none</span>
				</p>

				<div
					v-if="auth.state.user?.pendingEmail"
					class="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
					Pending change to <strong>{{ auth.state.user.pendingEmail }}</strong> — check
					that inbox to confirm.
					<button
						@click="cancelPendingEmail"
						class="ml-2 underline underline-offset-2 text-amber-200">
						Cancel
					</button>
				</div>

				<form @submit.prevent="saveEmail" class="space-y-3">
					<input
						v-model="emailInput"
						type="email"
						:class="ui.input"
						placeholder="new@example.com" />
					<div v-if="emailMsg" :class="emailMsg.kind === 'ok' ? ui.success : ui.error">
						{{ emailMsg.text }}
					</div>
					<button :class="ui.button" :disabled="emailBusy || !emailInput">
						{{ emailBusy ? 'Sending…' : 'Update email' }}
					</button>
				</form>
			</section>

			<!-- Password -->
			<section class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Password</h2>
				<form @submit.prevent="savePassword" class="space-y-3">
					<div>
						<label :class="ui.label">Current password</label>
						<input v-model="pw.currentPassword" type="password" :class="ui.input" />
					</div>
					<div>
						<label :class="ui.label">New password</label>
						<input v-model="pw.newPassword" type="password" :class="ui.input" minlength="8" />
					</div>
					<div>
						<label :class="ui.label">Confirm new password</label>
						<input v-model="pw.confirm" type="password" :class="ui.input" minlength="8" />
					</div>
					<div v-if="pwMsg" :class="pwMsg.kind === 'ok' ? ui.success : ui.error">
						{{ pwMsg.text }}
					</div>
					<button :class="ui.button" :disabled="pwBusy">
						{{ pwBusy ? 'Saving…' : 'Change password' }}
					</button>
				</form>
			</section>

			<!-- Studio settings -->
			<section class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-1">Studio settings</h2>
				<p class="text-sm text-zinc-400 mb-4">
					Configure integrations used when creating sessions.
				</p>

				<div class="border-t border-zinc-800 pt-4">
					<div class="flex items-center justify-between mb-2 gap-4">
						<label :class="ui.label">ElevenLabs API key</label>
						<span
							v-if="hasElevenlabsKey"
							class="text-xs rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5">
							Configured
						</span>
						<span
							v-else
							class="text-xs rounded-full bg-zinc-700/40 border border-zinc-600 text-zinc-300 px-2 py-0.5">
							Not configured
						</span>
					</div>
					<p class="text-xs text-zinc-500 mb-3">
						When set, session editors can pick voices from your ElevenLabs account and
						assign them per scene. Your key is stored securely and never returned to the
						browser.
					</p>

					<form @submit.prevent="saveElevenlabsKey" class="flex items-start gap-2 mb-3">
						<input
							v-model="elevenlabsKeyInput"
							type="password"
							:class="ui.input"
							:placeholder="hasElevenlabsKey ? '••• configured — enter a new key to replace' : 'sk_…'"
							autocomplete="off" />
						<button
							type="submit"
							:class="ui.button"
							class="whitespace-nowrap"
							:disabled="studioBusy || !elevenlabsKeyInput.trim()">
							{{ hasElevenlabsKey ? 'Replace' : 'Save' }}
						</button>
					</form>

					<div class="flex items-center gap-2">
						<button
							v-if="hasElevenlabsKey"
							type="button"
							:class="ui.buttonSecondary"
							class="!w-auto !px-3 !py-1.5 text-sm"
							:disabled="studioBusy"
							@click="testElevenlabsKey">
							Test connection
						</button>
						<button
							v-if="hasElevenlabsKey"
							type="button"
							class="text-sm text-red-300 hover:text-red-200 px-3 py-1.5"
							:disabled="studioBusy"
							@click="clearElevenlabsKey">
							Remove key
						</button>
					</div>

					<div
						v-if="studioMsg"
						:class="[studioMsg.kind === 'ok' ? ui.success : ui.error, 'mt-3']">
						{{ studioMsg.text }}
					</div>
				</div>
			</section>
		</div>
	</div>
</template>
