<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import SessionAssetsPanel from './SessionAssetsPanel.vue'
import type { SessionDoc } from '@/services/sessions'

/**
 * Slide-over drawer for session assets. Session details (title, description,
 * audience, tags, etc.) now live inline at the top of the scrolling script
 * stack via SessionHeader, so this drawer is asset-only.
 */
const open = defineModel<boolean>('open', { required: true })
const session = defineModel<SessionDoc>('session', { required: true })

function close() {
	open.value = false
}

function onKey(e: KeyboardEvent) {
	if (e.key === 'Escape') close()
}

watch(
	open,
	(v) => {
		if (v) window.addEventListener('keydown', onKey)
		else window.removeEventListener('keydown', onKey)
	},
	{ immediate: true },
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
	<Teleport to="body">
		<div
			class="fixed inset-0 z-50 pointer-events-none"
			:class="open ? '' : ''">
			<!-- Backdrop -->
			<div
				class="absolute inset-0 bg-black/60 transition-opacity duration-300"
				:class="open ? 'opacity-100 pointer-events-auto' : 'opacity-0'"
				@click="close" />

			<!-- Panel -->
			<aside
				class="absolute top-0 right-0 h-full w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform duration-300 flex flex-col pointer-events-auto"
				:class="open ? 'translate-x-0' : 'translate-x-full'">
				<header
					class="h-12 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
					<h2 class="text-sm font-semibold text-zinc-200">Assets</h2>
					<button
						type="button"
						class="text-zinc-500 hover:text-zinc-200 text-xl leading-none px-2"
						@click="close"
						aria-label="Close">
						×
					</button>
				</header>
				<div class="flex-1 overflow-y-auto p-4">
					<SessionAssetsPanel v-model="session" />
				</div>
			</aside>
		</div>
	</Teleport>
</template>
