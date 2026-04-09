<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import SceneTextPanel from './SceneTextPanel.vue'
import { VOICES_KEY } from './voicesKey'
import { BEHAVIOR_BY_TYPE } from './behaviorCatalog'
import type { SceneBlock } from '@/services/sessions'

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
	get: () => scene.value.config ?? {},
	set: (v) => (scene.value.config = v),
})

// --- Voice override --------------------------------------------------------
const voicesState = inject(VOICES_KEY, undefined)
const voiceOverrideId = computed({
	get: () => (scene.value.config?.elevenlabsVoiceId as string | undefined) ?? '',
	set: (v: string) => {
		if (!scene.value.config) scene.value.config = {}
		if (v) scene.value.config.elevenlabsVoiceId = v
		else delete (scene.value.config as Record<string, unknown>).elevenlabsVoiceId
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
// colors (voice → textColor, on-screen → secondaryTextColor). Anything
// else stays un-previewed.
interface SceneTheme {
	backgroundColor?: string
	textColor?: string
	secondaryTextColor?: string
}
const themeOverride = computed<SceneTheme | null>(() => {
	const t = (scene.value.config as any)?.theme
	if (!t || typeof t !== 'object') return null
	return t as SceneTheme
})

// --- Right-side metadata column -------------------------------------------
// Summarises a few inspector panel states inline so the writer can see
// at a glance which scenes do what without opening the inspector.
const behaviorLabels = computed<string[]>(() => {
	const sugs = (scene.value.config as any)?.behavior?.suggestions as
		| Array<{ type: string }>
		| undefined
	if (!sugs || sugs.length === 0) return []
	return sugs.map((s) => BEHAVIOR_BY_TYPE[s.type]?.label ?? s.type)
})
const behaviorSummary = computed(() => behaviorLabels.value.join(' + '))
const binauralHz = computed<number | null>(() => {
	const hz = (scene.value.config as any)?.audio?.binaural?.hertz
	if (typeof hz !== 'number' || !Number.isFinite(hz)) return null
	return hz
})
function msToDisplaySeconds(ms: unknown): number | null {
	if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return null
	return Math.round((ms / 1000) * 10) / 10
}
const cooldownSeconds = computed<number | null>(() =>
	msToDisplaySeconds((scene.value.config as any)?.cooldown),
)
const fadeInSeconds = computed<number | null>(() =>
	msToDisplaySeconds((scene.value.config as any)?.fadeInDuration),
)
const fadeOutSeconds = computed<number | null>(() =>
	msToDisplaySeconds((scene.value.config as any)?.fadeOutDuration),
)

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
			active ? 'ring-1 ring-zinc-700' : '',
			!themeOverride?.backgroundColor && active ? 'bg-zinc-900/60' : '',
			!themeOverride?.backgroundColor && !active ? 'hover:bg-zinc-900/20' : '',
		]"
		:style="
			themeOverride?.backgroundColor
				? { backgroundColor: themeOverride.backgroundColor }
				: undefined
		"
		@click="$emit('select')">
		<!-- Fade-in pill straddles the top border of the scene. Only
		     visible when the scene is selected. -->
		<span
			v-if="active && fadeInSeconds !== null"
			class="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono tracking-wider text-zinc-400 pointer-events-none">
			{{ fadeInSeconds }}s fade in
		</span>
		<!-- Fade-out pill straddles the bottom border of the scene. Only
		     visible when the scene is selected. -->
		<span
			v-if="active && fadeOutSeconds !== null"
			class="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono tracking-wider text-zinc-400 pointer-events-none">
			{{ fadeOutSeconds }}s fade out
		</span>

		<!-- Drag handle + flyout. Visible on hover, always visible when
		     this scene is the selected one. -->
		<div
			ref="handleRef"
			class="absolute -left-6 top-5 flex flex-col items-center transition-opacity"
			:class="active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
			<button
				type="button"
				tabindex="-1"
				class="scene-drag-handle flex items-center justify-center p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-colors"
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
				class="absolute left-6 top-0 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
				<button
					type="button"
					class="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
					@click.stop="$emit('duplicate'); menuOpen = false">
					Duplicate
				</button>
				<button
					type="button"
					class="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-800"
					@click.stop="$emit('delete'); menuOpen = false">
					Delete
				</button>
			</div>
		</div>

		<!-- Script body: voice picker to the left of the voice textarea. -->
		<div class="flex items-start gap-3">
			<div
				v-if="voicesState?.enabled.value"
				class="relative shrink-0 pt-[6px]">
				<div
					class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors max-w-[150px] text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
					:title="`Voice: ${currentVoiceName}`">
					<!-- Speaking head icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true">
						<circle cx="9" cy="9" r="5" />
						<path d="M9 14v3" />
						<path d="M6 17h6" />
						<path d="M15 8c1.5 0 2.5 1 2.5 2" />
						<path d="M16 5c3 0 5 2 5 5" />
					</svg>
					<span class="truncate">{{ currentVoiceName }}</span>
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
			<div class="flex-1 min-w-0">
				<SceneTextPanel
					v-model="configModel"
					:voice-color="themeOverride?.textColor"
					:text-color="themeOverride?.secondaryTextColor"
					@advance="$emit('advance')"
					@delete-backward="$emit('deleteBackward')" />
			</div>

		</div>

		<!-- Right-side metadata: behaviors + binaural, hanging OUTSIDE
		     the scene container in the right margin so the container
		     itself stays pure script. -->
		<div
			v-if="behaviorSummary || binauralHz !== null"
			class="absolute top-4 left-full ml-4 flex flex-col items-start gap-1.5 text-[11px] text-zinc-500 w-[130px] pointer-events-none">
			<div
				v-if="behaviorLabels.length > 0"
				class="inline-flex items-center flex-wrap px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-300 leading-tight gap-x-1"
				:title="behaviorSummary">
				<template v-for="(label, idx) in behaviorLabels" :key="idx">
					<span v-if="idx > 0" class="text-white font-bold">+</span>
					<span class="whitespace-nowrap">{{ label }}</span>
				</template>
			</div>
			<div
				v-if="binauralHz !== null"
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 tabular-nums leading-tight"
				:title="`Binaural ${binauralHz} Hz`">
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true">
					<path d="M3 14v-3a9 9 0 0 1 18 0v3" />
					<path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" />
					<path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" />
				</svg>
				<span>{{ binauralHz }} Hz</span>
			</div>
		</div>
	</section>

	<!-- Cooldown pill sits outside the scene container, in the gap to
	     the next stack item. Clicking anywhere on it selects the scene,
	     same as clicking anywhere else on the scene body. -->
	<div
		v-if="cooldownSeconds !== null"
		class="flex justify-center -mt-3 -mb-3 cursor-text"
		@click="$emit('select')">
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-900 text-[10px] font-mono tracking-wider text-zinc-500">
			{{ cooldownSeconds }}s break
		</span>
	</div>
</template>
