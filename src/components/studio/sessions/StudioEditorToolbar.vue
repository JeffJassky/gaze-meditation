<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { su } from '@/components/ui/studioUi'
import type { Session } from '@/api/sessions'

/**
 * Slim toolbar that lives inside the StudioShell main slot, just below the
 * global nav. The session title is edited in place via a contenteditable
 * span so the writer can rename without opening the meta drawer.
 */
const props = defineProps<{
	session: Session | null
	dirty: boolean
	saving: boolean
	canUndo: boolean
	canRedo: boolean
	justSaved: boolean
}>()

const emit = defineEmits<{
	save: []
	openMeta: []
	undo: []
	redo: []
	publish: []
	unpublish: []
	updateTitle: [value: string]
}>()

const titleEl = ref<HTMLElement | null>(null)

// Keep the DOM in sync with the prop when it changes externally (load, undo,
// etc.) but avoid clobbering while the user is actively typing.
watch(
	() => props.session?.title,
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
	emit('updateTitle', text)
}

function onTitleKey(e: KeyboardEvent) {
	if (e.key === 'Enter') {
		e.preventDefault()
		;(e.target as HTMLElement).blur()
	}
}
</script>

<template>
	<div
		class="px-4 h-12 flex items-center justify-between border-b border-zinc-800 bg-zinc-950">
		<div class="flex items-center gap-3 min-w-0">
			<RouterLink
				to="/studio/sessions"
				class="text-sm text-zinc-400 hover:text-white shrink-0">
				← Sessions
			</RouterLink>
			<span class="text-zinc-700">/</span>
			<span
				ref="titleEl"
				class="text-sm text-zinc-200 truncate outline-none rounded px-1 -mx-1 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-700 empty:before:content-['Untitled'] empty:before:text-zinc-600"
				:contenteditable="!!session"
				spellcheck="false"
				@input="onTitleInput"
				@keydown="onTitleKey" />
			<span
				v-if="justSaved"
				class="text-xs text-emerald-400 shrink-0 ml-2 transition-colors">
				✓ Saved
			</span>
			<span v-else-if="dirty" class="text-xs text-amber-300 shrink-0 ml-2">
				<span class="mr-1">●</span>Unsaved
			</span>
			<span v-else-if="session" class="text-xs text-zinc-500 shrink-0 ml-2">
				Saved
			</span>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<button
				type="button"
				:class="[su.btnGhost, '!px-2 text-lg leading-none disabled:opacity-30']"
				:disabled="!canUndo"
				title="Undo (⌘Z)"
				@click="$emit('undo')">
				↶
			</button>
			<button
				type="button"
				:class="[su.btnGhost, '!px-2 text-lg leading-none disabled:opacity-30']"
				:disabled="!canRedo"
				title="Redo (⌘⇧Z)"
				@click="$emit('redo')">
				↷
			</button>
			<button
				type="button"
				:class="[su.btnSecondary, '!py-1.5 text-sm']"
				@click="$emit('openMeta')">
				Assets
			</button>
			<button
				v-if="session && session.status === 'draft'"
				type="button"
				:class="[su.btnSecondary, '!py-1.5 text-sm']"
				@click="$emit('publish')">
				Publish
			</button>
			<button
				v-else-if="session"
				type="button"
				:class="[su.btnSecondary, '!py-1.5 text-sm']"
				@click="$emit('unpublish')">
				Unpublish
			</button>
			<button
				v-if="dirty && session"
				type="button"
				:class="[su.btn, '!py-1.5 text-sm']"
				:disabled="saving"
				@click="$emit('save')">
				{{ saving ? 'Saving…' : 'Save' }}
			</button>
		</div>
	</div>
</template>
