<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import SceneStackItem from './SceneStackItem.vue'
import SessionHeader from './SessionHeader.vue'
import type { SceneBlock, Session } from '@/services/sessions'

/**
 * Center pane of the editor — a continuous scrollable script. The scene
 * rail was removed, so this view is now the sole place where scenes are
 * selected, reordered, duplicated, or deleted. Selection still tracks
 * scroll position via an IntersectionObserver.
 */
const scenes = defineModel<SceneBlock[]>({ required: true })
const session = defineModel<Session>('session', { required: true })
/**
 * Structured focus request. `atEnd` moves the caret to the end of the
 * textarea's existing content (used for backspace-collapse into the
 * previous scene so the caret lands where the text stops).
 */
export interface FocusRequest {
	id: string
	/** Preferred field. If 'auto', picks the last non-empty field, else voice. */
	field?: 'voice' | 'text' | 'auto'
	atEnd?: boolean
}

const props = defineProps<{
	selectedId: string | null
	focusRequest: FocusRequest | null
}>()
const emit = defineEmits<{
	select: [id: string]
	duplicate: [index: number]
	remove: [index: number]
	advance: [index: number]
	deleteBackward: [index: number]
	focusConsumed: []
}>()

const scrollRoot = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let suppressObserver = false
const visibility = new Map<string, number>()

function reobserve() {
	if (!observer || !scrollRoot.value) return
	observer.disconnect()
	visibility.clear()
	scrollRoot.value
		.querySelectorAll<HTMLElement>('[data-scene-id]')
		.forEach((el) => observer!.observe(el))
}

function pickBest() {
	if (suppressObserver) return
	let best: string | null = null
	let bestRatio = 0
	for (const [id, r] of visibility) {
		if (r > bestRatio) {
			bestRatio = r
			best = id
		}
	}
	if (best && best !== props.selectedId) emit('select', best)
}

onMounted(() => {
	if (!scrollRoot.value) return
	observer = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				const id = (e.target as HTMLElement).dataset.sceneId
				if (id) visibility.set(id, e.intersectionRatio)
			}
			pickBest()
		},
		{
			root: scrollRoot.value,
			rootMargin: '-15% 0px -55% 0px',
			threshold: [0, 0.25, 0.5, 0.75, 1],
		},
	)
	reobserve()
})

onBeforeUnmount(() => observer?.disconnect())

watch(
	() => scenes.value.map((s) => s.id).join(','),
	async () => {
		await nextTick()
		reobserve()
	},
)

watch(
	() => props.selectedId,
	async (id) => {
		if (!id || !scrollRoot.value) return
		await nextTick()
		const el = scrollRoot.value.querySelector<HTMLElement>(
			`[data-scene-id="${CSS.escape(id)}"]`,
		)
		if (!el) return
		const rootRect = scrollRoot.value.getBoundingClientRect()
		const elRect = el.getBoundingClientRect()
		const offset = elRect.top - rootRect.top
		if (offset >= 0 && offset <= rootRect.height * 0.35) return
		suppressObserver = true
		el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		setTimeout(() => {
			suppressObserver = false
		}, 700)
	},
)

// Fulfill focus requests from the parent. Handles:
// - explicit field ('voice' | 'text')
// - 'auto' field: prefer whichever textarea currently has content, falling
//   back to voice. Used by backspace-collapse so focus lands in a populated
//   field rather than an empty one.
// - atEnd: move caret to the end of the existing content.
watch(
	() => props.focusRequest,
	async (req) => {
		if (!req || !scrollRoot.value) return
		await nextTick()
		const scope = scrollRoot.value.querySelector<HTMLElement>(
			`[data-scene-id="${CSS.escape(req.id)}"]`,
		)
		if (!scope) return
		const voiceTa = scope.querySelector<HTMLTextAreaElement>(
			'textarea[data-field="voice"]',
		)
		const textTa = scope.querySelector<HTMLTextAreaElement>(
			'textarea[data-field="text"]',
		)
		let target: HTMLTextAreaElement | null
		const field = req.field ?? 'voice'
		if (field === 'text') {
			target = textTa ?? voiceTa
		} else if (field === 'auto') {
			target =
				textTa && textTa.value.length > 0
					? textTa
					: voiceTa && voiceTa.value.length > 0
					? voiceTa
					: (voiceTa ?? textTa)
		} else {
			target = voiceTa ?? textTa
		}
		if (!target) return
		target.focus()
		if (req.atEnd) {
			const len = target.value.length
			target.setSelectionRange(len, len)
		}
		emit('focusConsumed')
	},
)

// --- Drag reorder (SortableJS via @vueuse/integrations) -------------------
// We mount Sortable on the inner list container and let it mutate the
// scenes array directly. `handle` restricts drag initiation to the
// per-item handle element (class `scene-drag-handle`), so clicking
// anywhere else in the scene still behaves normally (text selection,
// editing, etc.). `animation` gives us a little neighbourly shift while
// dragging.
const listContainer = ref<HTMLElement | null>(null)
useSortable(
	listContainer,
	scenes,
	// `forceFallback: true` makes Sortable manage the cursor-following
	// drag image itself (a DOM clone) instead of relying on the browser's
	// native HTML5 drag image snapshot. That's the only way we can style
	// it — the native snapshot captures whatever was on screen at the
	// moment of dragstart and can't be padded, re-coloured, etc.
	{
		handle: '.scene-drag-handle',
		animation: 180,
		forceFallback: true,
		fallbackOnBody: true,
		ghostClass: 'scene-drag-ghost',
		chosenClass: 'scene-drag-chosen',
		fallbackClass: 'scene-drag-fallback',
	} as any,
)
</script>

<template>
	<main ref="scrollRoot" class="overflow-y-auto bg-zinc-950 min-h-0">
		<div class="max-w-2xl mx-auto px-10 py-10">
			<!-- Blog-style session header sits above the scene list and
			     outside the sortable container so it can't be dragged. -->
			<SessionHeader v-model="session" />

			<div ref="listContainer" class="space-y-6">
				<SceneStackItem
					v-for="(scene, i) in scenes"
					:key="scene.id"
					v-model="scenes[i]"
					:index="i"
					:active="scene.id === selectedId"
					@select="emit('select', scene.id)"
					@duplicate="emit('duplicate', i)"
					@delete="emit('remove', i)"
					@advance="emit('advance', i)"
					@delete-backward="emit('deleteBackward', i)" />
				<div
					v-if="scenes.length === 0"
					class="text-center py-20 text-zinc-600 text-sm">
					No scenes yet.
				</div>
			</div>
		</div>
	</main>
</template>

<style scoped>
/* Placeholder left behind in the list while dragging. */
.scene-drag-ghost {
	opacity: 0.4;
}
.scene-drag-chosen {
	cursor: grabbing;
}
</style>

<!-- Unscoped: Sortable appends the fallback (the element that follows the
     cursor) to <body>, so it lives outside this component's scope and
     scoped selectors wouldn't match. -->
<style>
.scene-drag-fallback {
	/* Reset the scene section's negative horizontal margin so the ring
	   border isn't cropped by the fallback element's bounding box.
	   Leave the section's own padding (`px-4 py-4`) intact so the
	   fallback matches the in-list items exactly. */
	margin-left: 0 !important;
	margin-right: 0 !important;
	background-color: rgba(24, 24, 27, 0.95) !important;
	/* Sortable sets opacity to 0 by default on the fallback — override
	   with a subtle translucent drag state. */
	opacity: 0.5 !important;
	box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.6);
	border-radius: 0.5rem;
}
</style>
