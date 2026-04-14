<script setup lang="ts">
import type { PendingDelete } from './composables/useSoftDelete'
import { sceneFirstLine } from './sceneSummary'

defineProps<{ pending: PendingDelete[]; windowMs: number }>()
defineEmits<{ undo: [id: string] }>()
</script>

<template>
	<Teleport to="body">
		<div
			class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 pointer-events-none">
			<TransitionGroup name="toast">
				<div
					v-for="p in pending"
					:key="p.id"
					class="relative pointer-events-auto bg-surface-secondary border border-edge-secondary rounded-lg shadow-xl px-4 py-3 flex items-center gap-4 min-w-[280px] overflow-hidden">
					<span class="text-sm text-content truncate max-w-[320px]">
						Scene removed<span
							v-if="sceneFirstLine(p.scene, 40)"
							class="text-content-tertiary">
							· {{ sceneFirstLine(p.scene, 40) }}</span>
					</span>
					<button
						class="text-sm text-info hover:text-info font-medium ml-auto"
						@click="$emit('undo', p.id)">
						Undo
					</button>
					<div
						class="absolute bottom-0 left-0 h-0.5 bg-edge-secondary toast-progress"
						:style="{ animationDuration: windowMs + 'ms' }" />
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
	transition: all 200ms ease;
}
.toast-enter-from {
	opacity: 0;
	transform: translateY(10px);
}
.toast-leave-to {
	opacity: 0;
	transform: translateY(10px);
}

.toast-progress {
	animation-name: drain;
	animation-timing-function: linear;
	animation-fill-mode: forwards;
	width: 100%;
}
@keyframes drain {
	from {
		width: 100%;
	}
	to {
		width: 0%;
	}
}
</style>
