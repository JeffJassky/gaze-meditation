<script setup lang="ts">
import { computed } from 'vue'
import type { SessionLog, PhysiologicalSnapshot } from '../types'

const props = defineProps<{
	session: SessionLog
}>()

const metrics = computed(() => props.session.physiologicalData || [])

const width = 600
const height = 100
const padding = 5

const createPath = (key: keyof PhysiologicalSnapshot) => {
	if (metrics.value.length < 2) return ''

	const lastMetric = metrics.value[metrics.value.length - 1]
	const maxTime = lastMetric ? lastMetric.timestamp : 0


	// Find min/max for auto-scaling if needed, or use fixed scale
	// Let's use fixed scales for known metrics to allow comparison
	
	let pts = metrics.value.map(m => {
		const x = (m.timestamp / maxTime) * width
		let val = m[key] as number
		
		// Normalize val to 0-1 based on expected range
		if (key === 'stillness') {
			// 0-1
		} else if (key === 'blinkRate') {
			val = val / 60 // 0-60 bpm -> 0-1
		} else if (key === 'blinkSpeed') {
			val = val / 500 // 0-500ms -> 0-1
		} else if (key === 'headYaw' || key === 'headPitch') {
			val = (val + 0.5) // -0.5 to 0.5 -> 0-1
		} else if (key === 'mouthOpenness') {
			val = val * 2 // 0-0.5 -> 0-1 (approx)
		} else if (key === 'headRoll') {
			val = (val + 0.5) // +/- 0.5 rad -> 0-1
		} else if (key === 'browRaise') {
			val = val * 2.5 // 0-0.4 -> 0-1
		}
		
		// Clamp
		val = Math.max(0, Math.min(1, val))
		
		// Invert Y (SVG coords)
		const y = height - (val * (height - 2 * padding) + padding)
		return `${x},${y}`
	})
	
	return `M ${pts.join(' L ')}`
}

// Format duration
const duration = computed(() => {
	if (!props.session.endTime) return 'N/A'
	const start = new Date(props.session.startTime).getTime()
	const end = new Date(props.session.endTime).getTime()
	const diff = end - start
	const mins = Math.floor(diff / 60000)
	const secs = Math.floor((diff % 60000) / 1000)
	return `${mins}m ${secs}s`
})
</script>

<template>
	<div class="bg-black/50 p-6 rounded-lg border border-zinc-800 space-y-6">
		<div class="flex justify-between items-end border-b border-zinc-800 pb-4">
			<div>
				<h3 class="text-white text-lg font-bold">Session Analysis</h3>
				<p class="text-zinc-500 text-xs font-mono">ID: {{ session.id }}</p>
			</div>
			<div class="text-right">
				<div class="text-zinc-400 text-xs uppercase tracking-wider">Duration</div>
				<div class="text-cyan-400 font-mono">{{ duration }}</div>
			</div>
		</div>

		<div v-if="metrics.length === 0" class="text-center text-zinc-600 py-8">
			No physiological data recorded for this session.
		</div>

		<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Blink Rate -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Blink Rate</span>
					<span class="text-zinc-600">0 - 60 BPM</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<!-- Grid Lines -->
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<!-- Data -->
					<path :d="createPath('blinkRate')" fill="none" stroke="#10b981" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>

			<!-- Stillness -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Stillness (Focus)</span>
					<span class="text-zinc-600">0 - 100%</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('stillness')" fill="none" stroke="#06b6d4" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>

			<!-- Jaw Relaxation -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Jaw Relaxation</span>
					<span class="text-zinc-600">0 - 0.5 Openness</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('mouthOpenness')" fill="none" stroke="#93c5fd" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>
			
			<!-- Head Roll -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Neck Relaxation (Roll)</span>
					<span class="text-zinc-600">0 - 30°</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('headRoll')" fill="none" stroke="#a5b4fc" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>
			
			<!-- Brow Tension -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Brow Tension</span>
					<span class="text-zinc-600">Low - High</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('browRaise')" fill="none" stroke="#fda4af" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>
			
			<!-- Blink Speed (Duration) -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Blink Duration</span>
					<span class="text-zinc-600">0 - 500ms</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('blinkSpeed')" fill="none" stroke="#a855f7" stroke-width="2" class="opacity-80"/>
				</svg>
			</div>
			
			<!-- Head Motion (Yaw/Pitch) -->
			<div class="space-y-2">
				<div class="flex justify-between text-xs uppercase tracking-wider">
					<span class="text-zinc-400">Head Motion (Yaw/Pitch)</span>
					<span class="text-zinc-600">Center Deviation</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-24 bg-zinc-900/50 rounded border border-zinc-800">
					<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>
					<path :d="createPath('headYaw')" fill="none" stroke="#f59e0b" stroke-width="1.5" class="opacity-60"/>
					<path :d="createPath('headPitch')" fill="none" stroke="#ef4444" stroke-width="1.5" class="opacity-60"/>
				</svg>
				<div class="flex gap-4 justify-end text-[10px]">
					<span class="text-amber-500">Yaw</span>
					<span class="text-red-500">Pitch</span>
				</div>
			</div>
		</div>
	</div>
</template>
