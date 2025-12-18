<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { audioSession } from '../services/audio'
import type { AudioBusName } from '../services/audio/types'

const isExpanded = ref(false)
const updateInterval = ref<number | null>(null)

// State to display
const masterVolume = ref(1)
const busVolumes = ref<Record<AudioBusName, number>>({
	binaural: 1,
	music: 1,
	vocals: 1,
	fx: 1
})

const binauralState = ref({
	active: false,
	carrier: 0,
	beat: 0,
	volume: 0
})

const syncState = () => {
	if (!audioSession.ctx) return

	// We can't easily read back the exact current gain value if it's ramping, 
	// but we can track what we set or just trust the controls.
	// For actual debugging, let's just show what the engine reports.
	
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

onMounted(() => {
	syncState()
	updateInterval.value = window.setInterval(syncState, 500)
})

onUnmounted(() => {
	if (updateInterval.value) clearInterval(updateInterval.value)
})
</script>

<template>
	<div class="fixed top-4 right-4 z-[100] text-xs font-mono">
		<button 
			@click="isExpanded = !isExpanded"
			class="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1 rounded shadow hover:bg-zinc-800"
		>
			Audio Debug {{ isExpanded ? '[-]' : '[+]' }}
		</button>

		<div v-if="isExpanded" class="mt-2 bg-zinc-900/90 border border-zinc-700 p-4 rounded shadow-xl w-64 backdrop-blur-sm">
			<!-- Master -->
			<div class="mb-4">
				<div class="flex justify-between mb-1">
					<span class="text-white font-bold">MASTER</span>
					<span class="text-cyan-400">{{ masterVolume.toFixed(2) }}</span>
				</div>
				<input 
					type="range" min="0" max="2" step="0.1" 
					:value="masterVolume" @input="updateMaster"
					class="w-full accent-cyan-500"
				>
			</div>

			<!-- Buses -->
			<div class="space-y-2 mb-4">
				<div v-for="(vol, bus) in busVolumes" :key="bus">
					<div class="flex justify-between mb-1 text-zinc-400">
						<span class="uppercase">{{ bus }}</span>
						<span>{{ vol.toFixed(2) }}</span>
					</div>
					<input 
						type="range" min="0" max="2" step="0.1" 
						:value="vol" @input="e => updateBus(bus as AudioBusName, e)"
						class="w-full accent-zinc-500"
					>
				</div>
			</div>

			<!-- Binaural State -->
			<div class="border-t border-zinc-700 pt-2">
				<div class="flex justify-between items-center mb-2">
					<span class="font-bold text-white">BINAURAL</span>
					<span :class="binauralState.active ? 'text-green-400' : 'text-zinc-600'">
						{{ binauralState.active ? 'ACTIVE' : 'OFF' }}
					</span>
				</div>
				<div v-if="binauralState.active" class="space-y-1 text-zinc-400">
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
</template>
