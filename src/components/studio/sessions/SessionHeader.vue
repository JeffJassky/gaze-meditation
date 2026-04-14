<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import type { Session, SessionAsset } from '@/api/sessions'
import { SESSION_AUDIENCE } from '@shared/constants/session'
import { VOICES_KEY } from './voicesKey'
import { uploadFile } from '@/api/uploads'
import { assetsApi } from '@/api/assets'
import { assetUrl } from '@/utils/assetUrl'

/**
 * Blog-style session header rendered at the top of the scrolling script
 * stack. Everything is edit-in-place — title and description are
 * contenteditable spans, tags are a comma-edit field, audience /
 * visibility / adult rating are tiny inline selects styled to read as
 * metadata chips.
 */
const session = defineModel<Session>({ required: true })

// ──────────────────────────────────────────────────────────────────────
// Title — contenteditable, kept in sync via the same pattern as the
// toolbar title. We don't use v-model because contenteditable inputs
// don't emit `input` events in a way Vue's v-model understands cleanly.
// ──────────────────────────────────────────────────────────────────────
const titleEl = ref<HTMLElement | null>(null)
watch(
	() => session.value.title,
	async (t) => {
		await nextTick()
		if (!titleEl.value) return
		if (document.activeElement === titleEl.value) return
		if (titleEl.value.innerText !== (t ?? '')) {
			titleEl.value.innerText = t ?? ''
		}
	},
	{ immediate: true },
)
function onTitleInput(e: Event) {
	const text = (e.target as HTMLElement).innerText.replace(/\n/g, '').trim()
	session.value.title = text
}
function onTitleKey(e: KeyboardEvent) {
	if (e.key === 'Enter') {
		e.preventDefault()
		;(e.target as HTMLElement).blur()
	}
}

// ──────────────────────────────────────────────────────────────────────
// Description — same pattern, but allows newlines.
// ──────────────────────────────────────────────────────────────────────
const descEl = ref<HTMLElement | null>(null)
watch(
	() => session.value.description,
	async (d) => {
		await nextTick()
		if (!descEl.value) return
		if (document.activeElement === descEl.value) return
		if (descEl.value.innerText !== (d ?? '')) {
			descEl.value.innerText = d ?? ''
		}
	},
	{ immediate: true },
)
function onDescInput(e: Event) {
	session.value.description = (e.target as HTMLElement).innerText
}

// ──────────────────────────────────────────────────────────────────────
// Tags — comma-separated, edited as a single string.
// ──────────────────────────────────────────────────────────────────────
const tagsText = computed({
	get: () => session.value.tags.join(', '),
	set: (v: string) => {
		session.value.tags = v
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	},
})

// ──────────────────────────────────────────────────────────────────────
// Voice — display label (set via VoiceModePicker, editable here only to reset)
// ──────────────────────────────────────────────────────────────────────
const voicesState = inject(VOICES_KEY, undefined)
const voices = computed(() => voicesState?.voices.value ?? [])

const voiceLabel = computed(() => {
	const origin = session.value.voiceOrigin
	if (!origin) return 'voice not set'
	if (origin === 'human') return 'human voice'
	// AI — show the ElevenLabs voice name if we can resolve it.
	const vid = session.value.elevenlabsVoiceId
	if (vid) {
		const v = voices.value.find((v) => v.voice_id === vid)
		return v ? v.name : vid
	}
	return 'ai voice'
})

function resetVoiceConfig() {
	session.value.voiceOrigin = undefined
	session.value.voiceStructure = undefined
	session.value.elevenlabsVoiceId = null
	session.value.masterAudio = undefined
}

// ──────────────────────────────────────────────────────────────────────
// Cover image
// ──────────────────────────────────────────────────────────────────────
const coverUploading = ref(false)

const coverUrl = computed(() => {
	const id = session.value.coverAssetId
	if (!id) return null
	const asset = session.value.assets?.find((a) => a.id === id)
	return asset ? assetUrl(asset.key) : null
})

function browseCoverImage() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'image/*'
	input.onchange = () => {
		const file = input.files?.[0]
		if (file) uploadCover(file)
	}
	input.click()
}

async function uploadCover(file: File) {
	coverUploading.value = true
	try {
		const { key, contentType, size } = await uploadFile(file, 'image')
		const kind = 'image' as const

		let registeredId: string | undefined
		try {
			const registered = await assetsApi.register({
				kind, key, label: file.name, contentType, size,
			})
			registeredId = registered.id
		} catch (e) {
			console.warn('[SessionHeader] asset register failed', e)
		}

		const asset: SessionAsset = {
			id: registeredId ?? crypto.randomUUID(),
			kind, key, label: file.name, contentType, size,
		}
		if (!session.value.assets.some((a) => a.key === key)) {
			session.value.assets = [...session.value.assets, asset]
		}
		session.value.coverAssetId = asset.id
	} catch (e) {
		console.error('[SessionHeader] cover upload failed', e)
	} finally {
		coverUploading.value = false
	}
}

function removeCover() {
	session.value.coverAssetId = null
}

// ──────────────────────────────────────────────────────────────────────
// Helpers — human-readable labels for the metadata chips.
// ──────────────────────────────────────────────────────────────────────
const audienceLabel = computed(() => session.value.audience || 'unspecified')
const visibilityLabel = computed(() =>
	session.value.visibility === 'public' ? 'public' : 'private',
)
</script>

<template>
	<header class="pb-10 mb-10 border-b border-surface-secondary">
		<!-- Cover image -->
		<div v-if="coverUrl" class="relative -mx-1 mb-4 rounded-lg overflow-hidden group">
			<img
				:src="coverUrl!"
				alt="Session cover"
				class="w-full h-40 object-cover" />
			<button
				type="button"
				class="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] text-content-secondary hover:text-content opacity-0 group-hover:opacity-100 transition-opacity"
				@click="removeCover">
				Remove
			</button>
		</div>

		<!-- Status pill + cover upload button -->
		<div class="flex items-center justify-between mb-3">
			<span
				class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
				:class="
					session.status === 'published'
						? 'bg-success/10 border border-success/30 text-success'
						: 'bg-warning/10 border border-warning/30 text-warning'
				">
				{{ session.status }}
			</span>
			<button
				v-if="!coverUrl"
				type="button"
				class="text-[11px] text-content-tertiary hover:text-content-secondary transition-colors"
				:disabled="coverUploading"
				@click="browseCoverImage">
				{{ coverUploading ? 'Uploading...' : '+ Cover Image' }}
			</button>
		</div>

		<!-- Title -->
		<h1
			ref="titleEl"
			class="text-4xl font-semibold tracking-tight text-content outline-none rounded px-1 -mx-1 focus:bg-surface-secondary/60 focus:ring-1 focus:ring-edge-secondary empty:before:content-['Untitled_session'] empty:before:text-content-tertiary"
			:contenteditable="true"
			spellcheck="false"
			@input="onTitleInput"
			@keydown="onTitleKey" />

		<!-- Description -->
		<p
			ref="descEl"
			class="mt-3 text-[17px] leading-[1.6] text-content-secondary font-serif italic outline-none rounded px-1 -mx-1 focus:bg-surface-secondary/60 focus:ring-1 focus:ring-edge-secondary empty:before:content-['Add_a_description…'] empty:before:text-content-tertiary empty:before:not-italic empty:before:font-sans"
			:contenteditable="true"
			spellcheck="false"
			@input="onDescInput" />

		<!-- Metadata row: audience · visibility · adult · tags -->
		<div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono uppercase tracking-wider text-content-tertiary">
			<!-- Voice (display + reset) -->
			<span class="text-content-tertiary">
				{{ voiceLabel }}
			</span>
			<button
				v-if="session.voiceStructure"
				type="button"
				class="text-content-tertiary hover:text-content-secondary transition-colors"
				title="Reset voice configuration"
				@click="resetVoiceConfig">
				&times;
			</button>

			<span class="text-edge">·</span>

			<!-- Audience -->
			<label class="relative group">
				<span class="hover:text-content-secondary transition-colors cursor-pointer">
					{{ audienceLabel }}
				</span>
				<select
					v-model="session.audience"
					class="absolute inset-0 opacity-0 cursor-pointer w-full">
					<option v-for="a in SESSION_AUDIENCE" :key="a" :value="a">{{ a }}</option>
				</select>
			</label>

			<span class="text-edge">·</span>

			<!-- Visibility -->
			<label class="relative group">
				<span class="hover:text-content-secondary transition-colors cursor-pointer">
					{{ visibilityLabel }}
				</span>
				<select
					v-model="session.visibility"
					class="absolute inset-0 opacity-0 cursor-pointer w-full">
					<option value="private">private</option>
					<option value="public">public</option>
				</select>
			</label>

			<span class="text-edge">·</span>

			<!-- Adult -->
			<label class="flex items-center gap-1.5 cursor-pointer hover:text-content-secondary transition-colors">
				<input
					type="checkbox"
					v-model="session.isAdult"
					class="w-3 h-3 accent-content-secondary" />
				<span>18+</span>
			</label>

			<span class="text-edge">·</span>

			<!-- Tags -->
			<div class="flex items-center gap-1.5 flex-1 min-w-[12ch]">
				<span class="text-content-tertiary">#</span>
				<input
					v-model="tagsText"
					class="flex-1 bg-transparent border-0 outline-none text-[11px] font-mono uppercase tracking-wider text-content-tertiary hover:text-content-secondary focus:text-content-secondary placeholder-content-tertiary transition-colors"
					placeholder="tags, comma, separated" />
			</div>
		</div>
	</header>
</template>
