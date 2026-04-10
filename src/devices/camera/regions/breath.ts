import { CameraRegion } from '../region'
import type { Face } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'
import { lerp } from './math'
import {
	BREATH_HISTORY_SIZE,
	BREATH_MIN_PERIOD_MS,
	BREATH_MAX_PERIOD_MS,
	BREATH_MOUTH_VETO_THRESHOLD,
	BREATH_CHANNEL_MIN_RELIABILITY,
	BREATH_SHORT_WINDOW,
	BREATH_DEAD_THRESHOLD,
	BREATH_SCALE_DEAD_THRESHOLD,
	BREATH_NOISE_RATIO_THRESHOLD,
	BREATH_RELIABILITY_STEP,
	BREATH_SLEW_LIMIT,
	BREATH_SIGNAL_SMOOTH_ALPHA,
	BREATH_DECAY_ALPHA,
	BREATH_DEPTH_SMOOTH_ALPHA,
	BREATH_SCHMITT_UPPER,
	BREATH_SCHMITT_LOWER,
	BREATH_RATE_WINDOW,
} from './constants'

// ---------------------------------------------------------------------------
// Helper: Rolling Statistics
// ---------------------------------------------------------------------------

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
		const variance = this.sumSq / this.buffer.length - this.mean * this.mean
		return Math.sqrt(Math.max(0, variance))
	}

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

// ---------------------------------------------------------------------------
// Helper: Channel Supervisor — per-axis reliability scoring
// ---------------------------------------------------------------------------

class ChannelSupervisor {
	private stats: RollingStats
	private recentTrend: RollingStats

	public reliability = 0
	public zValue = 0

	constructor(
		public name: string,
		private polarity: number = -1,
		historySize: number,
	) {
		this.stats = new RollingStats(historySize)
		this.recentTrend = new RollingStats(BREATH_SHORT_WINDOW)
	}

	update(rawValue: number) {
		this.stats.push(rawValue)
		this.recentTrend.push(rawValue)
		this.zValue = this.stats.getZScore(rawValue) * this.polarity
		this.updateReliability()
	}

	private updateReliability() {
		const signalPower = this.stats.stdDev
		const deadThreshold =
			this.name === 'Scale' ? BREATH_SCALE_DEAD_THRESHOLD : BREATH_DEAD_THRESHOLD

		if (signalPower < deadThreshold) {
			this.reliability = Math.max(0, this.reliability - BREATH_RELIABILITY_STEP)
			return
		}

		const noiseRatio = this.recentTrend.stdDev / (this.stats.stdDev + 0.0001)
		if (noiseRatio > BREATH_NOISE_RATIO_THRESHOLD) {
			this.reliability = Math.max(0, this.reliability - BREATH_RELIABILITY_STEP)
		} else {
			this.reliability = Math.min(1, this.reliability + BREATH_RELIABILITY_STEP)
		}
	}

	reset() {
		this.stats.reset()
		this.recentTrend.reset()
		this.reliability = 0
		this.zValue = 0
	}
}

// ---------------------------------------------------------------------------
// BreathRegion
// ---------------------------------------------------------------------------

export class BreathRegion extends CameraRegion {
	// Public state
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

	// Metrics state
	private lastValue = 0
	private lastCrossingTime = 0
	private periods: number[] = []

	constructor(camera: Camera) {
		super(camera, 'breath', 'Breath')
		this.channels = {
			pitch: new ChannelSupervisor('Pitch', -1, BREATH_HISTORY_SIZE),
			lift: new ChannelSupervisor('Lift', -1, BREATH_HISTORY_SIZE),
			scale: new ChannelSupervisor('Scale', -1, BREATH_HISTORY_SIZE),
		}
	}

	update(face: Face, timestamp: number) {
		const k = face.keypoints
		const nose = k[1]
		const midEye = k[168]
		const leftOuter = k[33]
		const rightOuter = k[263]

		if (!nose || !midEye || !leftOuter || !rightOuter) return

		const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
		if (iod === 0) return

		const headPitch = (nose.y - midEye.y) / iod

		// Mouth openness for veto check
		const upper = k[13]
		const lower = k[14]
		const left = k[61]
		const right = k[291]
		let mouthOpenness = 0
		if (upper && lower && left && right) {
			const v = Math.hypot(upper.x - lower.x, upper.y - lower.y)
			const h = Math.hypot(left.x - right.x, left.y - right.y)
			if (h > 0) mouthOpenness = v / h
		}

		this.processFrame(
			{
				headPitch,
				headY: nose.y / this.camera.videoHeight,
				faceScale: iod,
				mouthOpenness,
			},
			timestamp,
		)

		const uiSignal = Math.max(-1.5, Math.min(1.5, this.fusedSignal / 1.5))
		this.dispatchEvent(
			new CustomEvent('update', {
				detail: {
					signal: this.fusedSignal,
					uiSignal,
					depth: this.breathDepth,
					rate: this.respirationRate,
					state: this.state,
					confidence: this.confidence,
					activeAxis: this.activeAxis,
					face,
				},
			}),
		)
	}

	// ---------------------------------------------------------------------------
	// Processing pipeline
	// ---------------------------------------------------------------------------

	private processFrame(
		faceData: {
			headPitch: number
			headY: number
			faceScale: number
			mouthOpenness: number
		},
		now: number,
	) {
		// 1. Feed supervisors
		this.channels.pitch.update(faceData.headPitch)
		this.channels.lift.update(faceData.headY)
		this.channels.scale.update(faceData.faceScale)

		// 2. Global veto (talking / yawning)
		if (faceData.mouthOpenness > BREATH_MOUTH_VETO_THRESHOLD) {
			const oldState = this.state
			this.state = 'DISTURBED'
			this.confidence = 0
			this.fusedSignal = lerp(this.fusedSignal, 0, BREATH_SIGNAL_SMOOTH_ALPHA)
			if (oldState !== 'DISTURBED') {
				this.dispatchEvent(new CustomEvent('disturbed'))
			}
			return
		}

		// 3. Consensus engine — reliability-weighted fusion
		let numerator = 0
		let denominator = 0
		let maxRel = 0
		let winner = 'None'

		for (const ch of Object.values(this.channels)) {
			if (ch.reliability > BREATH_CHANNEL_MIN_RELIABILITY) {
				const w = ch.reliability ** 2
				numerator += ch.zValue * w
				denominator += w
				if (ch.reliability > maxRel) {
					maxRel = ch.reliability
					winner = ch.name
				}
			}
		}
		this.activeAxis = winner

		// 4. State transitions
		if (maxRel < BREATH_CHANNEL_MIN_RELIABILITY) {
			this.state = 'CALIBRATING'
			this.confidence = 0
			this.fusedSignal = lerp(this.fusedSignal, 0, BREATH_DECAY_ALPHA)
		} else {
			this.state = 'LOCKED'
			this.confidence = maxRel
		}

		// 5. Signal fusion with slew limiter
		const rawMix = denominator > 0 ? numerator / denominator : 0
		const delta = rawMix - this.lastValue
		const clampedMix =
			Math.abs(delta) > BREATH_SLEW_LIMIT
				? this.lastValue + Math.sign(delta) * BREATH_SLEW_LIMIT
				: rawMix

		this.fusedSignal = lerp(this.fusedSignal, clampedMix, BREATH_SIGNAL_SMOOTH_ALPHA)
		this.lastValue = this.fusedSignal

		// 6. Metrics
		this.calculateMetrics(this.fusedSignal, now)
	}

	// ---------------------------------------------------------------------------
	// Breath-cycle metrics (Schmitt trigger)
	// ---------------------------------------------------------------------------

	private calculateMetrics(signal: number, now: number) {
		// Smoothed depth (0–1)
		const depth = Math.min(1, Math.abs(signal))
		this.breathDepth = lerp(this.breathDepth, depth, BREATH_DEPTH_SMOOTH_ALPHA)

		if (this.state !== 'LOCKED') return

		const uiSignal = Math.max(-1.5, Math.min(1.5, signal / 1.5))

		if (this.crossingState === 'EXHALE' && uiSignal > BREATH_SCHMITT_UPPER) {
			this.crossingState = 'INHALE'
			this.onBreathDetected(now)
			this.dispatchEvent(new CustomEvent('inhale', { detail: { timestamp: now } }))
		} else if (this.crossingState === 'INHALE' && uiSignal < BREATH_SCHMITT_LOWER) {
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

		if (period >= BREATH_MIN_PERIOD_MS && period <= BREATH_MAX_PERIOD_MS) {
			this.periods.push(period)
			if (this.periods.length > BREATH_RATE_WINDOW) this.periods.shift()
			const avgPeriod = this.periods.reduce((a, b) => a + b, 0) / this.periods.length
			this.respirationRate = Math.round(60000 / avgPeriod)
			this.dispatchEvent(
				new CustomEvent('ratechange', { detail: { rate: this.respirationRate } }),
			)
		}
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
		for (const c of Object.values(this.channels)) c.reset()
	}
}
