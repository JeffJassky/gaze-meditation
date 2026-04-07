<script setup lang="ts">
import { su } from '@new/components/ui/studioUi'

const config = defineModel<Record<string, unknown>>({ required: true })

function setNumber(key: string, v: string) {
	const n = Number(v)
	if (v === '' || Number.isNaN(n)) delete (config.value as any)[key]
	else (config.value as any)[key] = n
}
</script>

<template>
	<div :class="su.subCard">
		<h3 :class="[su.h3, 'mb-3']">Timing</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			<div>
				<label :class="su.label">Forced duration (s)</label>
				<input
					:class="su.input"
					type="number"
					step="0.5"
					:value="(config.duration as number) ?? ''"
					placeholder="auto"
					@input="(e) => setNumber('duration', (e.target as HTMLInputElement).value)" />
			</div>
			<div>
				<label :class="su.label">Fade out (s)</label>
				<input
					:class="su.input"
					type="number"
					step="0.1"
					:value="(config.fadeOutDuration as number) ?? ''"
					@input="(e) => setNumber('fadeOutDuration', (e.target as HTMLInputElement).value)" />
			</div>
			<div>
				<label :class="su.label">Cooldown (s)</label>
				<input
					:class="su.input"
					type="number"
					step="0.1"
					:value="(config.cooldown as number) ?? ''"
					@input="(e) => setNumber('cooldown', (e.target as HTMLInputElement).value)" />
			</div>
		</div>
	</div>
</template>
