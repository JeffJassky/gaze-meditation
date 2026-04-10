<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { uploadFile, type UploadProgress } from '@/api/uploads'
import { assetsApi } from '@/api/assets'
import type { Session, SessionAsset } from '@/api/sessions'
import { VOICES_KEY } from './voicesKey'

const session = defineModel<Session>({ required: true })

const emit = defineEmits<{
	configured: []
}>()

// --- Voices (injected from SessionEditorView) ------------------------------
const voicesState = inject(VOICES_KEY, undefined)
const voices = computed(() => voicesState?.voices.value ?? [])
const voicesLoading = computed(() => voicesState?.loading.value ?? false)
const voicesEnabled = computed(() => voicesState?.enabled.value ?? false)

// --- Steps: 'pick' → 'voice-select' → done, or 'pick' → upload → done ----
type Step = 'pick' | 'voice-select' | 'uploading' | 'error'
const step = ref<Step>('pick')

// --- AI voice selection ----------------------------------------------------
const selectedVoiceId = ref<string | null>(null)

function startAiFlow() {
	step.value = 'voice-select'
}

function confirmAiVoice() {
	if (!selectedVoiceId.value) return
	session.value.voiceOrigin = 'ai'
	session.value.voiceStructure = 'scene'
	session.value.elevenlabsVoiceId = selectedVoiceId.value
	emit('configured')
}

// --- Upload state ----------------------------------------------------------
const uploadProgress = ref<UploadProgress>({ loaded: 0, total: 0, percent: 0 })
const uploadError = ref<string | null>(null)
const uploadFileName = ref('')

function browseFile() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'audio/*'
	input.onchange = () => {
		const file = input.files?.[0]
		if (file) startUpload(file)
	}
	input.click()
}

async function startUpload(file: File) {
	step.value = 'uploading'
	uploadError.value = null
	uploadFileName.value = file.name
	uploadProgress.value = { loaded: 0, total: file.size, percent: 0 }

	try {
		const { key, contentType, size } = await uploadFile(file, 'session-audio', (p) => {
			uploadProgress.value = p
		})
		const kind = 'session-audio' as const

		let registeredId: string | undefined
		try {
			const registered = await assetsApi.register({
				kind, key, label: file.name, contentType, size,
			})
			registeredId = registered.id
		} catch (e) {
			console.warn('[VoiceModePicker] /assets register failed', e)
		}

		const asset: SessionAsset = {
			id: registeredId ?? crypto.randomUUID(),
			kind, key, label: file.name, contentType, size,
		}
		if (!session.value.assets.some((a) => a.key === key)) {
			session.value.assets = [...session.value.assets, asset]
		}

		session.value.masterAudio = { assetId: asset.id, key: asset.key }
		session.value.voiceOrigin = 'human'
		session.value.voiceStructure = 'session'
		emit('configured')
	} catch (e) {
		uploadError.value = (e as Error).message
		step.value = 'error'
	}
}
</script>

<template>
	<div class="flex flex-col items-center justify-center py-16 px-6">
		<!-- ── Step 1: Pick mode ─────────────────────────────────────── -->
		<template v-if="step === 'pick'">
			<p class="text-sm text-zinc-500 mb-8">How will this session's voice audio be created?</p>

			<div class="grid grid-cols-2 gap-4 w-full max-w-lg">
				<button
					type="button"
					class="group flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-8 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-center"
					@click="browseFile">
					<div class="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-lg transition-colors">
						&#x1F399;
					</div>
					<span class="text-sm font-medium text-zinc-200">Upload voice track</span>
					<span class="text-xs text-zinc-500 leading-relaxed">
						Upload a pre-recorded audio file.<br />
						Scenes align to sections of the recording.
					</span>
				</button>

				<button
					type="button"
					class="group flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-8 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-center"
					@click="startAiFlow">
					<div class="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-lg transition-colors">
						&#x2728;
					</div>
					<span class="text-sm font-medium text-zinc-200">AI-generated voice</span>
					<span class="text-xs text-zinc-500 leading-relaxed">
						Write scene scripts and generate<br />
						voice audio with ElevenLabs.
					</span>
				</button>
			</div>
		</template>

		<!-- ── Step 2a: Voice selection (AI path) ────────────────────── -->
		<template v-else-if="step === 'voice-select'">
			<p class="text-sm text-zinc-500 mb-6">Choose an ElevenLabs voice for this session</p>

			<div v-if="voicesLoading" class="text-xs text-zinc-600">
				Loading voices...
			</div>

			<div v-else-if="!voicesEnabled" class="text-center max-w-sm">
				<p class="text-sm text-zinc-400 mb-4">
					No ElevenLabs API key configured. Add one in your account settings to use AI-generated voices.
				</p>
				<button
					type="button"
					class="text-xs text-zinc-500 hover:text-zinc-300 transition"
					@click="step = 'pick'">
					&larr; Back
				</button>
			</div>

			<div v-else class="w-full max-w-md">
				<div class="max-h-64 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/60">
					<button
						v-for="v in voices"
						:key="v.voice_id"
						type="button"
						class="w-full text-left px-4 py-3 text-sm transition-colors"
						:class="selectedVoiceId === v.voice_id
							? 'bg-zinc-800 text-zinc-100'
							: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'"
						@click="selectedVoiceId = v.voice_id">
						<span class="font-medium">{{ v.name }}</span>
						<span v-if="v.category" class="ml-2 text-xs text-zinc-600">{{ v.category }}</span>
					</button>
				</div>

				<div class="flex items-center justify-between mt-4">
					<button
						type="button"
						class="text-xs text-zinc-500 hover:text-zinc-300 transition"
						@click="step = 'pick'">
						&larr; Back
					</button>
					<button
						type="button"
						class="text-sm font-medium px-4 py-1.5 rounded-lg transition"
						:class="selectedVoiceId
							? 'bg-zinc-100 text-zinc-900 hover:bg-white'
							: 'bg-zinc-800 text-zinc-600 cursor-not-allowed'"
						:disabled="!selectedVoiceId"
						@click="confirmAiVoice">
						Continue
					</button>
				</div>
			</div>
		</template>

		<!-- ── Uploading ─────────────────────────────────────────────── -->
		<template v-else-if="step === 'uploading'">
			<div class="w-full max-w-md">
				<div class="text-sm text-zinc-300 mb-2 truncate">
					Uploading {{ uploadFileName }}
				</div>
				<div class="h-2 rounded-full bg-zinc-800 overflow-hidden">
					<div
						class="h-full bg-sky-500 transition-all"
						:style="{ width: uploadProgress.percent + '%' }" />
				</div>
				<div class="text-xs text-zinc-500 mt-1.5">{{ uploadProgress.percent }}%</div>
			</div>
		</template>

		<!-- ── Error ──────────────────────────────────────────────────── -->
		<template v-else-if="step === 'error'">
			<div class="w-full max-w-md text-center">
				<p class="text-sm text-red-400 mb-4">Upload failed: {{ uploadError }}</p>
				<button
					type="button"
					class="text-sm text-zinc-400 hover:text-white transition"
					@click="step = 'pick'">
					Try again
				</button>
			</div>
		</template>
	</div>
</template>
