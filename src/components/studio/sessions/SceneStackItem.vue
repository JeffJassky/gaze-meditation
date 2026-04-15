<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import SceneTextPanel from './SceneTextPanel.vue'
import { VOICES_KEY } from './voicesKey'
import { BEHAVIOR_BY_TYPE } from './behaviorCatalog'
import { SOUNDBOARD_SAMPLES_KEY } from './soundboardSamplesKey'
import SceneFeatureBar from './SceneFeatureBar.vue'
import type { SceneBlock } from '@/api/sessions'

/**
 * A single scene in the stacked script editor.
 *
 * The voice picker sits immediately to the left of the voice textarea so it
 * reads as a label — "[Voice name] says: …". When selected, the scene grows
 * a drag handle in the left margin that opens a flyout with destructive
 * actions (duplicate / delete).
 */
const scene = defineModel<SceneBlock>({ required: true })
const props = defineProps<{ index: number; active: boolean }>()
const emit = defineEmits<{
	select: []
	duplicate: []
	delete: []
	advance: []
	deleteBackward: []
}>()

void props

const configModel = computed({
	get: () => {
		// Ensure the scene always has a config object so mutations propagate.
		if (!scene.value.config) scene.value.config = {}
		return scene.value.config
	},
	set: (v) => (scene.value.config = v),
})

// --- Voice override --------------------------------------------------------
const voicesState = inject(VOICES_KEY, undefined)
const voiceOverrideId = computed({
	get: () => scene.value.config?.elevenlabsVoiceId ?? '',
	set: (v: string) => {
		if (!scene.value.config) scene.value.config = {}
		if (v) scene.value.config.elevenlabsVoiceId = v
		else delete scene.value.config.elevenlabsVoiceId
	},
})
// Effective voice id = scene override OR session default.
const effectiveVoiceId = computed(
	() => voiceOverrideId.value || voicesState?.sessionVoiceId.value || '',
)
const currentVoiceName = computed(() => {
	const id = effectiveVoiceId.value
	if (!id) return 'No voice'
	const v = voicesState?.voices.value.find((x) => x.voice_id === id)
	return v?.name ?? 'Voice'
})

// --- Theme override reflection --------------------------------------------
// Mirror the per-scene theme in the editor's script stack so the writer
// can see at a glance which scenes have overrides and roughly how they'll
// look. We only apply what's meaningfully previewable in a dense list:
// background color (as the scene item's background) and the two text
// colors (voice → uiTextColor, on-screen → promptTextColor). Anything
// else stays un-previewed.
interface SceneTheme {
	backgroundColor?: string
	uiTextColor?: string
	promptTextColor?: string
	tint?: { color: string; opacity: number }
}
const themeOverride = computed<SceneTheme | null>(() => {
	const t = scene.value.config?.theme
	if (!t || typeof t !== 'object') return null
	return t as SceneTheme
})

// --- Right-side metadata column -------------------------------------------
// Summarises a few inspector panel states inline so the writer can see
// at a glance which scenes do what without opening the inspector.
const behaviorLabels = computed<string[]>(() => {
	const sugs = scene.value.config?.behavior?.suggestions
	if (!sugs || sugs.length === 0) return []
	return sugs.map((s) => BEHAVIOR_BY_TYPE[s.type]?.label ?? s.type)
})
const behaviorSummary = computed(() => behaviorLabels.value.join(' + '))
const binauralHz = computed<number | null>(() => {
	const hz = scene.value.config?.audio?.binaural?.hertz
	if (typeof hz !== 'number' || !Number.isFinite(hz)) return null
	return hz
})
// --- Soundboard events -----------------------------------------------------
const soundboardSamples = inject(SOUNDBOARD_SAMPLES_KEY, computed(() => []))
const soundboardEvents = computed(() => {
	const evts = scene.value.config?.audio?.soundboard
	if (!evts || evts.length === 0) return []
	return evts.map((e) => {
		const sample = soundboardSamples.value.find((s) => s.id === e.id)
		const name = sample?.path
			? (sample.path.split('/').pop() ?? sample.id).replace(/\.[^.]+$/, '')
			: e.id
		return { event: e.event, name }
	})
})

// --- Haptic events ---------------------------------------------------------
import { HAPTIC_PRESETS } from '@shared/constants/haptics'
const hapticEvents = computed(() => {
	const evts = scene.value.config?.haptics?.events
	if (!evts || evts.length === 0) return []
	return evts.map((e) => {
		const preset = HAPTIC_PRESETS.find((p) => p.key === e.id)
		return { event: e.event, name: preset?.label ?? e.id }
	})
})

function msToDisplaySeconds(ms: number | undefined): number | null {
	if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return null
	return Math.round((ms / 1000) * 10) / 10
}
const cooldownSeconds = computed<number | null>(() =>
	msToDisplaySeconds(scene.value.config?.cooldown),
)
const fadeInSeconds = computed<number | null>(() =>
	msToDisplaySeconds(scene.value.config?.fadeInDuration),
)
const fadeOutSeconds = computed<number | null>(() =>
	msToDisplaySeconds(scene.value.config?.fadeOutDuration),
)

// --- Theme setters (active scene) -------------------------------------------
import { normalizeHex } from '@/utils/colorInput'

function setBackgroundColor(v: string) {
	const theme = { ...(configModel.value.theme ?? {}) }
	const normalized = normalizeHex(v)
	if (!normalized) delete theme.backgroundColor
	else theme.backgroundColor = normalized
	configModel.value.theme = Object.keys(theme).length > 0 ? theme : undefined
}

function setTintColor(v: string) {
	const theme = { ...(configModel.value.theme ?? {}) }
	const normalized = normalizeHex(v)
	if (!normalized) {
		delete theme.tint
	} else {
		theme.tint = { color: normalized, opacity: theme.tint?.opacity ?? 0.3 }
	}
	configModel.value.theme = Object.keys(theme).length > 0 ? theme : undefined
}

function setTintOpacity(v: string) {
	const n = Number(v)
	if (Number.isNaN(n)) return
	const theme = { ...(configModel.value.theme ?? {}) }
	theme.tint = { color: theme.tint?.color ?? '#000000', opacity: n }
	configModel.value.theme = theme
}

function setPromptTextColor(v: string) {
	const theme = { ...(configModel.value.theme ?? {}) }
	const normalized = normalizeHex(v)
	if (!normalized) delete theme.promptTextColor
	else theme.promptTextColor = normalized
	configModel.value.theme = Object.keys(theme).length > 0 ? theme : undefined
}

// --- Timing setters (active scene) ------------------------------------------
function setFadeIn(v: string) {
	const n = Number(v)
	configModel.value.fadeInDuration = n > 0 ? n * 1000 : undefined
}
function setFadeOut(v: string) {
	const n = Number(v)
	configModel.value.fadeOutDuration = n > 0 ? n * 1000 : undefined
}
function setCooldown(v: string) {
	const n = Number(v)
	configModel.value.cooldown = n > 0 ? n * 1000 : undefined
}

// --- Inline voice/text editing (active scene) ------------------------------
const voiceRef = ref<HTMLTextAreaElement | null>(null)
const textRef = ref<HTMLTextAreaElement | null>(null)

function toText(v: unknown): string {
	if (Array.isArray(v)) return v.join('\n')
	if (typeof v === 'string') return v
	return ''
}
function fromText(v: string): string | string[] {
	const lines = v.split('\n').map((l) => l.trimEnd())
	const meaningful = lines.filter((l) => l.length > 0)
	return meaningful.length > 1 ? lines : v
}

const voiceText = computed(() => toText(configModel.value.voice))
const onScreenText = computed(() => toText(configModel.value.text))

function onVoiceInput(e: Event) {
	configModel.value.voice = fromText((e.target as HTMLTextAreaElement).value)
}
function onTextInput(e: Event) {
	configModel.value.text = fromText((e.target as HTMLTextAreaElement).value)
}
function onVoiceEnter(e: KeyboardEvent) {
	if (e.shiftKey) return
	e.preventDefault()
	textRef.value?.focus()
}
function onTextEnter(e: KeyboardEvent) {
	if (e.shiftKey) return
	e.preventDefault()
	emit('advance')
}
function onVoiceBackspace(e: KeyboardEvent) {
	if (voiceText.value.length === 0 && onScreenText.value.length === 0) {
		e.preventDefault()
		emit('deleteBackward')
	}
}
function onTextBackspace(e: KeyboardEvent) {
	if (onScreenText.value.length === 0) {
		e.preventDefault()
		voiceRef.value?.focus()
	}
}

// --- Handle flyout ---------------------------------------------------------
const menuOpen = ref(false)
const handleRef = ref<HTMLElement | null>(null)
function toggleMenu() {
	menuOpen.value = !menuOpen.value
}
function onWindowClick(e: MouseEvent) {
	if (!handleRef.value) return
	if (!handleRef.value.contains(e.target as Node)) menuOpen.value = false
}
watch(menuOpen, (v) => {
	if (v) setTimeout(() => window.addEventListener('click', onWindowClick), 0)
	else window.removeEventListener('click', onWindowClick)
})
onBeforeUnmount(() => window.removeEventListener('click', onWindowClick))
</script>

<template>
	<section
		:data-scene-id="scene.id"
		class="group scroll-mt-10 relative rounded-lg transition-colors cursor-text px-4 py-4 -mx-4"
		:class="[
			active ? 'ring-1 ring-edge-secondary' : '',
			!themeOverride?.backgroundColor && active ? 'bg-surface-secondary/60' : '',
			!themeOverride?.backgroundColor && !active ? 'hover:bg-surface-secondary/20' : '',
		]"
		:style="
			themeOverride?.backgroundColor
				? { backgroundColor: themeOverride.backgroundColor }
				: undefined
		"
		@click.stop="$emit('select')">

		<!-- Drag handle + flyout. Visible on hover, always visible when
		     this scene is the selected one. -->
		<div
			ref="handleRef"
			class="absolute -left-6 top-5 flex flex-col items-center transition-opacity"
			:class="active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
			<button
				type="button"
				tabindex="-1"
				class="scene-drag-handle flex items-center justify-center p-1.5 rounded-md text-content-tertiary hover:text-content hover:bg-surface-tertiary cursor-grab active:cursor-grabbing transition-colors"
				v-tooltip="'Drag or click for options'"
				@click.stop="toggleMenu">
				<svg
					width="10"
					height="16"
					viewBox="0 0 10 16"
					fill="currentColor"
					aria-hidden="true">
					<circle cx="2" cy="3" r="1.3" />
					<circle cx="8" cy="3" r="1.3" />
					<circle cx="2" cy="8" r="1.3" />
					<circle cx="8" cy="8" r="1.3" />
					<circle cx="2" cy="13" r="1.3" />
					<circle cx="8" cy="13" r="1.3" />
				</svg>
			</button>
			<div
				v-if="menuOpen"
				class="absolute left-6 top-0 w-36 bg-surface-secondary border border-edge rounded-lg shadow-xl z-20 py-1">
				<button
					type="button"
					class="w-full text-left px-3 py-1.5 text-sm text-content hover:bg-surface-tertiary"
					@click.stop="$emit('duplicate'); menuOpen = false">
					Duplicate
				</button>
				<button
					type="button"
					class="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-surface-tertiary"
					@click.stop="$emit('delete'); menuOpen = false">
					Delete
				</button>
			</div>
		</div>

		<!-- Fade In row (hidden for now) -->
		<div v-if="false && (active || fadeInSeconds !== null)" class="flex items-center gap-2 px-2 py-1">
			<svg class="shrink-0 w-3 text-content-tertiary" width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 20 L22 4" /><path d="M2 20 L22 20" />
			</svg>
			<span class="text-[11px] text-content-tertiary opacity-50 shrink-0 w-[86px]">Fade in</span>
			<input
				v-if="active"
				type="number"
				min="0" step="0.5" placeholder="auto"
				class="w-[66px] bg-surface-tertiary/40 rounded px-1.5 py-0.5 border-0 outline-none text-[11px] text-content-secondary tabular-nums placeholder-content-tertiary/50 focus:bg-surface-tertiary/60 transition"
				:value="fadeInSeconds ?? ''"
				@input="setFadeIn(($event.target as HTMLInputElement).value)" />
			<span v-else class="text-[11px] text-content-secondary tabular-nums">{{ fadeInSeconds }}s</span>
		</div>

		<!-- Background Color row -->
		<div v-if="active || themeOverride?.backgroundColor" class="flex items-center gap-2 px-2 py-1">
			<label
				class="shrink-0 relative w-3 h-3"
				:class="active ? 'cursor-pointer' : ''"
				v-tooltip="active && themeOverride?.backgroundColor ? 'Double-click to clear' : undefined"
				@dblclick.prevent="active && themeOverride?.backgroundColor ? setBackgroundColor('') : undefined">
				<span
					class="block w-full h-full rounded-sm border border-edge"
					:style="{ backgroundColor: themeOverride?.backgroundColor || 'transparent' }" />
				<input
					v-if="active"
					type="color"
					class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none border-0 p-0"
					:value="themeOverride?.backgroundColor || '#000000'"
					@input="setBackgroundColor(($event.target as HTMLInputElement).value)" />
			</label>
			<span class="text-[11px] text-content-tertiary opacity-50 shrink-0 w-[86px]">Background</span>
			<input
				v-if="active"
				class="w-[66px] bg-surface-tertiary/40 rounded px-1.5 py-0.5 border-0 outline-none text-[11px] text-content-secondary font-mono placeholder-content-tertiary/50 focus:bg-surface-tertiary/60 transition"
				:value="themeOverride?.backgroundColor ?? ''"
				placeholder="#hex"
				@input="setBackgroundColor(($event.target as HTMLInputElement).value)" />
			<span v-else class="text-[11px] text-content-secondary font-mono">{{ themeOverride?.backgroundColor }}</span>
		</div>

		<!-- Tint Color + Opacity row -->
		<div v-if="active || themeOverride?.tint?.color" class="flex items-center gap-2 px-2 py-1">
			<label
				class="shrink-0 relative w-3 h-3"
				:class="active ? 'cursor-pointer' : ''"
				v-tooltip="active && themeOverride?.tint?.color ? 'Double-click to clear' : undefined"
				@dblclick.prevent="active && themeOverride?.tint?.color ? setTintColor('') : undefined">
				<span
					class="block w-full h-full rounded-sm border border-edge"
					:style="{ backgroundColor: themeOverride?.tint?.color || 'transparent' }" />
				<input
					v-if="active"
					type="color"
					class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none border-0 p-0"
					:value="themeOverride?.tint?.color || '#000000'"
					@input="setTintColor(($event.target as HTMLInputElement).value)" />
			</label>
			<span class="text-[11px] text-content-tertiary opacity-50 shrink-0 w-[86px]">Tint</span>
			<template v-if="active">
				<input
					v-if="themeOverride?.tint?.color"
					type="range"
					class="w-16 h-1 rounded-full appearance-none cursor-pointer"
					style="background: #3f3f46"
					min="0" max="1" step="0.05"
					:value="themeOverride?.tint?.opacity ?? 0.3"
					@input="setTintOpacity(($event.target as HTMLInputElement).value)" />
				<input
					class="w-[66px] bg-surface-tertiary/40 rounded px-1.5 py-0.5 border-0 outline-none text-[11px] text-content-secondary font-mono placeholder-content-tertiary/50 focus:bg-surface-tertiary/60 transition"
					:value="themeOverride?.tint?.color ?? ''"
					placeholder="#hex"
					@input="setTintColor(($event.target as HTMLInputElement).value)" />
			</template>
			<span v-else class="text-[11px] text-content-secondary font-mono">{{ themeOverride?.tint?.color }}</span>
		</div>

		<!-- Feature action rows (Audio, Haptics, Binaural, Behaviors) -->
		<SceneFeatureBar v-if="active" v-model="configModel" />
		<!-- Non-selected: show feature summaries in same row layout -->
		<template v-else>
			<div v-if="soundboardEvents.length > 0" class="flex items-start gap-2 px-2 py-1">
				<svg class="shrink-0 w-3 text-success mt-[2px]" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
					<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] text-success opacity-50 mt-px">FX Soundboard</span>
				<div class="flex-1 min-w-0 flex flex-col">
					<span v-for="(ev, i) in soundboardEvents" :key="'sb-' + i"
						class="text-[11px] truncate"
						:class="ev.event === 'start' ? 'text-success' : 'text-danger'">{{ ev.event === 'start' ? '▶' : '■' }} {{ ev.name }}</span>
				</div>
			</div>
			<div v-if="hapticEvents.length > 0" class="flex items-start gap-2 px-2 py-1">
				<svg class="shrink-0 w-3 text-warning mt-[2px]" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 8v8" /><path d="M6 4v16" /><rect x="10" y="2" width="4" height="20" rx="1" /><path d="M18 4v16" /><path d="M22 8v8" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] text-warning opacity-50 mt-px">Haptics</span>
				<div class="flex-1 min-w-0 flex flex-col">
					<span v-for="(ev, i) in hapticEvents" :key="'hp-' + i"
						class="text-[11px] truncate"
						:class="ev.event === 'start' ? 'text-success' : 'text-danger'">{{ ev.event === 'start' ? '▶' : '■' }} {{ ev.name }}</span>
				</div>
			</div>
			<div v-if="binauralHz !== null" class="flex items-center gap-2 px-2 py-1 text-brand">
				<svg class="shrink-0 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 14v-3a9 9 0 0 1 18 0v3" />
					<path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" />
					<path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] opacity-50">Binaural</span>
				<span class="text-[11px]">{{ binauralHz }} Hz</span>
			</div>
			<div v-if="behaviorLabels.length > 0" class="flex items-center gap-2 px-2 py-1 text-info">
				<svg class="shrink-0 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="8" r="5" />
					<path d="M20 21a8 8 0 0 0-16 0" />
				</svg>
				<span class="shrink-0 w-[86px] text-[11px] opacity-50">Behaviors</span>
				<span class="flex-1 min-w-0 text-[11px] truncate">{{ behaviorSummary }}</span>
			</div>
		</template>

		<!-- Voice row -->
		<div class="flex items-start gap-2 px-2 py-1">
			<svg class="shrink-0 w-3 text-content-tertiary mt-[7px]" width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
				<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
				<line x1="12" x2="12" y1="19" y2="22" />
			</svg>
			<div class="shrink-0 w-[86px] pt-[5px]">
				<div
					v-if="voicesState?.enabled.value && voicesState?.voiceOrigin.value === 'ai'"
					class="relative">
					<div
						class="text-[11px] text-content-tertiary hover:text-content transition-colors cursor-pointer truncate"
						:title="`Voice: ${currentVoiceName}`">
						{{ currentVoiceName }}
					</div>
					<select
						v-model="voiceOverrideId"
						tabindex="-1"
						class="absolute inset-0 opacity-0 cursor-pointer w-full"
						@click.stop>
						<option value="">— Session default —</option>
						<option
							v-for="v in voicesState.voices.value"
							:key="v.voice_id"
							:value="v.voice_id">
							{{ v.name }}{{ v.category ? ` (${v.category})` : '' }}
						</option>
					</select>
				</div>
				<span v-else class="text-[11px] text-content-tertiary opacity-50">Voice</span>
			</div>
			<div class="flex-1 min-w-0">
				<textarea
					ref="voiceRef"
					:value="voiceText"
					data-field="voice"
					placeholder="What the narrator says…"
					class="w-full bg-transparent border-0 outline-none resize-none px-0 py-0.5 placeholder-content-tertiary font-serif text-[17px] leading-[1.6] min-h-[2em]"
					:style="{
						'field-sizing': 'content',
						color: themeOverride?.uiTextColor || '#cec2af',
					}"
					@input="onVoiceInput"
					@keydown.enter="onVoiceEnter"
					@keydown.backspace="onVoiceBackspace"
					@keydown.delete="onVoiceBackspace" />
			</div>
		</div>

		<!-- On-screen text row -->
		<div v-if="active || onScreenText" class="flex items-start gap-2 px-2 py-1">
			<label
				class="shrink-0 relative w-3 h-3 mt-[5px]"
				:class="active ? 'cursor-pointer' : ''"
				v-tooltip="active && themeOverride?.promptTextColor ? 'Double-click to clear color' : undefined"
				@dblclick.prevent="active && themeOverride?.promptTextColor ? setPromptTextColor('') : undefined">
				<span
					class="block w-full h-full rounded-sm border border-edge"
					:style="{ backgroundColor: themeOverride?.promptTextColor || 'transparent' }" />
				<input
					v-if="active"
					type="color"
					class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none border-0 p-0"
					:value="themeOverride?.promptTextColor || '#999999'"
					@input="setPromptTextColor(($event.target as HTMLInputElement).value)" />
			</label>
			<span class="shrink-0 w-[86px] text-[11px] text-content-tertiary opacity-50 pt-[3px]">Text</span>
			<div class="flex-1 min-w-0">
				<textarea
					ref="textRef"
					:value="onScreenText"
					data-field="text"
					placeholder="On-screen text…"
					class="w-full bg-transparent border-0 outline-none resize-none px-0 py-0.5 text-content placeholder-content-tertiary text-[16px] leading-[1.6] min-h-[1.5em] font-semibold"
					:style="{
						'field-sizing': 'content',
						...(themeOverride?.promptTextColor ? { color: themeOverride.promptTextColor } : {}),
					}"
					@input="onTextInput"
					@keydown.enter="onTextEnter"
					@keydown.backspace="onTextBackspace"
					@keydown.delete="onTextBackspace" />
			</div>
		</div>

		<!-- Fade Out row (hidden for now) -->
		<div v-if="false && (active || fadeOutSeconds !== null)" class="flex items-center gap-2 px-2 py-1">
			<svg class="shrink-0 w-3 text-content-tertiary" width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 4 L22 20" /><path d="M2 20 L22 20" />
			</svg>
			<span class="text-[11px] text-content-tertiary opacity-50 shrink-0 w-[86px]">Fade out</span>
			<input
				v-if="active"
				type="number"
				min="0" step="0.5" placeholder="auto"
				class="w-[66px] bg-surface-tertiary/40 rounded px-1.5 py-0.5 border-0 outline-none text-[11px] text-content-secondary tabular-nums placeholder-content-tertiary/50 focus:bg-surface-tertiary/60 transition"
				:value="fadeOutSeconds ?? ''"
				@input="setFadeOut(($event.target as HTMLInputElement).value)" />
			<span v-else class="text-[11px] text-content-secondary tabular-nums">{{ fadeOutSeconds }}s</span>
		</div>

		<!-- Break / Cooldown row -->
		<div v-if="active || cooldownSeconds !== null" class="flex items-center gap-2 px-2 py-1">
			<svg class="shrink-0 w-3 text-content-tertiary" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
				<rect x="5" y="3" width="5" height="18" rx="1" /><rect x="14" y="3" width="5" height="18" rx="1" />
			</svg>
			<span class="text-[11px] text-content-tertiary opacity-50 shrink-0 w-[86px]">Break</span>
			<input
				v-if="active"
				type="number"
				min="0" step="0.5" placeholder="auto"
				class="w-[66px] bg-surface-tertiary/40 rounded px-1.5 py-0.5 border-0 outline-none text-[11px] text-content-secondary tabular-nums placeholder-content-tertiary/50 focus:bg-surface-tertiary/60 transition"
				:value="cooldownSeconds ?? ''"
				@input="setCooldown(($event.target as HTMLInputElement).value)" />
			<span v-else class="text-[11px] text-content-secondary tabular-nums">{{ cooldownSeconds }}s</span>
		</div>
	</section>

	<hr class="border-edge my-1" />

	<!-- Cooldown indicator for non-selected scenes (shows between scenes) -->
	<div
		v-if="!active && cooldownSeconds !== null"
		class="flex justify-center -mt-3 -mb-3 cursor-text"
		@click.stop="$emit('select')">
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-secondary text-[10px] font-mono tracking-wider text-content-tertiary">
			{{ cooldownSeconds }}s break
		</span>
	</div>
</template>
