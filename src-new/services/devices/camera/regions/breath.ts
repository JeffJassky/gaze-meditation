import { CameraRegion } from '../region'
import type { Face } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'

// --- HELPER: Rolling Statistics ---
class RollingStats {
	private buffer: number[] = []
	private sum = 0
	private sumSq = 0

	constructor(private windowSize: number) {}

	push(val: number) {
		this.buffer.push(val)
		this.sum += val
		this.sumSq += val * val

		if (this.buffer.length > this.windowSize) {
			const removed = this.buffer.shift()!
			this.sum -= removed
			this.sumSq -= removed * removed
		}
	}

	get mean() {
		return this.buffer.length === 0 ? 0 : this.sum / this.buffer.length
	}

	get stdDev() {
		if (this.buffer.length < 2) return 0
		const variance = (this.sumSq / this.buffer.length) - (this.mean * this.mean)
		return Math.sqrt(Math.max(0, variance))
	}
	
	// Z-Score: How many StdDevs away from the mean is this value?
	getZScore(val: number): number {
		const sd = this.stdDev
		if (sd < 0.0001) return 0
		return (val - this.mean) / sd
	}
	
	reset() {
		this.buffer = []
		this.sum = 0
		this.sumSq = 0
	}
}

// --- CLASS: Channel Supervisor ---
class ChannelSupervisor {
	private stats: RollingStats
	private recentTrend: RollingStats
	
	public reliability = 0 // 0.0 to 1.0
	public zValue = 0 // Standardized Output
	
	constructor(public name: string, private polarity: number = -1, historySize: number) {
		this.stats = new RollingStats(historySize)
		this.recentTrend = new RollingStats(30) // Short term (0.5s @ 60fps)
	}

	update(rawValue: number) {
		// 1. Ingest Data
		this.stats.push(rawValue)
		this.recentTrend.push(rawValue)

		// 2. Calculate Z-Score (The Signal)
		this.zValue = this.stats.getZScore(rawValue) * this.polarity

		// 3. Analyze Quality
		this.calculateReliability()
	}

	private calculateReliability() {
		// Factor A: Signal Power
		const signalPower = this.stats.stdDev
		
		let deadThreshold = 0.002
		if (this.name === 'Scale') deadThreshold = 0.5 // 0.5 pixel movement

		if (signalPower < deadThreshold) { 
			this.reliability = Math.max(0, this.reliability - 0.05)
			return
		}

		// Factor B: Signal Cleanliness (SNR)
		const shortTermNoise = this.recentTrend.stdDev
		const longTermSignal = this.stats.stdDev
		
		const noiseRatio = shortTermNoise / (longTermSignal + 0.0001)

		if (noiseRatio > 0.6) {
			this.reliability = Math.max(0, this.reliability - 0.05)
		} else {
			this.reliability = Math.min(1, this.reliability + 0.05)
		}
	}
	
	reset() {
		this.stats.reset()
		this.recentTrend.reset()
		this.reliability = 0
		this.zValue = 0
	}
}

export class BreathRegion extends CameraRegion {
	// Constants
	private readonly HISTORY_SIZE = 300 // 5 seconds @ 60fps
	private readonly MIN_BREATH_PERIOD = 1500 // 40 BPM
	private readonly MAX_BREATH_PERIOD = 10000 // 6 BPM

	// State
	public state: 'CALIBRATING' | 'LOCKED' | 'DISTURBED' = 'CALIBRATING'
	public fusedSignal = 0
	public confidence = 0
	public activeAxis = 'None'
	public respirationRate = 0
	public breathDepth = 0
	public crossingState: 'INHALE' | 'EXHALE' = 'EXHALE'

	// Supervisors
	private channels: {
		pitch: ChannelSupervisor
		lift: ChannelSupervisor
		scale: ChannelSupervisor
	}

	// Logic State
	private lastValue = 0
	private lastCrossingTime = 0
	private periods: number[] = []

	constructor(camera: Camera) {
		super(camera, 'breath', 'Breath')
		this.channels = {
			pitch: new ChannelSupervisor('Pitch', -1, this.HISTORY_SIZE),
			lift: new ChannelSupervisor('Lift', -1, this.HISTORY_SIZE),
			scale: new ChannelSupervisor('Scale', -1, this.HISTORY_SIZE)
		}
	}

	update(face: Face, timestamp: number) {
		const keypoints = face.keypoints
		const nose = keypoints[1]
		const midEye = keypoints[168]
		const leftOuter = keypoints[33]
		const rightOuter = keypoints[263]

		if (!nose || !midEye || !leftOuter || !rightOuter) return

		// Calculate Metrics needed for Breath Analysis
		const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
		if (iod === 0) return

		const headPitch = (nose.y - midEye.y) / iod
		
		// Mouth Openness Calculation (Veto check)
		const upper = keypoints[13]
		const lower = keypoints[14]
		const left = keypoints[61]
		const right = keypoints[291]
		let mouthOpenness = 0
		if (upper && lower && left && right) {
			const v = Math.hypot(upper.x - lower.x, upper.y - lower.y)
			const h = Math.hypot(left.x - right.x, left.y - right.y)
			if (h > 0) mouthOpenness = v / h
		}

		// Run Logic
		this.processFrame({
			headPitch: headPitch,
			headY: nose.y / this.camera.videoHeight,
			faceScale: iod,
			mouthOpenness: mouthOpenness
		}, timestamp)

		// Emit Update Event
		const uiSignal = Math.max(-1.5, Math.min(1.5, this.fusedSignal / 1.5))
		
		this.dispatchEvent(new CustomEvent('update', {
			detail: {
				signal: this.fusedSignal,
				uiSignal: uiSignal, // Smoothed/Clamped for Visualization
				depth: this.breathDepth,
				rate: this.respirationRate,
				state: this.state,
				confidence: this.confidence,
				activeAxis: this.activeAxis,
				face: face
			}
		}))
	}

	private processFrame(faceData: any, now: number) {
		// 1. Feed Supervisors
		this.channels.pitch.update(faceData.headPitch)
		this.channels.lift.update(faceData.headY)
		this.channels.scale.update(faceData.faceScale)

		// 2. Global Veto (Mouth Openness)
		if (faceData.mouthOpenness > 0.15) {
			 const oldState = this.state
			 this.state = 'DISTURBED'
			 this.confidence = 0
			 this.fusedSignal = this.lerp(this.fusedSignal, 0, 0.1)
			 
			 if (oldState !== 'DISTURBED') {
				 this.dispatchEvent(new CustomEvent('disturbed'))
			 }
			 return
		}

		// 3. Consensus Engine
		let numerator = 0
		let denominator = 0
		let maxRel = 0
		let winner = 'None'

		Object.values(this.channels).forEach(ch => {
			if (ch.reliability > 0.3) {
				const w = Math.pow(ch.reliability, 2)
				numerator += ch.zValue * w
				denominator += w
				
				if (ch.reliability > maxRel) {
					maxRel = ch.reliability
					winner = ch.name
				}
			}
		})

		this.activeAxis = winner

		// 4. State Transitions
		if (maxRel < 0.3) {
			this.state = 'CALIBRATING'
			this.confidence = 0
			this.fusedSignal = this.lerp(this.fusedSignal, 0, 0.05)
		} else {
			this.state = 'LOCKED'
			this.confidence = maxRel
		}

		// 5. Signal Fusion & Slew Limiting
		const rawMix = denominator > 0 ? numerator / denominator : 0
		
		const delta = rawMix - this.lastValue
		let clampedMix = rawMix
		
		if (Math.abs(delta) > 0.5) {
			 clampedMix = this.lastValue + (Math.sign(delta) * 0.5)
		}

		this.fusedSignal = this.lerp(this.fusedSignal, clampedMix, 0.1)
		this.lastValue = this.fusedSignal
		
		// 6. Metrics Calculation
		this.calculateMetrics(this.fusedSignal, now)
	}
	
	private calculateMetrics(signal: number, now: number) {
		// Depth (0-1 approx, smoothed)
		const depth = Math.min(1, Math.abs(signal))
		this.breathDepth = this.breathDepth * 0.95 + depth * 0.05
		
		// Rate Detection (Schmitt Trigger)
		if (this.state !== 'LOCKED') return

		// Compress Z-Score for reliable triggering
		const uiSignal = Math.max(-1.5, Math.min(1.5, signal / 1.5))
		
		const UPPER_THRESH = 0.2
		const LOWER_THRESH = -0.2
		
		if (this.crossingState === 'EXHALE' && uiSignal > UPPER_THRESH) {
			this.crossingState = 'INHALE'
			this.onBreathDetected(now)
			this.dispatchEvent(new CustomEvent('inhale', { detail: { timestamp: now } }))
		} else if (this.crossingState === 'INHALE' && uiSignal < LOWER_THRESH) {
			this.crossingState = 'EXHALE'
			this.dispatchEvent(new CustomEvent('exhale', { detail: { timestamp: now } }))
		}
	}

	private onBreathDetected(now: number) {
		if (this.lastCrossingTime === 0) {
			this.lastCrossingTime = now
			return
		}

		const period = now - this.lastCrossingTime
		this.lastCrossingTime = now

		if (period >= this.MIN_BREATH_PERIOD && period <= this.MAX_BREATH_PERIOD) {
			this.periods.push(period)
			if (this.periods.length > 5) this.periods.shift()
			
			const avgPeriod = this.periods.reduce((a, b) => a + b, 0) / this.periods.length
			this.respirationRate = Math.round(60000 / avgPeriod)
			
			this.dispatchEvent(new CustomEvent('ratechange', { detail: { rate: this.respirationRate } }))
		}
	}

	private lerp(a: number, b: number, t: number) {
		return a + (b - a) * t
	}
	
	public reset() {
		this.state = 'CALIBRATING'
		this.fusedSignal = 0
		this.confidence = 0
		this.respirationRate = 0
		this.breathDepth = 0
		this.lastValue = 0
		this.periods = []
		this.crossingState = 'EXHALE'
		this.lastCrossingTime = 0
		
		Object.values(this.channels).forEach(c => c.reset())
	}
}
