<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Session } from '@/api/sessions'
import type { ThemeConfig } from '@shared/types'
import { normalizeHex } from '@/utils/colorInput'
import InspectorSection from './InspectorSection.vue'
import ThemeColorEditor from './ThemeColorEditor.vue'
import AssetPicker from './AssetPicker.vue'
import SoundboardSamplesPanel from './SoundboardSamplesPanel.vue'

const session = defineModel<Session>({ required: true })

const collapsed = ref(false)

// --- Theme ------------------------------------------------------------------
const theme = computed<ThemeConfig>({
	get: () => session.value.theme ?? {},
	set: (v) => (session.value.theme = v),
})

function setBackgroundColor(value: string) {
	const next = { ...theme.value }
	const normalized = normalizeHex(value)
	if (!normalized) delete next.backgroundColor
	else next.backgroundColor = normalized
	session.value.theme = next
}

function setTintColor(value: string) {
	const normalized = normalizeHex(value)
	if (!normalized) {
		const next = { ...theme.value }
		delete next.tint
		session.value.theme = next
	} else {
		session.value.theme = {
			...theme.value,
			tint: { color: normalized, opacity: theme.value.tint?.opacity ?? 0 },
		}
	}
}
function setTintOpacity(value: string) {
	const n = Number(value)
	if (Number.isNaN(n)) return
	session.value.theme = {
		...theme.value,
		tint: { color: theme.value.tint?.color ?? '#000000', opacity: n },
	}
}

// --- Audio helpers ----------------------------------------------------------
function setBinauralHz(v: string) {
	const hz = Number(v)
	if (Number.isNaN(hz)) return
	const audio = session.value.audio ?? {}
	audio.binaural = { ...audio.binaural, hertz: hz }
	session.value.audio = audio
}
function setBinauralVol(v: string) {
	const vol = Number(v)
	if (Number.isNaN(vol)) return
	const audio = session.value.audio ?? {}
	audio.binaural = { ...audio.binaural, volume: vol }
	session.value.audio = audio
}
const binauralEnabled = computed({
	get: () => session.value.audio?.binaural?.enabled !== false,
	set: (v: boolean) => {
		const audio = session.value.audio ?? {}
		audio.binaural = { ...audio.binaural, enabled: v }
		session.value.audio = audio
	},
})

function setMusicTrack(key: string) {
	const audio = session.value.audio ?? {}
	audio.musicTrack = key || undefined
	session.value.audio = audio
}

// --- Settings helpers -------------------------------------------------------
function setSetting(key: string, value: string) {
	const settings = session.value.settings ?? {}
	if (value) (settings as Record<string, unknown>)[key] = value
	else delete (settings as Record<string, unknown>)[key]
	session.value.settings = settings
}

// --- Settings helpers (asset keys) ------------------------------------------
const spiralKey = computed({
	get: () => session.value.settings?.spiralBackground as string ?? null,
	set: (v: string | null) => setSetting('spiralBackground', v ?? ''),
})
const videoKey = computed({
	get: () => session.value.settings?.videoBackground as string ?? null,
	set: (v: string | null) => setSetting('videoBackground', v ?? ''),
})
const musicKey = computed({
	get: () => session.value.audio?.musicTrack ?? null,
	set: (v: string | null) => setMusicTrack(v ?? ''),
})
</script>

<template>
	<aside
		class="border-r border-edge bg-surface flex flex-col min-h-0 transition-all shrink-0 overflow-hidden"
		:class="collapsed ? 'w-10' : 'w-64'">
		<!-- Collapse toggle / collapsed label -->
		<button
			type="button"
			class="shrink-0 text-xs text-content-tertiary hover:text-content transition border-b border-edge"
			:class="collapsed ? 'flex items-center justify-center w-full flex-1' : 'h-10 flex items-center gap-2 px-3'"
			:title="collapsed ? 'Expand settings' : 'Collapse settings'"
			@click="collapsed = !collapsed">
			<span
				v-if="collapsed"
				class="text-[10px] uppercase tracking-wider whitespace-nowrap"
				style="writing-mode: vertical-lr;">Settings</span>
			<template v-else>
				<svg
					width="14" height="14" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
					class="shrink-0">
					<polyline points="15 18 9 12 15 6" />
				</svg>
				<span class="text-[10px] uppercase tracking-wider flex-1 text-left">Settings</span>
			</template>
		</button>

		<!-- Expanded content -->
		<div v-if="!collapsed" class="flex-1 overflow-y-auto">
			<InspectorSection title="Background" storage-key="session-visuals" :default-open="true">
				<div class="space-y-3">
					<div>
						<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">Color</label>
						<div class="flex items-center gap-2">
							<input
								class="flex-1 min-w-0 bg-surface border border-edge rounded px-2 py-1 text-xs text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono"
								:value="(theme.backgroundColor as string) || ''"
								placeholder="#000000"
								@input="(e) => setBackgroundColor((e.target as HTMLInputElement).value)" />
							<input
								type="color"
								class="w-6 h-6 rounded-full border border-edge-secondary bg-surface shrink-0 cursor-pointer appearance-none"
								:value="(theme.backgroundColor as string) || '#000000'"
								@input="(e) => setBackgroundColor((e.target as HTMLInputElement).value)" />
						</div>
					</div>
					<div>
						<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">Spiral</label>
						<AssetPicker
							v-model="spiralKey"
							:kind="['spiral', 'image']"
							placeholder="None" />
					</div>
					<div>
						<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">Video BG</label>
						<AssetPicker
							v-model="videoKey"
							kind="video"
							placeholder="None" />
					</div>
					<div>
						<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">Tint color</label>
						<div class="flex items-center gap-2">
							<input
								class="flex-1 min-w-0 bg-surface border border-edge rounded px-2 py-1 text-xs text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono"
								:value="theme.tint?.color ?? ''"
								placeholder="#000000"
								@input="(e) => setTintColor((e.target as HTMLInputElement).value)" />
							<input
								type="color"
								class="w-6 h-6 rounded-full border border-edge-secondary bg-surface shrink-0 cursor-pointer appearance-none"
								:value="theme.tint?.color ?? '#000000'"
								@input="(e) => setTintColor((e.target as HTMLInputElement).value)" />
						</div>
					</div>
					<div>
						<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">Tint opacity</label>
						<input
							type="range"
							class="w-full h-1 rounded-full appearance-none cursor-pointer binaural-slider"
							min="0" max="1" step="0.05"
							:value="theme.tint?.opacity ?? 0"
							@input="(e) => setTintOpacity((e.target as HTMLInputElement).value)" />
					</div>
				</div>
			</InspectorSection>

			<InspectorSection title="Music" storage-key="session-music" :default-open="false">
				<AssetPicker
					v-model="musicKey"
					kind="music"
					placeholder="None" />
			</InspectorSection>

			<InspectorSection title="Binaural" storage-key="session-binaural" :default-open="false">
				<div class="space-y-3">
					<label class="flex items-center gap-2 text-xs text-content-secondary">
						<input type="checkbox" v-model="binauralEnabled" class="accent-content-secondary" />
						Enable binaural beats
					</label>
					<template v-if="binauralEnabled">
						<div>
							<div class="flex items-center justify-between mb-1">
								<label class="text-[10px] uppercase tracking-wider text-content-tertiary">Frequency</label>
								<span class="text-[10px] text-content-tertiary tabular-nums">{{ session.audio?.binaural?.hertz ?? 6 }} Hz</span>
							</div>
							<input
								type="range"
								class="w-full h-1 rounded-full appearance-none cursor-pointer binaural-slider"
								min="2" max="18" step="0.5"
								:value="session.audio?.binaural?.hertz ?? 6"
								@input="setBinauralHz(($event.target as HTMLInputElement).value)" />
						</div>
						<div>
							<div class="flex items-center justify-between mb-1">
								<label class="text-[10px] uppercase tracking-wider text-content-tertiary">Volume</label>
								<span class="text-[10px] text-content-tertiary tabular-nums">{{ Math.round((session.audio?.binaural?.volume ?? 0.5) * 100) }}%</span>
							</div>
							<input
								type="range"
								class="w-full h-1 rounded-full appearance-none cursor-pointer binaural-slider"
								min="0" max="1" step="0.05"
								:value="session.audio?.binaural?.volume ?? 0.5"
								@input="setBinauralVol(($event.target as HTMLInputElement).value)" />
						</div>
					</template>
				</div>
			</InspectorSection>

			<InspectorSection
				title="Soundboard"
				storage-key="session-soundboard"
				:default-open="false"
				:badge="session.audio?.soundboard?.length || undefined">
				<SoundboardSamplesPanel v-model="session" />
			</InspectorSection>

			<InspectorSection title="Colors" storage-key="session-theme" :default-open="false">
				<ThemeColorEditor v-model="theme" hide-background hide-tint />
			</InspectorSection>
		</div>
	</aside>
</template>

<style scoped>
input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
input[type="color"]::-webkit-color-swatch { border: none; border-radius: 9999px; }
input[type="color"]::-moz-color-swatch { border: none; border-radius: 9999px; }
.binaural-slider { background: #3f3f46; }
.binaural-slider::-webkit-slider-thumb {
	-webkit-appearance: none; width: 10px; height: 10px;
	border-radius: 50%; background: #a1a1aa; cursor: pointer; border: none;
}
.binaural-slider::-moz-range-thumb {
	width: 10px; height: 10px;
	border-radius: 50%; background: #a1a1aa; cursor: pointer; border: none;
}
</style>
