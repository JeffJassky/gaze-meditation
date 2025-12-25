<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { sessionTracker } from '../services/sessionTracker'
import { breathAnalyzer } from '../services/analysis/breathAnalyzer'
import { faceMeshService } from '../services/faceMeshService'

const width = 300
const height = 60
const padding = 2

// Reactive update loop for smooth rendering independent of tracker sampling
const now = ref(Date.now())
let rafId: number | null = null

const updateLoop = () => {
	now.value = Date.now()
	rafId = requestAnimationFrame(updateLoop)
}

onMounted(() => {
	rafId = requestAnimationFrame(updateLoop)
})

onUnmounted(() => {
	if (rafId) cancelAnimationFrame(rafId)
})

const formatTime = (ms: number) => {
	const s = Math.floor(ms / 1000)
	const m = Math.floor(s / 60)
	const rs = s % 60
	return `${m}:${rs.toString().padStart(2, '0')}`
}

const createPath = (key: 'stillness' | 'breathRate' | 'blinkRate' | 'blinkSpeed' | 'eyeOpenness' | 'mouthOpenness' | 'headRoll' | 'headPitch' | 'browRaise', max: number, min?: number) => {
	const history = sessionTracker.history
	if (history.length < 2) return ''

	const endTime = history[history.length - 1].timestamp
	
	const pts = history.map((h) => {
		const x = (h.timestamp / (endTime || 1)) * width
		let val = h[key]
		
		let normalized = 0
		if (min !== undefined) {
			normalized = (val - min) / (max - min)
		} else if (key === 'headRoll' || key === 'headPitch') {
			// Center-based normalization for bipolar signals [-scale, +scale]
			// Clamp to range
			val = Math.max(-max, Math.min(max, val))
			// Map to 0-1 (where 0.5 is center)
			normalized = (val + max) / (2 * max)
		} else {
			// Standard 0-based normalization [0, scale]
			normalized = Math.max(0, Math.min(max, val)) / max
		}

		// Final clamp
		normalized = Math.max(0, Math.min(1, normalized))

		// Invert Y (SVG coordinates: 0 is top, height is bottom)
		const y = height - (normalized * (height - 2 * padding) + padding)
		return `${x},${y}`
	})
	
	return `M ${pts.join(' L ')}`
}

const metrics = computed(() => sessionTracker.liveMetrics)
const breathState = computed(() => breathAnalyzer.state.value)
const breathSignal = computed(() => breathAnalyzer.fusedSignal.value.toFixed(3))
const breathConf = computed(() => (breathAnalyzer.confidence.value * 100).toFixed(0))
const activeAxis = computed(() => breathAnalyzer.activeAxis.value)
const breathDirection = computed(() => breathAnalyzer.crossingState.value)

// Accessing private property via any cast for debug, or we should expose it in SessionTracker.
// But we can check raw blinkDetected from faceMeshService to see if blinks are firing at all.
const blinkDetected = computed(() => faceMeshService.debugData.blinkDetected)
const eyeOpenness = computed(() => faceMeshService.debugData.eyeOpennessNormalized.toFixed(2))

</script>

<template>
	<div class="bg-black/90 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 w-[350px] space-y-4 shadow-2xl">
		<div class="flex justify-between items-center border-b border-zinc-800 pb-2">
			<div class="flex flex-col">
				<span class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Session Monitor</span>
				<span class="text-cyan-400 font-mono text-xl">{{ formatTime(metrics.elapsedTime) }}</span>
			</div>
			<div class="flex gap-2">
				<div class="w-2 h-2 rounded-full animate-pulse" :class="metrics.elapsedTime > 0 ? 'bg-green-500' : 'bg-zinc-700'"></div>
			</div>
		</div>

		<div class="space-y-4">
			<!-- Stillness -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Stillness</span>
					<span class="text-sm font-mono text-cyan-300">{{ (metrics.stillness * 100).toFixed(0) }}%</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<path :d="createPath('stillness', 1)" fill="none" stroke="#06b6d4" stroke-width="1.5" />
				</svg>
			</div>

			<!-- Breath -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<div class="flex items-center gap-2">
						<span class="text-xs text-zinc-400 uppercase tracking-wider">Respiration</span>
						<span 
							class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter transition-colors duration-300"
							:class="breathDirection === 'INHALE' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-500'"
						>
							{{ breathDirection === 'INHALE' ? 'Inhaling' : 'Exhaling' }}
						</span>
					</div>
					<div class="text-right">
						<span class="text-sm font-mono text-purple-300 block">{{ metrics.breathRate }} <span class="text-[10px] text-zinc-600">BPM</span></span>
					</div>
				</div>
				<!-- Debug Info -->
				<div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 mb-1">
					<div>State: <span :class="breathState === 'LOCKED' ? 'text-green-400' : 'text-yellow-500'">{{ breathState }}</span></div>
					<div>Conf: <span class="text-zinc-300">{{ breathConf }}%</span></div>
					<div>Signal: <span class="text-zinc-300">{{ breathSignal }}</span></div>
					<div>Axis: <span class="text-zinc-300">{{ activeAxis }}</span></div>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<path :d="createPath('breathRate', 20)" fill="none" stroke="#a855f7" stroke-width="1.5" />
				</svg>
			</div>
			
			<!-- Eye Openness (Raw) -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Eye Openness</span>
					<span class="text-sm font-mono text-orange-300">{{ eyeOpenness }}</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<path :d="createPath('eyeOpenness', 1)" fill="none" stroke="#fdba74" stroke-width="1.5" />
				</svg>
			</div>
			
			<!-- Mouth Openness -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Jaw Relaxation</span>
					<span class="text-sm font-mono text-blue-300">{{ metrics.mouthOpenness.toFixed(3) }}</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<!-- Scale max 0.5 covers most mouth open states -->
					<path :d="createPath('mouthOpenness', 0.5)" fill="none" stroke="#93c5fd" stroke-width="1.5" />
				</svg>
			</div>

			<!-- Head Roll (Neck Relaxation) -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Neck Tilt (Roll)</span>
					<span class="text-sm font-mono text-indigo-300">{{ (metrics.headRoll * 57.29).toFixed(1) }}°</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<path :d="createPath('headRoll', 0.5)" fill="none" stroke="#a5b4fc" stroke-width="1.5" />
				</svg>
			</div>

			<!-- Head Pitch (Nod) -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Head Pitch (Nod)</span>
					<span class="text-sm font-mono text-indigo-400">{{ (metrics.headPitch * 57.29).toFixed(1) }}°</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<!-- Range [0.15, 0.6] rad (~8-34 deg) covers the user's typical 12-30 deg range -->
					<path :d="createPath('headPitch', 0.6, 0.15)" fill="none" stroke="#818cf8" stroke-width="1.5" />
				</svg>
			</div>

			<!-- Brow Tension -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Brow Tension</span>
					<span class="text-sm font-mono text-rose-300">{{ metrics.browRaise.toFixed(3) }}</span>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<!-- Range is typically 0.15 (furrow) to 0.35 (raised). Normalize to 0.4 max -->
					<path :d="createPath('browRaise', 0.4)" fill="none" stroke="#fda4af" stroke-width="1.5" />
				</svg>
			</div>

			<!-- Blinks -->
			<div class="space-y-1">
				<div class="flex justify-between items-baseline">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Blink Rate</span>
					<span class="text-sm font-mono text-emerald-300">{{ metrics.blinkRate.toFixed(1) }} <span class="text-[10px] text-zinc-600">BPM</span></span>
				</div>
				<div class="flex gap-4 text-[10px] font-mono text-zinc-500 mb-1">
					<div>Blinking: <span :class="blinkDetected ? 'text-green-400' : 'text-zinc-600'">{{ blinkDetected ? 'YES' : 'NO' }}</span></div>
				</div>
				<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
					<path :d="createPath('blinkRate', 30)" fill="none" stroke="#10b981" stroke-width="1.5" />
				</svg>
			</div>
		</div>
	</div>
</template>
