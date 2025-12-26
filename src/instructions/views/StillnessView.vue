<template>
	<div class="instruction-view stillness-view">
		<!-- Status Text replacing the old status-indicator h2s -->
		<div
			v-if="instruction.status.value === 'HOLDING' || instruction.status.value === 'WAITING'"
			class="prompt-text leading-relaxed"
			:style="{ color: instruction.resolvedTheme.textColor }"
		>
			<span
				v-for="(segment, index) in instruction.options.prompt.split('~')"
				:key="index"
				class="inline-block"
				>{{ segment.trim() }}&nbsp;</span
			>
		</div>
		<div
			v-else-if="instruction.status.value === 'FAILED'"
			class="prompt-text leading-relaxed"
			:style="{ color: instruction.resolvedTheme.negativeColor || 'red' }"
		>
			{{ instruction.options.mistakeMessage || 'Movement detected.' }}
		</div>
		<div
			v-else-if="instruction.status.value === 'SUCCESS'"
			class="prompt-text leading-relaxed"
			:style="{ color: instruction.resolvedTheme.positiveColor || 'green' }"
		>
			Perfect
		</div>

		<!-- Visualizer -->
		<div class="visualizer">
			<!-- Circular Progress Ring -->
			<svg
				:width="OUTER_SIZE"
				:height="OUTER_SIZE"
				class="progress-ring"
			>
				<!-- The actual progress ring -->
				<circle
					class="progress-ring-fill"
					:cx="OUTER_SIZE / 2"
					:cy="OUTER_SIZE / 2"
					:r="radius"
					:stroke-width="BORDER_WIDTH"
					:stroke="indicatorColor"
					fill="none"
					stroke-linecap="round"
					:stroke-dasharray="circumference"
					:stroke-dashoffset="dashOffset"
					:transform="`rotate(-90 ${OUTER_SIZE / 2} ${OUTER_SIZE / 2})`"
					:style="{ filter: `drop-shadow(0 0 8px ${indicatorColor})` }"
				/>
			</svg>
			<!-- The user's head position -->
			<div
				class="cursor"
				v-if="instruction.status.value !== 'SUCCESS'"
				:style="cursorStyle"
			></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StillnessInstruction } from '../StillnessInstruction'

const props = defineProps<{
	instruction: StillnessInstruction
}>()

const OUTER_SIZE = 300
const DISC_RATIO = 0.9
const BORDER_WIDTH = 8

const radius = (OUTER_SIZE - BORDER_WIDTH) / 2
const circumference = 2 * Math.PI * radius

const dashOffset = computed(() => {
	return circumference * (1 - props.instruction.progress.value / 100)
})

function hexToRgb(hex: string) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
	hex = hex.replace(shorthandRegex, (m, r, g, b) => {
		return r + r + g + g + b + b
	})

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
		  }
		: { r: 0, g: 0, b: 0 }
}

function interpolateColor(color1: string, color2: string, factor: number) {
	const c1 = hexToRgb(color1)
	const c2 = hexToRgb(color2)

	const r = Math.round(c1.r + factor * (c2.r - c1.r))
	const g = Math.round(c1.g + factor * (c2.g - c1.g))
	const b = Math.round(c1.b + factor * (c2.b - c1.b))

	return `rgb(${r}, ${g}, ${b})`
}

const indicatorColor = computed(() => {
	const startColor = props.instruction.resolvedTheme.positiveColor || '#ffffff'
	const endColor = props.instruction.resolvedTheme.negativeColor || '#ff0000'
	// Clamp factor between 0 and 1
	const factor = Math.min(
		1,
		Math.max(0, props.instruction.drift.value / props.instruction.tolerance)
	)

	return interpolateColor(startColor, endColor, factor)
})

const cursorStyle = computed(() => {
	const boundaryDiameter = OUTER_SIZE - BORDER_WIDTH * 2
	const discDiameter = boundaryDiameter * DISC_RATIO

	// The distance the disc can travel from center before touching the boundary
	const maxTravel = (boundaryDiameter - discDiameter) / 2

	// Scale factor to map tolerance to maxTravel
	// when drift == tolerance, visualOffset should be maxTravel
	const pixelsPerUnit = maxTravel / props.instruction.tolerance

	// Combine rotation drift (driftX/Y) and position drift (driftXPos/YPos)
	// Apply the same weighting (1.5) as in the logic
	const x =
		(props.instruction.driftX.value + (props.instruction.driftXPos.value || 0) * 1.5) *
		pixelsPerUnit
	const y =
		(props.instruction.driftY.value + (props.instruction.driftYPos.value || 0) * 1.5) *
		pixelsPerUnit

	return {
		width: `${discDiameter}px`,
		height: `${discDiameter}px`,
		transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
		opacity: 0.8,
		backgroundColor: indicatorColor.value,
		filter: `drop-shadow(0 0 8px ${indicatorColor.value})`
	}
})
</script>

<style scoped>
/* Adapted from ReadView.vue */
.instruction-view {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	text-align: center;
	padding: 2rem;
	position: relative;
}

.prompt-text {
	font-size: clamp(1rem, 3vw, 2.5rem);
	z-index: 10; /* Ensure text is above other elements if needed */
}

/* Original StillnessView styles preserved below */

.visualizer {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 0; /* Let children define size or use 0 to center purely */
	height: 0;
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.progress-ring {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	overflow: visible;
}

.progress-ring-fill {
	transition: stroke-dashoffset calc(0.5s / var(--speed-factor, 1)) linear,
		stroke calc(0.5s / var(--speed-factor, 1)) ease-in-out;
}

.cursor {
	position: absolute;
	top: 50%;
	left: 50%;
	border-radius: 50%;
	transition: transform calc(0.5s / var(--speed-factor, 1)) ease-out,
		background-color calc(0.2s / var(--speed-factor, 1)) ease-out;
}
</style>
