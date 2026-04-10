<script setup lang="ts">
import type { Session } from '@/api/sessions'

/**
 * Compact "begin this session" card used on the dashboard. Consumes a
 * database-fed Session directly — the `scenes` subdoc length gives
 * us the scene count we need for the duration estimate.
 */
defineProps<{
	program: Session
	disabled?: boolean
}>()

defineEmits<{
	(e: 'start', program: Session): void
}>()
</script>

<template>
	<RouterLink
		:to="`/theater/${program.slug}`"
		class="group relative bg-surface-secondary border border-edge p-6 rounded-xl transition-all duration-300 shadow-theme-lg hover:shadow-[0_25px_40px_-10px_rgba(0,0,0,0.6)] hover:border-accent hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:shadow-lg no-underline"
		:class="disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'"
		@click.prevent="!disabled && $emit('start', program)"
	>
		<div class="flex flex-col h-full">
			<div
				v-if="program.tags && program.tags.length"
				class="flex items-center gap-2 mb-2"
			>
				<span
					v-for="tag in program.tags"
					:key="tag"
					class="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-accent/20"
				>
					{{ tag }}
				</span>
			</div>
			<div>
				<h3
					class="text-xl font-bold text-content group-hover:text-accent transition-colors text-left"
				>
					{{ program.title }}
				</h3>
				<p class="text-sm text-content-secondary mt-2 text-left">
					{{ program.description }}
				</p>
			</div>
			<div class="flex gap-2 mt-4 flex-wrap">
				<span class="text-xs bg-surface-tertiary px-2 py-1 rounded text-content-tertiary">
					{{ Math.ceil(program.scenes.length / 4) }}-{{
						Math.ceil(program.scenes.length / 3)
					}}
					min
				</span>
			</div>
			<div class="mt-auto pt-4">
				<button
					:disabled="disabled"
					@click.stop.prevent="$emit('start', program)"
					class="bg-accent-muted w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-content px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
				>
					Begin Session
				</button>
			</div>
		</div>
	</RouterLink>
</template>
