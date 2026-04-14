<script setup lang="ts">
import { computed } from 'vue'
import type { SceneConfig, ThemeConfig } from '@shared/types'
import { normalizeHex } from '@/utils/colorInput'

const config = defineModel<SceneConfig>({ required: true })

const theme = computed<ThemeConfig>({
	get: () => config.value.theme ?? {},
	set: (v) => (config.value.theme = v),
})

const COLOR_ROWS: [keyof ThemeConfig, string][] = [
	['backgroundColor', 'Background'],
]

const TINT_ROW = true // marker to insert tint after background

const REMAINING_ROWS: [keyof ThemeConfig, string][] = [
	['promptTextColor', 'Prompt text'],
	['uiTextColor', 'UI text'],
	['accentColor', 'Accent'],
]

function setColor(key: keyof ThemeConfig, value: string) {
	const next = { ...theme.value }
	const normalized = normalizeHex(value)
	if (!normalized) delete next[key]
	else (next[key] as string) = normalized
	theme.value = next
}

function setTintColor(value: string) {
	const normalized = normalizeHex(value)
	if (!normalized) {
		const next = { ...theme.value }
		delete next.tint
		theme.value = next
	} else {
		theme.value = {
			...theme.value,
			tint: { color: normalized, opacity: theme.value.tint?.opacity ?? 0 },
		}
	}
}
</script>

<template>
	<div class="space-y-2">
		<!-- Background -->
		<div
			v-for="[key, label] in COLOR_ROWS"
			:key="key"
			class="flex items-center gap-2">
			<span class="text-[10px] uppercase tracking-wider text-content-tertiary w-20 shrink-0">{{ label }}</span>
			<input
				class="flex-1 min-w-0 bg-surface border border-edge rounded px-2 py-1 text-xs text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono"
				:value="(theme[key] as string) || ''"
				placeholder="default"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
			<input
				type="color"
				class="w-6 h-6 rounded-full border border-edge-secondary bg-surface shrink-0 cursor-pointer appearance-none"
				:value="(theme[key] as string) || '#000000'"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
		</div>

		<!-- Tint color (right after background) -->
		<div class="flex items-center gap-2">
			<span class="text-[10px] uppercase tracking-wider text-content-tertiary w-20 shrink-0">Tint color</span>
			<input
				class="flex-1 min-w-0 bg-surface border border-edge rounded px-2 py-1 text-xs text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono"
				:value="theme.tint?.color ?? ''"
				placeholder="default"
				@input="(e) => setTintColor((e.target as HTMLInputElement).value)" />
			<input
				type="color"
				class="w-6 h-6 rounded-full border border-edge-secondary bg-surface shrink-0 cursor-pointer appearance-none"
				:value="theme.tint?.color ?? '#000000'"
				@input="(e) => setTintColor((e.target as HTMLInputElement).value)" />
		</div>

		<!-- Remaining colors -->
		<div
			v-for="[key, label] in REMAINING_ROWS"
			:key="key"
			class="flex items-center gap-2">
			<span class="text-[10px] uppercase tracking-wider text-content-tertiary w-20 shrink-0">{{ label }}</span>
			<input
				class="flex-1 min-w-0 bg-surface border border-edge rounded px-2 py-1 text-xs text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono"
				:value="(theme[key] as string) || ''"
				placeholder="default"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
			<input
				type="color"
				class="w-6 h-6 rounded-full border border-edge-secondary bg-surface shrink-0 cursor-pointer appearance-none"
				:value="(theme[key] as string) || '#000000'"
				@input="(e) => setColor(key, (e.target as HTMLInputElement).value)" />
		</div>
	</div>
</template>

<style scoped>
input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
input[type="color"]::-webkit-color-swatch { border: none; border-radius: 9999px; }
input[type="color"]::-moz-color-swatch { border: none; border-radius: 9999px; }
</style>
