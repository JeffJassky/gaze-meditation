<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { SessionState, type ThemeConfig } from '../types'
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

const hudStyles = computed(() => {
	return {
		transition: 'all 0.4s ease'
	}
})
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
				<h1
					v-if="
						props.state === SessionState.REINFORCING_POS &&
						props.currentScene?.config.behavior?.success?.enabled !== false
					"
					key="pos"
					class="text-6xl font-black drop-shadow-[0_0_25px_rgba(74,222,128,0.8)] animate-bounce"
					:style="{ color: resolvedTheme.positiveColor }"
				>
					{{ props.currentScene.config.behavior?.success?.message || 'SUCCESS' }}
				</h1>

				<h1
					v-else-if="
						props.state === SessionState.REINFORCING_NEG &&
						props.currentScene?.config.behavior?.fail?.enabled !== false
					"
					key="neg"
					class="text-6xl font-black drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] glitch-text"
					:style="{ color: resolvedTheme.negativeColor }"
				>
					{{ props.currentScene.config.behavior?.fail?.message || 'FAILED' }}
				</h1>

				<div
					v-else-if="props.state === SessionState.FINISHED"
					key="finished"
					class="space-y-4"
				>
					<h1
						class="text-5xl font-bold"
						:style="{ color: resolvedTheme.textColor }"
					>
						Session Complete.
					</h1>
					<template v-if="props.score > 0">
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