<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Reusable disclosure block for the right inspector pane. Persists open
 * state per `storageKey` in localStorage so the writer's preferences carry
 * across reloads. Uses v-show so child component state survives collapse.
 */
const props = defineProps<{
	title: string
	storageKey: string
	defaultOpen?: boolean
	badge?: number | string
}>()

function readInitial(): boolean {
	try {
		const raw = localStorage.getItem('studio.inspector.' + props.storageKey)
		if (raw === null) return !!props.defaultOpen
		return raw === '1'
	} catch {
		return !!props.defaultOpen
	}
}

const open = ref(readInitial())

watch(open, (v) => {
	try {
		localStorage.setItem('studio.inspector.' + props.storageKey, v ? '1' : '0')
	} catch {
		/* ignore quota / privacy mode failures */
	}
})
</script>

<template>
	<div class="border-b border-zinc-800">
		<button
			type="button"
			class="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-900/40 transition-colors"
			@click="open = !open">
			<span class="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex-1">
				{{ title }}
			</span>
			<span
				v-if="badge"
				class="text-[10px] bg-zinc-800 text-zinc-300 rounded-full px-2 py-0.5">
				{{ badge }}
			</span>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-zinc-500 transition-transform duration-200 shrink-0"
				:class="open ? 'rotate-180' : ''"
				aria-hidden="true">
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>
		<div v-show="open" class="px-4 pb-4 pt-1">
			<slot />
		</div>
	</div>
</template>
