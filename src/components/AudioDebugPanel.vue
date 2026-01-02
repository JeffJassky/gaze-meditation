<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { audioSession } from '../services/audio'
import type { AudioBusName } from '../services/audio/types'

const updateInterval = ref<number | null>(null)
const isHovering = ref(false)
const isMixerOpen = ref(false)
const audioDebugRoot = ref<HTMLElement | null>(null)

// State to display
const masterVolume = ref(1.0)
const busVolumes = ref<Record<AudioBusName, number>>({
	binaural: 0.25,
	music: 0.25,
	voice: 0.25,
	fx: 0.25
})

const binauralState = ref({
	active: false,
	carrier: 0,
	beat: 0,
	volume: 0
})

const syncState = () => {
	if (!audioSession.ctx) return

	binauralState.value.active = audioSession.binaural.isActive
	if (audioSession.binaural.currentConfig) {
		binauralState.value.carrier = audioSession.binaural.currentConfig.carrierFreq
		binauralState.value.beat = audioSession.binaural.currentConfig.beatFreq
		binauralState.value.volume = audioSession.binaural.currentConfig.volume || 0
	}
}

const updateMaster = (e: Event) => {
	const val = parseFloat((e.target as HTMLInputElement).value)
	masterVolume.value = val
	audioSession.setMasterVolume(val)
}

const updateBus = (bus: AudioBusName, e: Event) => {
	const val = parseFloat((e.target as HTMLInputElement).value)
	busVolumes.value[bus] = val
	audioSession.setBusVolume(bus, val)
}

const handleClickOutside = (e: MouseEvent) => {
	if (
		isMixerOpen.value &&
		audioDebugRoot.value &&
		!audioDebugRoot.value.contains(e.target as Node)
	) {
		isMixerOpen.value = false
	}
}

const handleKeyDown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && isMixerOpen.value) {
		e.stopPropagation() // Prevent Theater from exiting
		isMixerOpen.value = false
	}
}

onMounted(() => {
	syncState()
	updateInterval.value = window.setInterval(syncState, 500)
	window.addEventListener('click', handleClickOutside)
	window.addEventListener('keydown', handleKeyDown, { capture: true }) // Capture to stop propagation early
})

onUnmounted(() => {
	if (updateInterval.value) clearInterval(updateInterval.value)
	window.removeEventListener('click', handleClickOutside)
	window.removeEventListener('keydown', handleKeyDown, { capture: true })
})
</script>

<template>
	<div
		ref="audioDebugRoot"
		class="relative flex items-center justify-center"
		@mouseenter="isHovering = true"
		@mouseleave="isHovering = false"
	>
		<!-- Speaker Icon Trigger -->
		<button
			class="p-2 rounded text-zinc-400 hover:text-white transition-colors"
			:class="{ 'text-white': isHovering || isMixerOpen }"
		>
			<svg
				v-if="masterVolume === 0"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
				<line
					x1="23"
					y1="9"
					x2="17"
					y2="15"
				/>
				<line
					x1="17"
					y1="9"
					x2="23"
					y2="15"
				/>
			</svg>
			<svg
				v-else-if="masterVolume < 0.5"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
				<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
			</svg>
			<svg
				v-else
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
				<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
				<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
			</svg>
		</button>

		<!-- Popover Container -->
		<Transition name="fade-slide">
			<div
				v-if="isHovering || isMixerOpen"
				class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-2 pb-2"
			>
				<!-- Volume Control Container -->
				<div
					class="bg-zinc-900/90 border border-zinc-700 p-2 rounded-full shadow-xl backdrop-blur-sm flex flex-col items-center gap-2"
				>
					<!-- Gear Icon (Toggle Mixer) -->
					<button
						@click="isMixerOpen = !isMixerOpen"
						class="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
						title="Open Mixer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle
								cx="12"
								cy="12"
								r="3"
							/>
							<path
								d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
							/>
						</svg>
					</button>

					<!-- Vertical Master Volume -->
					<div class="h-24 w-6 flex items-center justify-center py-2">
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							:value="masterVolume"
							@input="updateMaster"
							class="vertical-slider w-2 h-full accent-cyan-500 rounded-full appearance-none bg-zinc-700 cursor-pointer"
						/>
					</div>
				</div>

				<!-- Full Mixer Panel -->
				<div
					v-if="isMixerOpen"
					class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900/95 border border-zinc-700 p-4 rounded-xl shadow-2xl w-64 backdrop-blur-md text-xs font-mono"
				>
					<!-- Buses -->
					<div class="space-y-3 mb-4">
						<div
							v-for="(vol, bus) in busVolumes"
							:key="bus"
						>
							<div
								class="flex justify-between mb-1 text-zinc-400 text-[10px] uppercase tracking-wider"
							>
								<span>{{ bus }}</span>
								<span>{{ vol.toFixed(2) }}</span>
							</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								:value="vol"
								@input="e => updateBus(bus as AudioBusName, e)"
								class="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400"
							/>
						</div>
					</div>

					<!-- Binaural State -->
					<div class="border-t border-zinc-700 pt-3 mt-2">
						<div class="flex justify-between items-center mb-2">
							<span class="font-bold text-white text-[10px] tracking-wider"
								>BINAURAL</span
							>
							<span
								class="text-[10px]"
								:class="binauralState.active ? 'text-green-400' : 'text-zinc-600'"
							>
								{{ binauralState.active ? 'ACTIVE' : 'OFF' }}
							</span>
						</div>
						<div
							v-if="binauralState.active"
							class="space-y-1 text-zinc-400 text-[10px]"
						>
							<div class="flex justify-between">
								<span>Carrier</span>
								<span>{{ binauralState.carrier }}Hz</span>
							</div>
							<div class="flex justify-between">
								<span>Beat</span>
								<span class="text-cyan-400">{{ binauralState.beat }}Hz</span>
							</div>
							<div class="flex justify-between">
								<span>Vol</span>
								<span>{{ binauralState.volume }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.vertical-slider {
	writing-mode: vertical-lr;
	direction: rtl;
	appearance: auto;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
	transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
	opacity: 0;
	transform: translate(-50%, 10px);
}
</style>
