import { reactive, readonly } from 'vue'
import { authApi, type AuthUser } from '../services/auth'

interface AuthState {
	user: AuthUser | null
	hydrated: boolean
	loading: boolean
}

const state = reactive<AuthState>({
	user: null,
	hydrated: false,
	loading: false,
})

let hydratePromise: Promise<void> | null = null

async function hydrate(): Promise<void> {
	if (state.hydrated) return
	if (hydratePromise) return hydratePromise
	hydratePromise = (async () => {
		try {
			state.user = await authApi.me()
		} catch {
			state.user = null
		} finally {
			state.hydrated = true
			hydratePromise = null
		}
	})()
	return hydratePromise
}

async function login(username: string, password: string) {
	state.loading = true
	try {
		state.user = await authApi.login({ username, password })
		state.hydrated = true
	} finally {
		state.loading = false
	}
}

async function register(username: string, password: string, email?: string) {
	state.loading = true
	try {
		state.user = await authApi.register({ username, password, email })
		state.hydrated = true
	} finally {
		state.loading = false
	}
}

async function logout() {
	await authApi.logout()
	state.user = null
}

function setUser(user: AuthUser | null) {
	state.user = user
}

export const auth = {
	state: readonly(state),
	hydrate,
	login,
	register,
	logout,
	setUser,
}
