<script setup lang="ts">
import { useNotifications, type NotificationType } from '@/composables/useNotifications'

const { notifications, dismiss } = useNotifications()

const iconFor: Record<NotificationType, string> = {
	info: 'ℹ',
	success: '✓',
	warning: '⚠',
	error: '✕',
}

const colorFor: Record<NotificationType, string> = {
	info: 'border-zinc-600 text-zinc-200',
	success: 'border-emerald-700 text-emerald-300',
	warning: 'border-amber-700 text-amber-300',
	error: 'border-red-700 text-red-300',
}
</script>

<template>
	<Teleport to="body">
		<div
			class="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none max-w-sm">
			<TransitionGroup name="notif">
				<div
					v-for="n in notifications"
					:key="n.id"
					class="pointer-events-auto bg-zinc-900/95 backdrop-blur border rounded-lg shadow-xl px-4 py-3 flex items-start gap-3 relative overflow-hidden"
					:class="colorFor[n.type]">
					<span class="text-sm font-bold mt-0.5 shrink-0">{{ iconFor[n.type] }}</span>
					<span class="text-sm leading-snug flex-1">{{ n.message }}</span>
					<button
						class="text-zinc-500 hover:text-zinc-300 text-xs mt-0.5 shrink-0"
						@click="dismiss(n.id)">
						dismiss
					</button>
					<div
						v-if="n.duration > 0"
						class="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 notif-drain"
						:style="{ animationDuration: n.duration + 'ms' }" />
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.notif-enter-active,
.notif-leave-active {
	transition: all 200ms ease;
}
.notif-enter-from {
	opacity: 0;
	transform: translateX(20px);
}
.notif-leave-to {
	opacity: 0;
	transform: translateX(20px);
}

.notif-drain {
	animation-name: drain;
	animation-timing-function: linear;
	animation-fill-mode: forwards;
	width: 100%;
}
@keyframes drain {
	from { width: 100%; }
	to { width: 0%; }
}
</style>
