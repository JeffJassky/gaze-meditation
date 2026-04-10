<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { su } from '@/components/ui/studioUi'
import type { SessionAsset } from '@/api/sessions'
import type { AssetKind } from '@/api/assets'
import { ASSET_KIND_CONFIG } from '@/api/assets'
import { uploadFile } from '@/api/uploads'
import { assetsApi } from '@/api/assets'
import { assetUrl } from '@/utils/assetUrl'
import { AUDIO_ASSETS_KEY } from './audioAssetsKey'

const props = defineProps<{
	kind: AssetKind | AssetKind[]
	modelValue: string | null
	placeholder?: string
}>()

const emit = defineEmits<{
	'update:modelValue': [key: string | null]
}>()

const allAssets = inject(AUDIO_ASSETS_KEY, computed(() => [] as SessionAsset[]))
const open = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

// Audio preview state.
const playingKey = ref<string | null>(null)
let audioEl: HTMLAudioElement | null = null

const kinds = computed<AssetKind[]>(() =>
	Array.isArray(props.kind) ? props.kind : [props.kind],
)
const primaryKind = computed(() => kinds.value[0]!)
const config = computed(() => ASSET_KIND_CONFIG[primaryKind.value])

const isVisualKind = computed(() =>
	kinds.value.some((k) => k === 'image' || k === 'spiral' || k === 'video'),
)
const isAudioKind = computed(() =>
	kinds.value.some((k) => k === 'music' || k === 'fx' || k === 'voice' || k === 'session-audio'),
)

const filteredAssets = computed(() =>
	allAssets.value.filter((a) => kinds.value.includes(a.kind as AssetKind)),
)
const systemAssets = computed(() => filteredAssets.value.filter((a) => (a as any).isSystem))
const userAssets = computed(() => filteredAssets.value.filter((a) => !(a as any).isSystem))

const selectedAsset = computed(() =>
	props.modelValue
		? filteredAssets.value.find((a) => a.key === props.modelValue || a.id === props.modelValue)
		: null,
)

function displayName(a: SessionAsset): string {
	if (a.label) return a.label.replace(/\.[^.]+$/, '')
	const segments = a.key.split('/')
	return (segments[segments.length - 1] ?? a.key).replace(/\.[^.]+$/, '')
}

function select(asset: SessionAsset) {
	stopAudio()
	emit('update:modelValue', asset.key)
	open.value = false
}

function clear() {
	stopAudio()
	emit('update:modelValue', null)
	open.value = false
}

function browseFile() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = config.value?.accept ?? '*'
	input.onchange = () => {
		const file = input.files?.[0]
		if (file) doUpload(file)
	}
	input.click()
}

async function doUpload(file: File) {
	uploading.value = true
	uploadError.value = null
	try {
		const { key, contentType, size } = await uploadFile(file, primaryKind.value)
		try {
			await assetsApi.register({
				kind: primaryKind.value,
				key,
				label: file.name,
				contentType,
				size,
			})
		} catch (e) {
			console.warn('[AssetPicker] register failed', e)
		}
		emit('update:modelValue', key)
		open.value = false
	} catch (e) {
		uploadError.value = (e as Error).message
	} finally {
		uploading.value = false
	}
}

function toggleAudio(key: string, e: MouseEvent) {
	e.stopPropagation()
	if (playingKey.value === key) {
		stopAudio()
	} else {
		stopAudio()
		const url = assetUrl(key)
		audioEl = new Audio(url)
		audioEl.onended = () => { playingKey.value = null }
		audioEl.play().catch(() => { playingKey.value = null })
		playingKey.value = key
	}
}

function stopAudio() {
	if (audioEl) {
		audioEl.pause()
		audioEl.src = ''
		audioEl = null
	}
	playingKey.value = null
}
</script>

<template>
	<div class="relative">
		<!-- Trigger -->
		<button
			type="button"
			:class="[su.select, 'text-xs text-left']"
			@click.stop="open = !open">
			<span v-if="selectedAsset" class="truncate">{{ displayName(selectedAsset) }}</span>
			<span v-else class="text-zinc-600">{{ placeholder ?? 'Select...' }}</span>
		</button>

		<!-- Backdrop -->
		<Teleport to="body">
			<div
				v-if="open"
				class="fixed inset-0 z-40"
				@click="open = false; stopAudio()" />
		</Teleport>

		<!-- Dropdown -->
		<div
			v-if="open"
			class="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">

			<!-- Actions -->
			<div class="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-2 flex gap-2 z-10">
				<button
					type="button"
					class="flex-1 text-xs text-center py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
					:disabled="uploading"
					@click.stop="browseFile">
					{{ uploading ? 'Uploading...' : `+ Upload` }}
				</button>
				<button
					v-if="modelValue"
					type="button"
					class="text-xs px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 transition"
					@click.stop="clear">
					Clear
				</button>
			</div>

			<div v-if="uploadError" class="px-3 py-2 text-xs text-red-400">
				{{ uploadError }}
			</div>

			<!-- Empty -->
			<div
				v-if="filteredAssets.length === 0 && !uploading"
				class="px-3 py-6 text-center text-xs text-zinc-600">
				No {{ config?.label?.toLowerCase() ?? 'assets' }} yet.
			</div>

			<!-- Asset list renderer -->
			<template v-for="(section, sIdx) in [
				{ label: 'Defaults', items: systemAssets },
				{ label: userAssets.length && systemAssets.length ? 'Yours' : '', items: userAssets },
			]" :key="sIdx">
				<template v-if="section.items.length > 0">
					<div v-if="section.label" class="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-zinc-600">
						{{ section.label }}
					</div>
					<button
						v-for="a in section.items"
						:key="a.id"
						type="button"
						class="w-full text-left px-2 py-1.5 transition-colors flex items-center gap-2"
						:class="a.key === modelValue ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'"
						@click.stop="select(a)">

						<!-- Visual preview (image/spiral) -->
						<img
							v-if="isVisualKind && a.key"
							:src="assetUrl(a.key)"
							class="w-8 h-8 rounded object-cover bg-zinc-800 shrink-0"
							alt="" />

						<!-- Audio play button -->
						<button
							v-if="isAudioKind"
							type="button"
							class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] transition"
							:class="playingKey === a.key
								? 'bg-sky-500/20 text-sky-300'
								: 'bg-zinc-800 text-zinc-500 hover:text-zinc-200'"
							@click="toggleAudio(a.key, $event)">
							{{ playingKey === a.key ? '&#9632;' : '&#9654;' }}
						</button>

						<span class="flex-1 min-w-0 text-[11px] truncate">{{ displayName(a) }}</span>
					</button>
				</template>
			</template>
		</div>
	</div>
</template>
