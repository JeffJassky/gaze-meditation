<template>
	<div
		class="stillness-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<div
			class="status-indicator"
			:class="{ error: instruction.status.value === 'FAILED' }"
			:style="{ '--negative-color': instruction.resolvedTheme.negativeColor }"
		>
			<h2 v-if="instruction.status.value === 'HOLDING'">
				{{ instruction.options.prompt }}
			</h2>
			<h2 v-else-if="instruction.status.value === 'FAILED'">
				{{ instruction.options.mistakeMessage || 'MOVEMENT DETECTED' }}
			</h2>
			<h2 v-else-if="instruction.status.value === 'SUCCESS'">PERFECT</h2>
		</div>

		<div
			class="visualizer"
			v-if="instruction.status.value === 'HOLDING'"
		>
			<!-- A target ring -->
			<div
				class="target-ring"
				:style="targetRingStyle"
			></div>
			<!-- The user's head position -->
			<div
				class="cursor"
				:style="cursorStyle"
			></div>
		</div>

		<div
			class="progress-bar"
			v-if="instruction.status.value !== 'WAITING'"
		>
			<div
				class="fill"
				:style="{
					width: instruction.progress.value + '%',
					backgroundColor: instruction.resolvedTheme.positiveColor
				}"
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
const BORDER_WIDTH = 10

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

const targetRingStyle = computed(() => {
	return {
		width: `${OUTER_SIZE}px`,
		height: `${OUTER_SIZE}px`,
		borderWidth: `${BORDER_WIDTH}px`,
		borderColor: indicatorColor.value
	}
})

const cursorStyle = computed(() => {
	const boundaryDiameter = OUTER_SIZE - BORDER_WIDTH * 2
	const discDiameter = boundaryDiameter * DISC_RATIO

	// The distance the disc can travel from center before touching the boundary
	const maxTravel = (boundaryDiameter - discDiameter) / 2

	// Scale factor to map tolerance to maxTravel
	// when drift == tolerance, visualOffset should be maxTravel
	const pixelsPerUnit = maxTravel / props.instruction.tolerance

	const x = props.instruction.driftX.value * pixelsPerUnit
	const y = props.instruction.driftY.value * pixelsPerUnit

	return {
		width: `${discDiameter}px`,
		height: `${discDiameter}px`,
		transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
		opacity: 0.8,
		backgroundColor: indicatorColor.value
	}
})
</script>

<style scoped>
.stillness-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	position: relative;
	/* color property is now set via inline style from resolvedTheme */
}

.status-indicator {
	position: relative;
	z-index: 10;
}

.status-indicator h2 {
	font-size: 3rem;
	letter-spacing: 0.2em;
	text-transform: uppercase;
}

.status-indicator.error {
	color: var(--negative-color); /* Use CSS variable for theming */
	animation: shake 0.5s;
}

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

.target-ring {
	position: absolute;
	/* width/height set via inline style */
	/* border-width set via inline style */
	border-style: solid;
	border-color: rgba(255, 255, 255, 0.5);
	background-color: rgba(255, 255, 255, 0.05); /* Slight background for safe zone */
	border-radius: 50%;
	box-sizing: border-box;
	transition: border-color 0.2s ease-out;
}

.cursor {
	position: absolute;
	top: 50%;
	left: 50%;
	/* width/height/transform set via inline style */
	/* background-color is now set via inline style from resolvedTheme */
	border-radius: 50%;
	transition: transform 0.2s ease-out, background-color 0.2s ease-out;
}

.progress-bar {
	width: 80%;
	height: 10px;
	background: #333;
	border-radius: 5px;
	overflow: hidden;
	position: absolute;
	bottom: 50px;
	z-index: 10;
}

.fill {
	height: 100%;
	/* background-color is now set via inline style from resolvedTheme */
	transition: width 0.1s linear;
}

@keyframes shake {
	0%,
	100% {
		transform: translateX(0);
	}
	25% {
		transform: translateX(-10px);
	}
	75% {
		transform: translateX(10px);
	}
}
</style>
