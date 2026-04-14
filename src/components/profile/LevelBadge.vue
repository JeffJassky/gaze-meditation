<script setup lang="ts">
defineProps<{
	level: number
	progress: number
	size?: 'sm' | 'md'
}>()
</script>

<template>
	<div class="flex items-center gap-2" :class="size === 'sm' ? 'text-xs' : 'text-sm'">
		<div class="flex items-center gap-2 min-w-0">
			<span
				class="font-bold tabular-nums shrink-0"
				:class="size === 'sm' ? 'text-xs' : 'text-base'"
			>
				Lv. {{ level }}
			</span>

			<div
				class="flex-1 rounded-full bg-surface-tertiary overflow-hidden"
				:class="size === 'sm' ? 'h-1.5 w-12' : 'h-2 w-24'"
			>
				<div
					class="h-full rounded-full bg-accent transition-all duration-500"
					:style="{ width: `${Math.round(progress * 100)}%` }"
				/>
			</div>

			<span
				v-if="size !== 'sm'"
				class="text-content-secondary tabular-nums shrink-0"
			>
				Lv. {{ level + 1 }}
			</span>
		</div>
	</div>
</template>
