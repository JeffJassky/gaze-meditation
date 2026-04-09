<script setup lang="ts">
import { su } from '@new/components/ui/studioUi'

const config = defineModel<Record<string, unknown>>({ required: true })

// All three timing fields (duration, fadeOutDuration, cooldown) are stored
// in milliseconds to match existing program data and what the runtime
// reads. The editor's inputs show seconds for friendliness and convert
// at the boundary.
function msToSeconds(ms: unknown): number | '' {
	if (typeof ms !== 'number' || Number.isNaN(ms)) return ''
	return ms / 1000
}
function setSecondsField(key: string, raw: string) {
	if (raw === '') {
		delete (config.value as any)[key]
		return
	}
	const n = Number(raw)
	if (!Number.isFinite(n)) return
	;(config.value as any)[key] = Math.round(n * 1000)
}
</script>

<template>
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<label :class="[su.label, '!mb-0 flex-1']">Forced duration (s)</label>
			<input
				:class="[su.input, 'w-16 text-right']"
				type="number"
				step="0.5"
				:value="msToSeconds(config.duration)"
				placeholder="auto"
				@input="(e) => setSecondsField('duration', (e.target as HTMLInputElement).value)" />
		</div>
		<div class="flex items-center gap-3">
			<label :class="[su.label, '!mb-0 flex-1']">Fade in (s)</label>
			<input
				:class="[su.input, 'w-16 text-right']"
				type="number"
				step="0.1"
				:value="msToSeconds(config.fadeInDuration)"
				@input="
					(e) => setSecondsField('fadeInDuration', (e.target as HTMLInputElement).value)
				" />
		</div>
		<div class="flex items-center gap-3">
			<label :class="[su.label, '!mb-0 flex-1']">Fade out (s)</label>
			<input
				:class="[su.input, 'w-16 text-right']"
				type="number"
				step="0.1"
				:value="msToSeconds(config.fadeOutDuration)"
				@input="
					(e) => setSecondsField('fadeOutDuration', (e.target as HTMLInputElement).value)
				" />
		</div>
		<div class="flex items-center gap-3">
			<label :class="[su.label, '!mb-0 flex-1']">Break (s)</label>
			<input
				:class="[su.input, 'w-16 text-right']"
				type="number"
				step="0.1"
				:value="msToSeconds(config.cooldown)"
				@input="
					(e) => setSecondsField('cooldown', (e.target as HTMLInputElement).value)
				" />
		</div>
	</div>
</template>
