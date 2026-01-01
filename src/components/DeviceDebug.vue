<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { Camera } from '../../src-new/services/devices/camera/camera'
import { EyesRegion } from '../../src-new/services/devices/camera/regions/eyes'
import { HeadRegion } from '../../src-new/services/devices/camera/regions/head'
import { MouthRegion } from '../../src-new/services/devices/camera/regions/mouth'
import { BreathRegion } from '../../src-new/services/devices/camera/regions/breath'
import { Microphone } from '../../src-new/services/devices/microphone/microphone'
import { Accelerometer } from '../../src-new/services/devices/accelerometer/accelerometer'
import GAZEMotionTuner from './GAZEMotionTuner.vue'

// -- Configuration --
const width = 300
const height = 60
const padding = 2
const HISTORY_SIZE = 300 // 5 seconds @ 60fps

// -- Device Instances --
// Using shallowRef to avoid deep reactivity overhead on complex class instances
const camera = shallowRef<Camera | null>(null)
const microphone = shallowRef<Microphone | null>(null)
const accelerometer = shallowRef<Accelerometer | null>(null)

// Regions
const eyes = shallowRef<EyesRegion | null>(null)
const head = shallowRef<HeadRegion | null>(null)
const mouth = shallowRef<MouthRegion | null>(null)
const breath = shallowRef<BreathRegion | null>(null)

// -- State for Visualization --
// We sample these values every frame to build the history graph
const currentMetrics = ref({
	timestamp: 0,
	eyeOpenness: 0,
	mouthOpenness: 0,
	headPitch: 0,
	headYaw: 0,
	headRoll: 0,
	stability: 0,
	breathSignal: 0,
	breathRate: 0,
	blinkDetected: false,
	chinDist: 0,
	baselineChinDist: 0,
	tongueMetric: 0,
	accelFreq: 0,
	accelMag: 0
})

const history = ref<(typeof currentMetrics.value)[]>([])

// Additional Discrete State
const transcript = ref('')
const interimTranscript = ref('')
const isMicListening = ref(false)
const isCameraRunning = ref(false)
const isAccelConnected = ref(false)
const faceDetected = ref(false)

const accelState = ref({
    isMoving: false,
    isWorn: false,
    isSleeping: false,
    justImpacted: false
})

// Head Gesture State
const headState = ref({
  isNodding: false,
  isTiltingUp: false,
  isTiltingDown: false,
  isTurningLeft: false,
  isTurningRight: false,
  driftX: 0,
  driftY: 0,
  isStable: false
})

const eyeState = ref({
  isOpen: true,
  isDrooping: false
})

const mouthState = ref({
  isRelaxed: false,
  chinDist: 0,
  baselineChinDist: 0,
  isTongueOut: false
})

// Webcam Viz
const debugCanvas = ref<HTMLCanvasElement | null>(null)
const latestFace = shallowRef<any>(null)

// Raf Loop
let rafId: number | null = null

// -- Initialization --
onMounted(async () => {
  // 1. Setup Camera
  const cam = new Camera()
  camera.value = cam

  // Regions
  const rEyes = new EyesRegion(cam)
  const rHead = new HeadRegion(cam)
  const rMouth = new MouthRegion(cam)
  const rBreath = new BreathRegion(cam)

  eyes.value = rEyes
  head.value = rHead
  mouth.value = rMouth
  breath.value = rBreath

  cam.registerRegion(rEyes)
  cam.registerRegion(rHead)
  cam.registerRegion(rMouth)
  cam.registerRegion(rBreath)

  // Listeners
  rEyes.addEventListener('update', (e: any) => {
    currentMetrics.value.eyeOpenness = e.detail.open // Normalized
    currentMetrics.value.blinkDetected = e.detail.blink
    
    eyeState.value.isOpen = e.detail.isOpen
    // Define Droop as: Open but less than 60% open (and not blinking)
    eyeState.value.isDrooping = e.detail.isOpen && e.detail.open < 0.6 && !e.detail.blink
    
    faceDetected.value = true 
  })
  
  rHead.addEventListener('pose', (e: any) => {
    currentMetrics.value.headPitch = e.detail.pitch
    currentMetrics.value.headYaw = e.detail.yaw
    currentMetrics.value.headRoll = e.detail.roll
    latestFace.value = e.detail.face // Capture face data for rendering
  })

  rHead.addEventListener('stillness', (e: any) => {
    currentMetrics.value.stability = e.detail.score
    headState.value.driftX = e.detail.x
    headState.value.driftY = e.detail.y
    headState.value.isStable = e.detail.isStable
  })

  rHead.addEventListener('nod', (e: any) => {
    if (e.detail.type === 'YES') {
      headState.value.isNodding = true
      setTimeout(() => headState.value.isNodding = false, 200)
    }
  })

  rHead.addEventListener('tilt', (e: any) => {
    const dir = e.detail.direction
    if (dir === 'UP') {
      headState.value.isTiltingUp = true
      setTimeout(() => headState.value.isTiltingUp = false, 250)
    } else {
      headState.value.isTiltingDown = true
      setTimeout(() => headState.value.isTiltingDown = false, 250)
    }
  })

  rHead.addEventListener('turn', (e: any) => {
    const dir = e.detail.direction
    if (dir === 'LEFT') {
      headState.value.isTurningLeft = true
      setTimeout(() => headState.value.isTurningLeft = false, 250)
    } else {
      headState.value.isTurningRight = true
      setTimeout(() => headState.value.isTurningRight = false, 250)
    }
  })


	rMouth.addEventListener('update', (e: any) => {
		currentMetrics.value.mouthOpenness = e.detail.openness
		currentMetrics.value.chinDist = e.detail.chinDist
		currentMetrics.value.baselineChinDist = e.detail.baselineChinDist
		currentMetrics.value.tongueMetric = e.detail.tongueMetric
		
		mouthState.value.isRelaxed = e.detail.isOpen
		mouthState.value.chinDist = e.detail.chinDist
		mouthState.value.baselineChinDist = e.detail.baselineChinDist
	})

	rMouth.addEventListener('tongue', (e: any) => {
		if (e.detail.type === 'OUT') {
			mouthState.value.isTongueOut = true
			setTimeout(() => mouthState.value.isTongueOut = false, 250)
		}
	})

	rBreath.addEventListener('update', (e: any) => {
		currentMetrics.value.breathSignal = e.detail.uiSignal
		currentMetrics.value.breathRate = e.detail.rate
	})

	cam.addEventListener('start', () => (isCameraRunning.value = true))
	cam.addEventListener('stop', () => (isCameraRunning.value = false))

	// Start Camera
	try {
		await cam.start()
	} catch (e) {
		console.error('Failed to start camera', e)
	}

	// 2. Setup Microphone
	const mic = new Microphone()
	microphone.value = mic

	mic.addEventListener('start', () => (isMicListening.value = true))
	mic.addEventListener('stop', () => (isMicListening.value = false))
	mic.addEventListener('result', (e: any) => {
		const text = e.detail.text
		const isFinal = e.detail.isFinal

		if (isFinal) {
			transcript.value = text
			interimTranscript.value = '' // Clear interim when finalized
		} else {
			interimTranscript.value = text
		}
	})

	try {
		await mic.start()
	} catch (e) {
		console.error('Failed to start mic', e)
	}

	// 3. Start Sampling Loop
	loop()
})

const connectAccelerometer = async () => {
    console.log('Connect Accelerometer clicked')
    
    if (!('bluetooth' in navigator)) {
        alert('Web Bluetooth is not supported in this browser.')
        console.error('Web Bluetooth not supported')
        return
    }

	if (!accelerometer.value) {
		const acc = new Accelerometer()
		accelerometer.value = acc

		acc.addEventListener('data', (e: any) => {
			currentMetrics.value.accelFreq = e.detail.freq
			currentMetrics.value.accelMag = e.detail.mag
		})

        acc.addEventListener('move', () => {
            accelState.value.isMoving = true
            accelState.value.isWorn = false
            accelState.value.isSleeping = false
        })
        acc.addEventListener('worn', () => {
            accelState.value.isMoving = false
            accelState.value.isWorn = true
            accelState.value.isSleeping = false
        })
        acc.addEventListener('still', () => {
            accelState.value.isMoving = false
            accelState.value.isWorn = false
        })
        acc.addEventListener('sleep', () => {
            accelState.value.isMoving = false
            accelState.value.isWorn = false
            accelState.value.isSleeping = true
        })
        acc.addEventListener('wake', () => {
            accelState.value.isSleeping = false
        })
        acc.addEventListener('impact', () => {
            accelState.value.justImpacted = true
            setTimeout(() => accelState.value.justImpacted = false, 200)
        })

		acc.addEventListener('start', () => isAccelConnected.value = true)
		acc.addEventListener('stop', () => isAccelConnected.value = false)
	}

	try {
		await accelerometer.value.start()
	} catch (e) {
		console.error('Failed to connect accelerometer', e)
	}
}

onUnmounted(async () => {
	if (rafId) cancelAnimationFrame(rafId)

	if (camera.value) await camera.value.stop()
	if (microphone.value) await microphone.value.stop()
	if (accelerometer.value) await accelerometer.value.stop()
})

const drawLandmarks = (ctx: CanvasRenderingContext2D, face: any) => {
    // Helper to draw points
    const drawPoints = (indices: number[], color: string) => {
        ctx.fillStyle = color
        indices.forEach(idx => {
            const p = face.keypoints[idx]
            if (p) {
                // Video is 640x480, Canvas is 320x240. Scale 0.5.
                ctx.beginPath()
                ctx.arc(p.x * 0.5, p.y * 0.5, 2, 0, 2 * Math.PI)
                ctx.fill()
            }
        })
    }

    // Eyes (Orange) - Left: 33, 133, 159, 145; Right: 362, 263, 386, 374
    drawPoints([33, 133, 159, 145, 362, 263, 386, 374], '#fb923c') // Orange-400

    // Head (Indigo) - Nose: 1, Top: 10, Left: 234, Right: 454
    drawPoints([1, 10, 234, 454], '#818cf8') // Indigo-400

    // Mouth (Blue) - Top: 13, Bottom: 14, Left: 61, Right: 291
    drawPoints([13, 14, 61, 291], '#60a5fa') // Blue-400
    
    // Tongue (Pink) - Bottom Lip: 14 (overlap), Chin: 152
    drawPoints([152], '#f472b6') // Pink-400
}

const loop = () => {
	const now = Date.now()
	currentMetrics.value.timestamp = now

	// Push copy to history
	history.value.push({ ...currentMetrics.value })
	if (history.value.length > HISTORY_SIZE) {
		history.value.shift()
	}
    
    // Draw WebCam Frame
    if (debugCanvas.value && isCameraRunning.value) {
        const ctx = debugCanvas.value.getContext('2d')
        const videoEl = document.querySelector('video')
        if (ctx && videoEl) {
            ctx.save()
            // Mirror the context to match the CSS-mirrored video usually shown, 
            // but here we want to match the "Face Detected" logic which might be raw.
            // Actually the `x` coordinates from FaceMesh are already relative to the video source.
            // If the video source is raw (unmirrored), the points match.
            // We'll draw 1:1.
            ctx.drawImage(videoEl, 0, 0, 320, 240)
            
            if (latestFace.value) {
                drawLandmarks(ctx, latestFace.value)
            }
            ctx.restore()
        }
    }

	rafId = requestAnimationFrame(loop)
}

// -- Visualization Helpers --
const createPath = (key: string, max: number, min?: number) => {
	if (history.value.length < 2) return ''
	
	const pts = history.value.map((h, i) => {
		const x = (i / (HISTORY_SIZE - 1)) * width
		let val = (h as any)[key] as number
		
		let normalized = 0
		if (min !== undefined) {
			normalized = (val - min) / (max - min)
		} else {
			normalized = Math.max(0, Math.min(max, val)) / max
		}

		normalized = Math.max(0, Math.min(1, normalized))
		const y = height - (normalized * (height - 2 * padding) + padding)
		return `${x},${y}`
	})

	return `M ${pts.join(' L ')}`
}

const formatTime = (ms: number) => {
	const d = new Date(ms)
	return d.toISOString().substr(11, 8) // HH:MM:SS
}
</script>

<template>
	<div class="h-full overflow-y-auto bg-black text-zinc-300 font-mono p-8 flex flex-col gap-8">
		<!-- Header -->
		<div class="flex justify-between items-center border-b border-zinc-800 pb-4">
			<div>
				<h1 class="text-2xl font-bold text-white tracking-wider uppercase">
					Device Debug Suite
				</h1>
				<div class="flex gap-4 text-xs text-zinc-500 mt-1">
					<span :class="isCameraRunning ? 'text-green-500' : 'text-red-500'"
						>CAMERA: {{ isCameraRunning ? 'ONLINE' : 'OFFLINE' }}</span
					>
					<span :class="isMicListening ? 'text-green-500' : 'text-red-500'"
						>MIC: {{ isMicListening ? 'ONLINE' : 'OFFLINE' }}</span
					>
					<span :class="isAccelConnected ? 'text-green-500' : 'text-red-500'"
						>ACCEL: {{ isAccelConnected ? 'ONLINE' : 'OFFLINE' }}</span
					>
					<span :class="faceDetected ? 'text-cyan-500' : 'text-zinc-600'"
						>FACE: {{ faceDetected ? 'DETECTED' : 'SEARCHING...' }}</span
					>
				</div>
			</div>
			<div class="text-right">
				<div class="text-xl text-cyan-500">{{ formatTime(currentMetrics.timestamp) }}</div>
			</div>
		</div>

		    <!-- Main Grid -->

		    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

		

		      <!-- 0. Webcam Mesh Visualization -->

		      <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">

		        <div class="flex justify-between items-center">

		          <h2 class="text-sm uppercase font-bold text-zinc-400">Webcam Feed</h2>

		          <span class="text-xs text-zinc-600 font-mono">320x240</span>

		        </div>

		        <div class="relative w-full aspect-[4/3] bg-black rounded overflow-hidden border border-zinc-800/50">

		           <canvas ref="debugCanvas" width="320" height="240" class="w-full h-full object-cover"></canvas>

		        </div>

		        <div class="flex justify-between text-[10px] text-zinc-600">

		           <span><span class="text-orange-400">●</span> Eyes</span>

		           <span><span class="text-indigo-400">●</span> Head</span>

		           <span><span class="text-blue-400">●</span> Mouth</span>

		        </div>

		      </div>

		

		      <!-- 1. Breath Module -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-purple-400">Respiration</h2>
					<span class="text-xs text-zinc-500"
						>Rate: {{ currentMetrics.breathRate }} BPM</span
					>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Signal Range -1.5 to 1.5 -->
						<path
							:d="createPath('breathSignal', 1.5)"
							fill="none"
							stroke="#a855f7"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div class="text-[10px] text-zinc-600">
					Source: BreathRegion (fused pitch/lift/scale)
				</div>
			</div>

			<!-- 2. Eyes Module -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-orange-400">Eyes</h2>
					<div class="flex gap-2">
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								eyeState.isOpen
									? 'bg-green-500 text-black'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							OPEN
						</span>
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								!eyeState.isOpen
									? 'bg-red-500 text-white'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							CLOSED
						</span>
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								eyeState.isDrooping
									? 'bg-orange-500 text-white'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							DROOP
						</span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Normalized 0-1 -->
						<path
							:d="createPath('eyeOpenness', 1)"
							fill="none"
							stroke="#fdba74"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div class="flex justify-between text-[10px] text-zinc-600">
					<span
						>{{ currentMetrics.eyeOpenness.toFixed(2) }} ({{
							currentMetrics.blinkDetected ? 'BLINK' : '---'
						}})</span
					>
					<span>Source: EyesRegion</span>
				</div>
			</div>

			<!-- 3. Head Pitch (Nod) -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-indigo-400">Head Pitch (Nod)</h2>
					<div class="flex gap-2">
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							  :class="headState.isTiltingUp ? 'bg-blue-400 text-white' : 'bg-zinc-800 text-zinc-600'">
							UP
						</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							  :class="headState.isTiltingDown ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-600'">
							DROP
						</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							  :class="headState.isNodding ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-600'">
							NOD
						</span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full" preserveAspectRatio="none">
						<!-- Pitch Range +/- 0.85 rad (~48 deg) -->
						<path :d="createPath('headPitch', 0.85)" fill="none" stroke="#818cf8" stroke-width="1.5" vector-effect="non-scaling-stroke" />
					</svg>
				</div>
				<div class="flex justify-between text-[10px] text-zinc-600">
					<span>{{ (currentMetrics.headPitch * 57.29).toFixed(1) }}°</span>
					<span>Source: HeadRegion</span>
				</div>
			</div>

			<!-- 4. Head Yaw (Turn) -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-indigo-400">Head Yaw (Turn)</h2>
					<div class="flex gap-2">
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							  :class="headState.isTurningLeft ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-600'">
							LEFT
						</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							  :class="headState.isTurningRight ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-600'">
							RIGHT
						</span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Yaw Range +/- 0.8 rad -->
						<path
							:d="createPath('headYaw', 0.8)"
							fill="none"
							stroke="#6366f1"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div class="flex justify-between text-[10px] text-zinc-600">
					<span>{{ (currentMetrics.headYaw * 57.29).toFixed(1) }}°</span>
					<span>Source: HeadRegion</span>
				</div>
			</div>

			<!-- 4b. Head Position (Drift) -->
			<div
				class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden"
			>
				<div class="flex justify-between items-center z-10">
					<h2 class="text-sm uppercase font-bold text-teal-400">Head Position</h2>
				</div>

				<!-- Target Viz -->
				<div class="relative w-full h-[120px] flex items-center justify-center">
					<!-- Outer Ring -->
					<div class="w-24 h-24 border-2 border-zinc-700 rounded-full absolute"></div>
					<!-- Center Crosshair -->
					<div class="w-full h-[1px] bg-zinc-800/50 absolute"></div>
					<div class="h-full w-[1px] bg-zinc-800/50 absolute"></div>

					<!-- Dot -->

					<div
						class="w-3 h-3 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50 transition-transform duration-[500ms] ease-out will-change-transform z-20"
						:style="{
							transform: `translate(${-headState.driftX * 800}px, ${
								headState.driftY * 800
							}px)`
						}"
					></div>
				</div>
				<div class="text-[10px] text-zinc-600 text-center">Keep dot in ring</div>
			</div>

			<!-- 4c. Head Stability (Velocity) -->
			<div
				class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 relative"
			>
				<div class="flex justify-between items-center z-10">
					<h2 class="text-sm uppercase font-bold text-emerald-400">Stability</h2>
					<div class="flex gap-2">
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								headState.isStable
									? 'bg-emerald-500 text-black'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							STABLE
						</span>
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								!headState.isStable
									? 'bg-zinc-600 text-zinc-300'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							UNSTABLE
						</span>
					</div>
				</div>

				<div
					class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50 z-10"
				>
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Stability 0-1 -->
						<path
							:d="createPath('stability', 1)"
							fill="none"
							stroke="#34d399"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div class="text-[10px] text-zinc-600">
					Based on Head Velocity ({{ (currentMetrics.stability * 100).toFixed(0) }}%)
				</div>
			</div>

			<!-- 5. Mouth -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-blue-400">Mouth</h2>
					<div class="flex gap-2">
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								mouthState.isRelaxed
									? 'bg-blue-500 text-white'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							RELAXED
						</span>
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="
								!mouthState.isRelaxed
									? 'bg-zinc-600 text-zinc-300'
									: 'bg-zinc-800 text-zinc-600'
							"
						>
							TENSE
						</span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Mouth Openness 0-0.6 -->
						<path
							:d="createPath('mouthOpenness', 0.6)"
							fill="none"
							stroke="#93c5fd"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div class="text-[10px] text-zinc-600">Source: MouthRegion</div>
			</div>

			<!-- 6. Tongue (Experimental) -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-pink-400">Tongue (Exp)</h2>
					<div class="flex gap-2">
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
							:class="mouthState.isTongueOut ? 'bg-pink-500 text-white shadow-[0_0_8px_rgba(244,114,182,0.6)]' : 'bg-zinc-800 text-zinc-600'"
						>
							TONGUE OUT
						</span>
						<span class="text-xs text-zinc-500 font-mono">Ratio: {{ currentMetrics.tongueMetric.toFixed(2) }}</span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Tongue Metric Range 0.5 to 1.5. Center at 1.0 -->
						<path
							:d="createPath('tongueMetric', 1.5, 0.5)"
							fill="none"
							stroke="#f472b6"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
						<!-- Center Line (Baseline 1.0) -->
						<line x1="0" :y1="height/2" :x2="width" :y2="height/2" stroke="white" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.2" />
					</svg>
				</div>
				<div class="flex justify-between text-[10px] text-zinc-600">
					<span>Dist: {{ mouthState.chinDist.toFixed(1) }}</span>
					<span>Base: {{ mouthState.baselineChinDist.toFixed(1) }}</span>
				</div>
			</div>

			<!-- 7. Accelerometer -->
			<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-sm uppercase font-bold text-yellow-400">Smart Sensor</h2>
					<button
						v-if="!isAccelConnected"
						@click="connectAccelerometer"
						class="text-[10px] px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
					>
						CONNECT
					</button>
					<div v-else class="flex gap-2">
						<span
							class="text-[10px] px-1.5 py-0.5 rounded font-bold bg-zinc-800 text-zinc-400"
						>
							CONNECTED
						</span>
                        <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
                            :class="accelState.isMoving ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-600'"
                        >
                            MOVING
                        </span>
                        <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
                            :class="accelState.isWorn ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-600'"
                        >
                            WORN
                        </span>
                        <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
                            :class="accelState.isSleeping ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-600'"
                        >
                            SLEEPING
                        </span>
                         <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
                            :class="(!accelState.isMoving && !accelState.isWorn && !accelState.isSleeping) ? 'bg-zinc-600 text-zinc-300' : 'bg-zinc-800 text-zinc-600'"
                        >
                            STOPPED
                        </span>
                        <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors"
                            :class="accelState.justImpacted ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-zinc-800 text-zinc-600'"
                        >
                            IMPACT
                        </span>
					</div>
				</div>
				<div class="relative h-[60px] w-full bg-black/50 rounded border border-zinc-800/50">
					<svg
						:viewBox="`0 0 ${width} ${height}`"
						class="w-full h-full"
						preserveAspectRatio="none"
					>
						<!-- Freq Range 0-15 Hz (Cyan) -->
						<path
							:d="createPath('accelFreq', 15, 0)"
							fill="none"
							stroke="#22d3ee"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
							opacity="0.9"
						/>
						<!-- Magnitude Range 0-80.0 G (Yellow) -->
						<path
							:d="createPath('accelMag', 80, 0)"
							fill="none"
							stroke="#facc15"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
							opacity="0.9"
						/>
					</svg>
				</div>
				<div class="flex justify-between text-[10px] text-zinc-600 font-mono">
					<span class="text-cyan-400">Freq: {{ currentMetrics.accelFreq.toFixed(1) }}Hz</span>
					<span class="text-yellow-400">Mag: {{ currentMetrics.accelMag.toFixed(2) }}G</span>
				</div>
			</div>

            <!-- 8. Motion Tuner -->
            <div class="col-span-1 md:col-span-2 lg:col-span-2">
                <GAZEMotionTuner :accelerometer="accelerometer" />
            </div>
		</div>

		<!-- Microphone Section -->
		<div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
			<div class="flex justify-between items-center">
				<h2 class="text-sm uppercase font-bold text-green-400">Speech Recognition</h2>
				<div
					class="w-2 h-2 rounded-full"
					:class="isMicListening ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'"
				></div>
			</div>

			<div class="grid grid-cols-1 gap-3">
				<!-- Final Transcript -->
				<div class="p-3 bg-black/50 rounded border border-zinc-800/50">
					<div class="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-bold">
						Finalized Result
					</div>
					<div class="text-sm text-zinc-200 min-h-[1.5em] font-sans">
						{{ transcript || '---' }}
					</div>
				</div>

				<!-- Interim Transcript -->
				<div class="p-3 bg-black/30 rounded border border-zinc-800/30 border-dashed">
					<div class="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-bold">
						Interim Stream
					</div>
					<div class="text-sm text-zinc-500 italic min-h-[1.5em] font-sans">
						{{ interimTranscript || 'Listening...' }}
					</div>
				</div>
			</div>

			<div class="text-[10px] text-zinc-600">
				Source: Microphone Device (SpeechRecognition)
			</div>
		</div>

		<div class="text-center text-[10px] text-zinc-700 mt-auto">
			NCRS Device Debug v1.0 • src-new architecture
		</div>
	</div>
</template>
