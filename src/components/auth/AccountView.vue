<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { auth } from '@/state/auth'
import { authApi } from '@/api/auth'
import { uploadFile } from '@/api/uploads'
import { assetsApi } from '@/api/assets'
import { API_BASE } from '@/api/client'
import AppShell from '@/components/ui/AppShell.vue'
import AccountSubnav from '@/components/ui/AccountSubnav.vue'
import LevelBadge from '@/components/profile/LevelBadge.vue'
import { ui } from './authStyles'
import { useTheme, type ThemePreference } from '@/composables/useTheme'

const router = useRouter()
const { preference, setTheme } = useTheme()

const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
	{ value: 'system', label: 'System', icon: '\u{1F4BB}' },
	{ value: 'light', label: 'Light', icon: '\u2600\uFE0F' },
	{ value: 'dark', label: 'Dark', icon: '\u{1F319}' },
]

// ---------- Profile (bio + avatar) ----------
const bioInput = ref('')
const bioBusy = ref(false)
const bioMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

const avatarUploading = ref(false)
const avatarMsg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

const avatarUrl = computed(() => {
	if (!auth.state.user?.avatarAssetKey) return null
	return `${API_BASE}/users/${encodeURIComponent(auth.state.user.username)}/avatar?t=${Date.now()}`
})

const avatarInitial = computed(() =>
	(auth.state.user?.username ?? '?')[0]!.toUpperCase(),
)

async function saveBio() {
	bioMsg.value = null
	bioBusy.value = true
	try {
		const user = await authApi.updateProfile({ bio: bioInput.value })
		auth.setUser(user)
		bioMsg.value = { kind: 'ok', text: 'Bio updated.' }
	} catch (e) {
		bioMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		bioBusy.value = false
	}
}

async function onAvatarFileChange(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return
	avatarMsg.value = null
	avatarUploading.value = true
	try {
		const { key, contentType, size } = await uploadFile(file, 'profile-image')
		await assetsApi.register({ kind: 'profile-image', key, contentType, size, label: 'avatar' })
		const user = await authApi.updateProfile({ avatarAssetKey: key })
		auth.setUser(user)
		avatarMsg.value = { kind: 'ok', text: 'Avatar updated.' }
	} catch (e) {
		avatarMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		avatarUploading.value = false
	}
}

async function removeAvatar() {
	avatarMsg.value = null
	avatarUploading.value = true
	try {
		const user = await authApi.updateProfile({ avatarAssetKey: null })
		auth.setUser(user)
		avatarMsg.value = { kind: 'ok', text: 'Avatar removed.' }
	} catch (e) {
		avatarMsg.value = { kind: 'err', text: (e as Error).message }
	} finally {
		avatarUploading.value = false
	}
}

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
		settings.value = await authApi.updateSettings({
			'studio.elevenlabsApiKey': elevenlabsKeyInput.value.trim(),
		})
		elevenlabsKeyInput.value = ''
		studioMsg.value = { kind: 'ok', text: 'ElevenLabs API key saved.' }
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

onMounted(async () => {
	await auth.hydrate()
	if (!auth.state.user) {
		router.push('/login')
		return
	}
	usernameInput.value = auth.state.user.username
	bioInput.value = auth.state.user.bio ?? ''
	await loadSettings()
})
</script>

<template>
	<AppShell>
		<template #subnav>
			<AccountSubnav />
		</template>

		<div class="p-6">
		<div class="max-w-2xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-semibold">Account</h1>
				<p class="text-sm text-content-secondary mt-1">
					Signed in as <strong>{{ auth.state.user?.username }}</strong>
				</p>
			</div>

			<!-- Profile -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold">Profile</h2>
					<RouterLink
						v-if="auth.state.user"
						:to="`/profile/${auth.state.user.username}`"
						class="text-sm text-content-secondary hover:text-content transition"
					>
						View profile &rarr;
					</RouterLink>
				</div>

				<!-- Avatar -->
				<div class="flex items-center gap-4 mb-5">
					<div
						class="shrink-0 w-16 h-16 rounded-full bg-surface-tertiary border border-edge flex items-center justify-center overflow-hidden"
					>
						<img
							v-if="avatarUrl"
							:src="avatarUrl"
							alt="Avatar"
							class="w-full h-full object-cover"
						/>
						<span v-else class="text-xl font-bold text-content-tertiary">
							{{ avatarInitial }}
						</span>
					</div>
					<div class="flex flex-col gap-2">
						<label
							class="cursor-pointer text-sm px-3 py-1.5 rounded-lg bg-surface-tertiary text-content hover:opacity-80 transition inline-block"
							:class="{ 'opacity-50 pointer-events-none': avatarUploading }"
						>
							{{ avatarUploading ? 'Uploading\u2026' : 'Upload photo' }}
							<input
								type="file"
								accept="image/*"
								class="hidden"
								@change="onAvatarFileChange"
								:disabled="avatarUploading"
							/>
						</label>
						<button
							v-if="auth.state.user?.avatarAssetKey"
							type="button"
							class="text-sm text-danger hover:opacity-80 text-left"
							:disabled="avatarUploading"
							@click="removeAvatar"
						>
							Remove
						</button>
					</div>
				</div>
				<div v-if="avatarMsg" :class="[avatarMsg.kind === 'ok' ? ui.success : ui.error, 'mb-4']">
					{{ avatarMsg.text }}
				</div>

				<!-- Bio -->
				<form @submit.prevent="saveBio" class="space-y-3">
					<div>
						<label :class="ui.label">Bio</label>
						<textarea
							v-model="bioInput"
							:class="ui.input"
							class="!h-24 resize-none"
							maxlength="500"
							placeholder="Tell people about yourself..."
						/>
						<div class="text-xs text-content-tertiary text-right mt-1">
							{{ bioInput.length }}/500
						</div>
					</div>
					<div v-if="bioMsg" :class="bioMsg.kind === 'ok' ? ui.success : ui.error">
						{{ bioMsg.text }}
					</div>
					<button :class="ui.button" :disabled="bioBusy">
						{{ bioBusy ? 'Saving\u2026' : 'Save bio' }}
					</button>
				</form>

				<!-- Level summary -->
				<div v-if="auth.state.user" class="mt-5 pt-4 border-t border-edge flex items-center gap-4">
					<LevelBadge :level="auth.state.user.level" :progress="auth.state.user.levelProgress" size="md" />
					<span class="text-sm text-content-secondary">{{ auth.state.user.xp.toLocaleString() }} XP</span>
				</div>
			</section>

			<!-- Theme -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Theme</h2>
				<div class="flex gap-3">
					<button
						v-for="opt in themeOptions"
						:key="opt.value"
						class="flex-1 flex flex-col items-center gap-2 rounded-xl px-4 py-3 border transition-colors"
						:class="preference === opt.value
							? 'border-accent bg-accent/10 text-content'
							: 'border-edge-secondary bg-surface-tertiary/50 text-content-secondary hover:border-edge hover:text-content'"
						@click="setTheme(opt.value)">
						<span class="text-xl">{{ opt.icon }}</span>
						<span class="text-sm font-medium">{{ opt.label }}</span>
					</button>
				</div>
			</section>

			<!-- Username -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Username</h2>
				<form @submit.prevent="saveUsername" class="space-y-3">
					<input v-model="usernameInput" :class="ui.input" />
					<div
						v-if="usernameMsg"
						:class="usernameMsg.kind === 'ok' ? ui.success : ui.error">
						{{ usernameMsg.text }}
					</div>
					<button :class="ui.button" :disabled="usernameBusy">
						{{ usernameBusy ? 'Saving\u2026' : 'Save username' }}
					</button>
				</form>
			</section>

			<!-- Email -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-1">Email</h2>
				<p class="text-sm text-content-secondary mb-4">
					Current:
					<span v-if="auth.state.user?.email" class="text-content">
						{{ auth.state.user?.email }}
						<span
							v-if="auth.state.user?.emailVerifiedAt"
							class="ml-2 text-xs text-success">verified</span>
						<span v-else class="ml-2 text-xs text-warning">unverified</span>
					</span>
					<span v-else class="text-content-tertiary">none</span>
				</p>

				<div
					v-if="auth.state.user?.pendingEmail"
					class="text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 mb-4">
					Pending change to <strong>{{ auth.state.user.pendingEmail }}</strong> — check
					that inbox to confirm.
					<button
						@click="cancelPendingEmail"
						class="ml-2 underline underline-offset-2 text-warning">
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
						{{ emailBusy ? 'Sending\u2026' : 'Update email' }}
					</button>
				</form>
			</section>

			<!-- Password -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
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
						{{ pwBusy ? 'Saving\u2026' : 'Change password' }}
					</button>
				</form>
			</section>

			<!-- Studio settings -->
			<section class="bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-1">Studio settings</h2>
				<p class="text-sm text-content-secondary mb-4">
					Configure integrations used when creating sessions.
				</p>

				<div class="border-t border-edge pt-4">
					<div class="flex items-center justify-between mb-2 gap-4">
						<label :class="ui.label">ElevenLabs API key</label>
						<span
							v-if="hasElevenlabsKey"
							class="text-xs rounded-full bg-success/10 border border-success/30 text-success px-2 py-0.5">
							Configured
						</span>
						<span
							v-else
							class="text-xs rounded-full bg-surface-tertiary/40 border border-edge-secondary text-content-secondary px-2 py-0.5">
							Not configured
						</span>
					</div>
					<p class="text-xs text-content-tertiary mb-3">
						When set, session editors can pick voices from your ElevenLabs account and
						assign them per scene. Your key is stored securely and never returned to the
						browser.
					</p>

					<form @submit.prevent="saveElevenlabsKey" class="flex items-start gap-2 mb-3">
						<input
							v-model="elevenlabsKeyInput"
							type="password"
							:class="ui.input"
							:placeholder="hasElevenlabsKey ? '\u2022\u2022\u2022 configured \u2014 enter a new key to replace' : 'sk_\u2026'"
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
							class="text-sm text-danger hover:opacity-80 px-3 py-1.5"
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
	</AppShell>
</template>
