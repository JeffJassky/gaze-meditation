<template>
	<div
		class="breathe-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<div class="visualizer-container">
			<!-- 
        Base Size: 200px
        Scale: 0.8 (Exhale) to 1.2 (Inhale)
      -->
			<div
				class="breath-circle"
				:style="{
					transform: `scale(${1 + instruction.breathSignal.value * 0.3})`,
					backgroundColor: (instruction.resolvedTheme.accentColor || '#00ffff') + '20', // Low opacity fill
					boxShadow: `
            0 0 40px ${(instruction.resolvedTheme.accentColor || '#00ffff')}40, 
            inset 0 0 60px ${(instruction.resolvedTheme.accentColor || '#00ffff')}40
          `,
					border: `2px solid ${(instruction.resolvedTheme.accentColor || '#00ffff')}60`
				}"
			></div>

			<div class="guide-text" :style="{ opacity: Math.abs(instruction.breathSignal.value) > 0.2 ? 0.8 : 0.3 }">
				<span v-if="instruction.breathSignal.value > 0.1">INHALE</span>
				<span v-else-if="instruction.breathSignal.value < -0.1">EXHALE</span>
				<span v-else>...</span>
			</div>
		</div>

		<ProgressBar
			v-if="instruction.options.duration"
			:progress="instruction.progress.value"
			:fillColor="instruction.resolvedTheme.positiveColor"
			:trackColor="instruction.resolvedTheme.secondaryTextColor + '20'"
		/>

		<div
			class="debug-stats"
			:style="{ color: instruction.resolvedTheme.secondaryTextColor }"
		>
      <h3 class="debug-title">Statistical Observer</h3>
      
			<div class="stat-row">
				<span class="label">State:</span>
				<span class="value" :class="{ 'text-green-400': instruction.controller.state.value === 'LOCKED', 'text-yellow-400': instruction.controller.state.value === 'CALIBRATING', 'text-red-400': instruction.controller.state.value === 'DISTURBED' }">
          {{ instruction.controller.state.value }}
        </span>
			</div>
      
      <div class="stat-row">
				<span class="label">Winner:</span>
				<span class="value">{{ instruction.controller.activeAxis.value }}</span>
			</div>
      
      <div class="stat-divider"></div>

      <!-- Channels -->
      <div v-for="(ch, key) in instruction.controller.channels" :key="key" class="stat-row text-xs">
        <span class="label capitalize w-12">{{ key }}:</span>
        
        <!-- Reliability Bar -->
        <div class="flex-1 h-1.5 bg-white/10 rounded-full mx-2 mt-1 relative overflow-hidden">
          <div 
            class="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
            :style="{ width: (ch.reliability * 100) + '%', backgroundColor: ch.reliability > 0.5 ? '#4ade80' : '#f87171' }"
          ></div>
        </div>
        
        <span class="value w-8 text-right">{{ ch.reliability.toFixed(2) }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-row">
				<span class="label">Direction:</span>
				<span class="value" :style="{ color: instruction.breathSignal.value > 0.1 ? '#4ade80' : instruction.breathSignal.value < -0.1 ? '#60a5fa' : 'inherit' }">
          {{ instruction.breathSignal.value > 0.1 ? 'Inhaling' : instruction.breathSignal.value < -0.1 ? 'Exhaling' : 'Neutral' }}
        </span>
			</div>

			<div class="stat-row">
				<span class="label">Rate:</span>
				<span class="value">{{ instruction.respirationRate.value.toFixed(1) }} BPM</span>
			</div>

      <div class="stat-row">
        <span class="label">Count:</span>
        <span class="value">{{ instruction.breathsDetected.value }}</span>
      </div>

			<div class="stat-row">
				<span class="label">Signal:</span>
				<span class="value">{{ instruction.breathSignal.value.toFixed(2) }}</span>
			</div>

		</div>
	</div>
</template>

<script setup lang="ts">
import type { BreatheInstruction } from '../BreatheInstruction'
import ProgressBar from '../../components/ProgressBar.vue'

defineProps<{
	instruction: BreatheInstruction
}>()
</script>

<style scoped>
.breathe-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	position: relative;
	width: 100%;
}

.visualizer-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
}

.breath-circle {
	width: 200px;
	height: 200px;
	border-radius: 50%;
	transition: transform 0.1s linear, background-color 0.5s ease;
  will-change: transform;
}

.guide-text {
	margin-top: 40px;
	font-size: 1.2rem;
	letter-spacing: 0.2em;
	font-weight: 300;
	transition: opacity 0.3s ease;
  height: 1.5em; /* Prevent layout shift */
}

.debug-stats {
	position: absolute;
	top: 20px;
	right: 20px;
	font-family: monospace;
	font-size: 0.75rem;
	text-align: left;
  background: rgba(0,0,0,0.7);
  padding: 15px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  width: 240px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.debug-title {
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 8px;
}

.stat-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
  margin-top: 6px;
}

.label {
  color: rgba(255,255,255,0.6);
}

.value {
  color: #fff;
  font-weight: bold;
}

.stat-divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 10px 0;
}

/* Utility classes for colors (Tailwind approximations) */
.text-green-400 { color: #4ade80; }
.text-yellow-400 { color: #facc15; }
.text-red-400 { color: #f87171; }
</style>
