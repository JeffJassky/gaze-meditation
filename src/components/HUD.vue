<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { SessionState, type ThemeConfig, type SessionReport } from '../types'
import { DEFAULT_THEME } from '../theme'
import { type Scene } from '../../src-new/core/Scene'
import NeuralScoreDisplay from './NeuralScoreDisplay.vue'

interface HUDProps {
	state: SessionState
	currentScene?: Scene // Now receiving Scene
	score: number
}

const props = defineProps<HUDProps>()
const emit = defineEmits(['exit'])

const resolvedThemeRef = inject<Ref<ThemeConfig>>('resolvedTheme')
const resolvedTheme = computed(() => resolvedThemeRef?.value || DEFAULT_THEME)

const report = inject<Ref<SessionReport | undefined>>('sessionReport')

const hudStyles = computed(() => {
	return {
		transition: 'all 0.4s ease'
	}
})

const formatDuration = (ms: number) => {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
	<div
		:class="`absolute inset-0 pointer-events-none p-8 flex flex-col justify-between`"
		:style="hudStyles"
	>
		<!-- Top Bar: Metrics & System Status -->
		<NeuralScoreDisplay
			:score="props.score"
			:theme="resolvedTheme"
		/>
		<div class="flex justify-between items-start"></div>

		<!-- Center: Reinforcement Feedback -->
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl"
		>
			<Transition
				name="hud-fade"
				mode="out-in"
			>
				                    					<div
				                    						v-if="state === SessionState.REINFORCING_POS"
				                    						class="text-4xl font-bold tracking-widest text-emerald-400"
				                    					>
				                    						{{ props.currentScene?.config.behavior?.success?.message || 'SUCCESS' }}
				                    					</div>
				                    					<div
				                    						v-else-if="state === SessionState.REINFORCING_NEG"
				                    						class="text-4xl font-bold tracking-widest text-rose-500"
				                    					>
				                    						{{ props.currentScene?.config.behavior?.fail?.message || 'FAILED' }}
				                    					</div>
				                    
				<div
					v-else-if="props.state === SessionState.FINISHED"
					key="finished"
					class="space-y-8"
				>
					<h1
						class="text-5xl font-bold"
						:style="{ color: resolvedTheme.textColor }"
					>
						Session Complete.
					</h1>

					<div
						v-if="report"
						class="grid grid-cols-2 gap-8 text-left max-w-xl mx-auto"
					>
						<!-- Score -->
						<div class="col-span-2 text-center mb-4">
							<div
								class="text-7xl font-black animate-pulse"
								:style="{ color: resolvedTheme.accentColor }"
							>
								{{ report.points }}
							</div>
							<p
								class="text-sm tracking-widest opacity-60 uppercase"
								:style="{ color: resolvedTheme.secondaryTextColor }"
							>
								Points Earned
							</p>
						</div>

						<!-- Metrics -->
						<div class="bg-white/5 p-4 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center text-center">
							<div
								class="text-3xl font-bold"
								:style="{ color: resolvedTheme.textColor }"
							>
								{{ formatDuration(report.durationMs) }}
							</div>
							<p
								class="text-xs tracking-widest opacity-60 uppercase mt-1"
								:style="{ color: resolvedTheme.secondaryTextColor }"
							>
								Time Elapsed
							</p>
						</div>

						<div class="bg-white/5 p-4 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center text-center">
							<div
								class="text-3xl font-bold"
								:style="{ color: resolvedTheme.textColor }"
							>
								{{ report.scenesCompleted }} / {{ report.totalScenes }}
							</div>
							<p
								class="text-xs tracking-widest opacity-60 uppercase mt-1"
								:style="{ color: resolvedTheme.secondaryTextColor }"
							>
								Scenes
							</p>
						</div>

						<!-- Biometrics Visualization -->
						<div
							v-if="report.biometrics"
							class="col-span-2 mt-4 space-y-6 bg-white/5 p-6 rounded-xl backdrop-blur-sm"
						>
							<h3
								class="text-sm uppercase tracking-widest text-center mb-6 opacity-80"
								:style="{ color: resolvedTheme.secondaryTextColor }"
							>
								Physiological Depth
							</h3>

							<!-- Stillness -->
							<div class="space-y-2">
								<div class="flex justify-between text-xs uppercase tracking-wider opacity-60">
									<span>Stillness</span>
									<span class="text-emerald-400">+{{ (report.biometrics.stillness.improvement * 100).toFixed(0) }}%</span>
								</div>
								<div class="relative h-2 bg-white/10 rounded-full overflow-hidden">
									<!-- Background Bar (Start) -->
									<div
										class="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000"
										:style="{ width: `${report.biometrics.stillness.start * 100}%` }"
									></div>
									<!-- Foreground Bar (Best) -->
									<div
										class="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 delay-300"
										:style="{ width: `${report.biometrics.stillness.best * 100}%` }"
									></div>
								</div>
							</div>

							<!-- Visual Focus (Inv Blink Rate) -->
							<div class="space-y-2">
								<div class="flex justify-between text-xs uppercase tracking-wider opacity-60">
									<span>Visual Focus</span>
									<span class="text-blue-400">+{{ (report.biometrics.blinkRate.improvement * 100).toFixed(0) }}%</span>
								</div>
								<div class="relative h-2 bg-white/10 rounded-full overflow-hidden">
									<!-- Inverted logic: Lower rate is better, so 'Focus' = 1 - (rate/30) -->
									<!-- We already normalized this logic in the SessionTracker, but here let's visualize "Quieting" -->
									<!-- Actually, let's visualize "Quieting" as a reduction bar -->
									<div
										class="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000"
										:style="{ width: `${Math.min(100, (report.biometrics.blinkRate.start / 30) * 100)}%` }"
									></div>
									<div
										class="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 delay-500"
										:style="{ width: `${Math.min(100, (report.biometrics.blinkRate.best / 30) * 100)}%` }"
									></div>
								</div>
								<div class="flex justify-between text-[10px] opacity-40">
									<span>Start: {{ report.biometrics.blinkRate.start.toFixed(1) }} BPM</span>
									<span>Best: {{ report.biometrics.blinkRate.best.toFixed(1) }} BPM</span>
								</div>
							</div>

							<!-- Blink Speed -->
							<div class="space-y-2">
								<div class="flex justify-between text-xs uppercase tracking-wider opacity-60">
									<span>Blink Duration</span>
									<span class="text-rose-400">+{{ (report.biometrics.blinkSpeed.improvement * 100).toFixed(0) }}%</span>
								</div>
								<div class="relative h-2 bg-white/10 rounded-full overflow-hidden">
									<!-- Longer duration is generally better (more relaxed), so this is an increasing bar -->
									<div
										class="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000"
										:style="{ width: `${Math.min(100, (report.biometrics.blinkSpeed.start / 300) * 100)}%` }"
									></div>
									<div
										class="absolute top-0 left-0 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000 delay-600"
										:style="{ width: `${Math.min(100, (report.biometrics.blinkSpeed.best / 300) * 100)}%` }"
									></div>
								</div>
								<div class="flex justify-between text-[10px] opacity-40">
									<span>Start: {{ report.biometrics.blinkSpeed.start.toFixed(0) }} ms</span>
									<span>Best: {{ report.biometrics.blinkSpeed.best.toFixed(0) }} ms</span>
								</div>
							</div>

							<!-- Facial Relaxation (Inv Tension) -->
							<div class="space-y-2">
								<div class="flex justify-between text-xs uppercase tracking-wider opacity-60">
									<span>Facial Release</span>
									<span class="text-purple-400">+{{ (report.biometrics.relaxation.improvement * 100).toFixed(0) }}%</span>
								</div>
								<div class="relative h-2 bg-white/10 rounded-full overflow-hidden">
									<!-- Tension: Lower is better -->
									<div
										class="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000"
										:style="{ width: `${report.biometrics.relaxation.start * 100}%` }"
									></div>
									<div
										class="absolute top-0 left-0 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000 delay-700"
										:style="{ width: `${report.biometrics.relaxation.best * 100}%` }"
									></div>
								</div>
							</div>

							<!-- Eye Droop (Calmness) -->
							<div class="space-y-2">
								<div class="flex justify-between text-xs uppercase tracking-wider opacity-60">
									<span>Gaze Softening</span>
									<span class="text-orange-400">{{ (report.biometrics.eyeDroop.start * 100).toFixed(0) }}% -> {{ (report.biometrics.eyeDroop.best * 100).toFixed(0) }}%</span>
								</div>
								<div class="relative h-2 bg-white/10 rounded-full overflow-hidden">
									<!-- Openness: Start (high) -> Best (low) -->
									<div
										class="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000"
										:style="{ width: `${report.biometrics.eyeDroop.start * 100}%` }"
									></div>
									<div
										class="absolute top-0 left-0 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-1000 delay-900"
										:style="{ width: `${report.biometrics.eyeDroop.best * 100}%` }"
									></div>
								</div>
							</div>
						</div>
					</div>

					<template v-else-if="props.score > 0">
						<div
							class="text-7xl font-black animate-pulse"
							:style="{ color: resolvedTheme.accentColor }"
						>
							{{ props.score }}
						</div>
						<p
							class="text-xl tracking-widest opacity-60"
							:style="{ color: resolvedTheme.secondaryTextColor }"
						>
							POINTS EARNED
						</p>
					</template>
				</div>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.hud-fade-enter-active,
.hud-fade-leave-active {
	transition: opacity 2s ease;
}

.hud-fade-enter-from,
.hud-fade-leave-to {
	opacity: 0;
}
</style>
