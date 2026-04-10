<script setup lang="ts">
import type { ThemeConfig } from '@shared/types'
import { normalizeHex } from '@/utils/colorInput'
import { computed } from 'vue'

/**
 * Reusable theme color editor — renders one row per color field plus tint.
 * Used by both the session-level settings panel and the per-scene theme
 * override in the inspector.
 */
const theme = defineModel<ThemeConfig>({ required: true })

const props = withDefaults(defineProps<{
	/** Hide the background color row (shown separately in the Background section). */
	hideBackground?: boolean
	/** Hide the tint row (shown separately in the Background section). */
	hideTint?: boolean
}>(), { hideBackground: false, hideTint: false })

const ALL_KEYS: [keyof ThemeConfig, string][] = [
	['backgroundColor', 'Background'],
	['promptTextColor', 'Prompt text'],
	['uiTextColor', 'UI text'],
	['accentColor', 'Accent'],
]

const THEME_KEYS = computed(() => {
	const hidden = new Set<string>()
	if (props.hideBackground) hidden.add('backgroundColor')
	return ALL_KEYS.filter(([k]) => !hidden.has(k))
})

function setColor(key: keyof ThemeConfig, value: string) {
	const next = { ...theme.value }
	const normalized = normalizeHex(value)
	if (!normalized) delete next[key]
	else (next[key] as string) = normalized
	theme.value = next
}

const tintColor = computed(() => theme.value?.tint?.color ?? '#000000')
const tintOpacity = computed(() => theme.value?.tint?.opacity ?? 0)

function setTint(patch: { color?: string; opacity?: number }) {
	theme.value = {
		...theme.value,
		tint: {
			color: patch.color ?? tintColor.value,
			opacity: patch.opacity ?? tintOpacity.value,
		},
	}
}
</script>

<template>
	<div class="space-y-2">
		<div
			v-for="[key, label] in THEME_KEYS"
			:key="key"
			class="flex items-center gap-2">
			<span class="text-[10px] uppercase tracking-wider text-zinc-500 w-20 shrink-0">{{ label }}</span>
			<input
				class="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono"
				:value="(theme?.[key] as string) || ''"
				placeholder="#hex"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
			<input
				type="color"
				class="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-950 shrink-0 cursor-pointer appearance-none"
				:value="(theme?.[key] as string) || '#000000'"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
		</div>

		<!-- Tint -->
		<div v-if="!hideTint" class="flex items-center gap-2">
			<span class="text-[10px] uppercase tracking-wider text-zinc-500 w-20 shrink-0">Tint</span>
			<input
				class="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono"
				type="number"
				step="0.05"
				min="0"
				max="1"
				placeholder="0"
				:value="tintOpacity"
				@input="(e) => setTint({ opacity: Number((e.target as HTMLInputElement).value) })" />
			<input
				type="color"
				class="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-950 shrink-0 cursor-pointer appearance-none"
				:value="tintColor"
				@input="(e) => setTint({ color: (e.target as HTMLInputElement).value })" />
		</div>
	</div>
</template>

<style scoped>
/* Make color inputs circular */
input[type="color"]::-webkit-color-swatch-wrapper {
	padding: 0;
}
input[type="color"]::-webkit-color-swatch {
	border: none;
	border-radius: 9999px;
}
input[type="color"]::-moz-color-swatch {
	border: none;
	border-radius: 9999px;
}
</style>
