<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Session } from '@/api/sessions'
import type { SoundboardSample } from '@shared/types'
import AssetPicker from './AssetPicker.vue'

const session = defineModel<Session>({ required: true })

const samples = computed<SoundboardSample[]>({
	get: () => session.value.audio?.soundboard ?? [],
	set: v => {
		const audio = session.value.audio ?? {}
		audio.soundboard = v
		session.value.audio = audio
	}
})

const expandedIndex = ref<number | null>(null)
function toggleExpanded(i: number) {
	expandedIndex.value = expandedIndex.value === i ? null : i
}

function addSample() {
	const id = crypto.randomUUID().slice(0, 8)
	samples.value = [...samples.value, { id, path: '', volume: 1, loop: false }]
	expandedIndex.value = samples.value.length - 1
}

function removeSample(index: number) {
	const next = samples.value.slice()
	next.splice(index, 1)
	samples.value = next
	if (expandedIndex.value === index) expandedIndex.value = null
	else if (expandedIndex.value !== null && expandedIndex.value > index) expandedIndex.value--
}

function updateSample(index: number, patch: Partial<SoundboardSample>) {
	const next = samples.value.slice()
	const current = next[index]
	if (!current) return
	next[index] = { ...current, ...patch }
	samples.value = next
}

function samplePath(index: number): string | null {
	return samples.value[index]?.path || null
}

function setSamplePath(index: number, key: string | null) {
	updateSample(index, { path: key ?? '' })
}

/** Derive a display name from the file path / label. */
function displayName(s: SoundboardSample): string {
	if (!s.path) return 'No file selected'
	// Find the matching asset to get its label
	const assets = session.value.assets ?? []
	const asset = assets.find(a => a.key === s.path)
	if (asset?.label) {
		// Strip extension for cleaner display
		return asset.label.replace(/\.[^.]+$/, '')
	}
	// Fallback: extract filename from path
	const segments = s.path.split('/')
	return (segments[segments.length - 1] ?? s.path).replace(/\.[^.]+$/, '')
}
</script>

<template>
	<div>
		<div
			v-if="samples.length === 0"
			class="text-center py-3"
		>
			<p class="text-[11px] text-content-tertiary mb-3 leading-relaxed">
				Add audio that scenes can trigger — ambient loops, sound effects, music.
			</p>
			<button
				type="button"
				class="text-xs text-content-secondary hover:text-content border border-edge-secondary hover:border-edge-secondary rounded-lg px-3 py-1.5 transition"
				@click="addSample"
			>
				+ Add sample
			</button>
		</div>

		<div
			v-else
			class="space-y-px"
		>
			<div
				v-for="(s, i) in samples"
				:key="s.id"
				class="rounded-lg transition-colors overflow-hidden"
				:class="
					expandedIndex === i
						? 'bg-surface-secondary/80 ring-1 ring-edge'
						: 'hover:bg-surface-secondary/30'
				"
			>
				<!-- Header row -->
				<button
					type="button"
					class="w-full flex items-center gap-2 px-2 py-1.5 text-left"
					v-tooltip="s.loop ? 'Looping sample' : 'One-shot sample'"
					@click="toggleExpanded(i)"
				>
					<span
						class="shrink-0 w-[3px] h-5 rounded-full"
						:class="s.loop ? 'bg-info' : 'bg-warning'"
					/>
					<span class="flex-1 min-w-0 text-[11px] text-content truncate">
						{{ displayName(s) }}
					</span>
					<svg
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-content-tertiary transition-transform duration-150 shrink-0"
						:class="expandedIndex === i ? 'rotate-180' : ''"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>

				<!-- Expanded -->
				<div
					v-if="expandedIndex === i"
					class="px-2 pb-2 pt-1 space-y-2.5"
				>
					<AssetPicker
						:model-value="samplePath(i)"
						kind="fx"
						placeholder="Select audio file..."
						@update:model-value="v => setSamplePath(i, v)"
					/>

					<!-- Volume -->
					<div>
						<span class="text-[10px] text-content-tertiary mb-0.5 block">Vol</span>
						<input
							type="range"
							class="w-full h-1 rounded-full appearance-none cursor-pointer range-track"
							min="0"
							max="3"
							step="0.05"
							:value="s.volume ?? 1"
							@input="
								e =>
									updateSample(i, {
										volume: Number((e.target as HTMLInputElement).value)
									})
							"
						/>
					</div>

					<!-- Loop + Fades row -->
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="shrink-0 text-[10px] px-2 py-1 rounded transition flex items-center gap-1"
							:class="
								s.loop
									? 'bg-info/15 text-info ring-1 ring-info/30'
									: 'bg-surface-tertiary/60 text-content-tertiary ring-1 ring-edge-secondary/40 hover:text-content-secondary'
							"
							v-tooltip="
								s.loop
									? 'Loops until stopped by a scene'
									: 'Plays once when triggered'
							"
							@click="updateSample(i, { loop: !s.loop })"
						>
							<svg
								v-if="s.loop"
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="17 1 21 5 17 9" />
								<path d="M3 11V9a4 4 0 0 1 4-4h14" />
								<polyline points="7 23 3 19 7 15" />
								<path d="M21 13v2a4 4 0 0 1-4 4H3" />
							</svg>
							{{ s.loop ? 'Loop' : 'One-shot' }}
						</button>

						<div class="flex-1 grid grid-cols-2 gap-1.5">
							<div class="flex items-center gap-1">
								<span
									class="text-[9px] text-content-tertiary shrink-0"
									v-tooltip="'Fade in duration in seconds'"
									>In</span
								>
								<input
									class="w-full bg-surface border border-edge rounded px-1.5 py-0.5 text-[10px] text-content-secondary tabular-nums focus:outline-none focus:border-edge-secondary transition text-center"
									type="number"
									min="0"
									step="0.5"
									placeholder="0"
									:value="s.fadeInDuration ?? ''"
									@input="
										e =>
											updateSample(i, {
												fadeInDuration:
													Number((e.target as HTMLInputElement).value) ||
													undefined
											})
									"
								/>
							</div>
							<div class="flex items-center gap-1">
								<span
									class="text-[9px] text-content-tertiary shrink-0"
									v-tooltip="'Fade out duration in seconds'"
									>Out</span
								>
								<input
									class="w-full bg-surface border border-edge rounded px-1.5 py-0.5 text-[10px] text-content-secondary tabular-nums focus:outline-none focus:border-edge-secondary transition text-center"
									type="number"
									min="0"
									step="0.5"
									placeholder="0"
									:value="s.fadeOutDuration ?? ''"
									@input="
										e =>
											updateSample(i, {
												fadeOutDuration:
													Number((e.target as HTMLInputElement).value) ||
													undefined
											})
									"
								/>
							</div>
						</div>
					</div>

					<!-- Delete -->
					<div class="flex justify-end">
						<button
							type="button"
							class="text-[10px] text-content-tertiary hover:text-danger transition"
							@click="removeSample(i)"
						>
							Remove
						</button>
					</div>
				</div>
			</div>

			<button
				type="button"
				class="w-full text-[11px] text-content-tertiary hover:text-content-secondary py-1.5 transition text-center"
				@click="addSample"
			>
				+ Add sample
			</button>
		</div>
	</div>
</template>

<style scoped>
.range-track {
	background: linear-gradient(to right, #3f3f46, #3f3f46);
}
.range-track::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #a1a1aa;
	cursor: pointer;
	border: none;
}
.range-track::-moz-range-thumb {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #a1a1aa;
	cursor: pointer;
	border: none;
}
</style>
