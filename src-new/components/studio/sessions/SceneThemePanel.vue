<script setup lang="ts">
import { computed } from 'vue'
import { su } from '@new/components/ui/studioUi'

const config = defineModel<Record<string, unknown>>({ required: true })

const THEME_KEYS = [
	['backgroundColor', 'Background'],
	['textColor', 'Text'],
	['secondaryTextColor', 'Secondary text'],
	['accentColor', 'Accent'],
	['positiveColor', 'Positive'],
	['negativeColor', 'Negative'],
] as const

const theme = computed<Record<string, any>>({
	get: () => (config.value.theme as Record<string, any>) ?? {},
	set: (v) => (config.value.theme = v),
})

function setTheme(key: string, value: string) {
	const next = { ...theme.value }
	if (!value) delete next[key]
	else next[key] = value
	config.value.theme = next
}

function tintColor(): string {
	return (theme.value.tint?.color as string) ?? '#000000'
}
function tintOpacity(): number {
	return (theme.value.tint?.opacity as number) ?? 0
}
function setTint(patch: { color?: string; opacity?: number }) {
	const next = { ...theme.value, tint: { color: tintColor(), opacity: tintOpacity(), ...patch } }
	config.value.theme = next
}
</script>

<template>
	<div :class="su.subCard">
		<h3 :class="[su.h3, 'mb-3']">Theme (overrides session defaults)</h3>

		<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
			<div v-for="[key, label] in THEME_KEYS" :key="key">
				<label :class="su.label">{{ label }}</label>
				<div class="flex items-center gap-2">
					<input
						type="color"
						class="w-10 h-10 rounded border border-zinc-800 bg-zinc-950"
						:value="(theme[key] as string) || '#000000'"
						@input="(e) => setTheme(key, (e.target as HTMLInputElement).value)" />
					<input
						:class="su.input"
						:value="(theme[key] as string) || ''"
						placeholder="#hex"
						@input="(e) => setTheme(key, (e.target as HTMLInputElement).value)" />
				</div>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
			<div>
				<label :class="su.label">Tint color</label>
				<div class="flex items-center gap-2">
					<input
						type="color"
						class="w-10 h-10 rounded border border-zinc-800 bg-zinc-950"
						:value="tintColor()"
						@input="(e) => setTint({ color: (e.target as HTMLInputElement).value })" />
					<input
						:class="su.input"
						:value="tintColor()"
						@input="(e) => setTint({ color: (e.target as HTMLInputElement).value })" />
				</div>
			</div>
			<div>
				<label :class="su.label">Tint opacity (0–1)</label>
				<input
					:class="su.input"
					type="number"
					step="0.05"
					min="0"
					max="1"
					:value="tintOpacity()"
					@input="(e) => setTint({ opacity: Number((e.target as HTMLInputElement).value) })" />
			</div>
		</div>
	</div>
</template>
