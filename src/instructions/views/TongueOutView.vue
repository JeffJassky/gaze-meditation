<template>
	<div
		class="tongue-out-view"
		:style="{ color: instruction.resolvedTheme.textColor }"
	>
		<h1 class="prompt fade-in">{{ instruction.options.prompt || 'Stick your tongue out' }}</h1>

		<!-- Status Indicator -->
		<div
			class="status-icon"
			:style="{ opacity: instruction.isTongueDetected.value ? 1 : 0.2 }"
		>
			👅
		</div>

		<!-- Progress -->
		<div
			class="progress-track"
			:style="{ backgroundColor: instruction.resolvedTheme.secondaryTextColor + '33' }"
		>
			<div
				class="progress-fill"
				:style="{
					width: instruction.progress.value + '%',
					backgroundColor: instruction.resolvedTheme.accentColor
				}"
			></div>
		</div>

		<!-- Debug Info -->
		<div class="debug-info">
			<p>Tongue Score: {{ instruction.tongueScore.value.toFixed(2) }}</p>

			<!-- Mask Preview -->
			<div class="mask-preview">
				<p>Direct Debug Feed</p>
				<canvas
					ref="debugCanvasRef"
					width="256"
					height="256"
				></canvas>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TongueOutInstruction } from '../TongueOutInstruction'
import { faceMeshService } from '../../services/faceMeshService'

const props = defineProps<{
	instruction: TongueOutInstruction
}>()

const debugCanvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

const updatePreview = () => {
	const sourceCanvas = faceMeshService.getDebugCanvas()
	if (debugCanvasRef.value && sourceCanvas) {
		const ctx = debugCanvasRef.value.getContext('2d')
		if (ctx) {
			ctx.clearRect(0, 0, 256, 256)
			ctx.drawImage(sourceCanvas, 0, 0)
		}
	}
	rafId = requestAnimationFrame(updatePreview)
}

onMounted(() => {
	updatePreview()
})

onUnmounted(() => {
	if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.tongue-out-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
	text-align: center;
}

.prompt {
	font-size: 2.5rem;
	font-weight: 300;
	margin-bottom: 0;
}

.status-icon {
	font-size: 5rem;
	margin-bottom: 2rem;
	transition: opacity 0.2s;
}

.progress-track {
	width: 300px;
	height: 8px;
	border-radius: 4px;
	overflow: hidden;
	margin-bottom: 2rem;
}

.progress-fill {
	height: 100%;
	transition: width 0.1s linear;
}

.debug-info {
	font-size: 0.8rem;
	opacity: 1;
	margin-top: 2rem;
	max-width: 400px;
}

.mask-preview {
	margin-top: 1rem;
	padding: 0.5rem;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
}

.mask-preview canvas {
	width: 128px;
	height: 128px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	margin-top: 0.5rem;
}
</style>
