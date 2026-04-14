<script setup lang="ts">
import type { SceneConfig } from '@shared/types'

const config = defineModel<SceneConfig>({ required: true })

function msToSeconds(ms: unknown): number | '' {
	if (typeof ms !== 'number' || Number.isNaN(ms)) return ''
	return ms / 1000
}
function setSecondsField(key: 'duration' | 'fadeInDuration' | 'fadeOutDuration' | 'cooldown', raw: string) {
	if (raw === '') {
		delete config.value[key]
		return
	}
	const n = Number(raw)
	if (!Number.isFinite(n)) return
	config.value[key] = Math.round(n * 1000)
}

const fields = [
	{ key: 'fadeInDuration' as const, label: 'Fade in', step: 0.1, placeholder: 'auto' },
	{ key: 'duration' as const, label: 'Duration', step: 0.5, placeholder: 'auto' },
	{ key: 'fadeOutDuration' as const, label: 'Fade out', step: 0.1, placeholder: 'auto' },
	{ key: 'cooldown' as const, label: 'Break after', step: 0.1, placeholder: 'auto' },
]
</script>

<template>
	<div class="flex gap-3">
		<!-- Timeline indicator -->
		<div class="flex flex-col items-center pt-1.5 shrink-0 w-3">
			<template v-for="(f, i) in fields" :key="f.key">
				<div class="w-2 h-2 rounded-full shrink-0"
					:class="config[f.key] ? 'bg-content-secondary' : 'bg-edge-secondary ring-1 ring-edge-secondary'" />
				<div v-if="i < fields.length - 1" class="w-px flex-1 min-h-[16px] bg-edge" />
			</template>
		</div>

		<!-- Fields -->
		<div class="flex-1 space-y-2.5">
			<div v-for="f in fields" :key="f.key">
				<label class="text-[10px] uppercase tracking-wider text-content-tertiary mb-1 block">{{ f.label }}</label>
				<div class="flex items-center gap-2">
					<input
						class="w-16 bg-surface border border-edge rounded px-2 py-1 text-xs text-content-secondary tabular-nums text-right focus:outline-none focus:border-edge-secondary transition"
						type="number"
						:step="f.step"
						:placeholder="f.placeholder"
						:value="msToSeconds(config[f.key])"
						@input="(e) => setSecondsField(f.key, (e.target as HTMLInputElement).value)" />
					<span class="text-[10px] text-content-tertiary">sec</span>
				</div>
			</div>
		</div>
	</div>
</template>
