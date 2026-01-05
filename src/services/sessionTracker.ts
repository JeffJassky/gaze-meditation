import { reactive, watch } from 'vue'
import { faceMeshService } from './faceMeshService'
import { breathAnalyzer } from './analysis/breathAnalyzer'
import { postureAnalyzer } from './analysis/postureAnalyzer'
import type { PhysiologicalSnapshot } from '../types'

class SessionTracker {
	private startTime: number = 0
	private intervalId: number | null = null
	private isTracking = false
	private isInitialized = false
	
	// Data storage
	private snapshots: PhysiologicalSnapshot[] = []
	
	// Temporary buffers for rolling calculations
	private blinkTimes: number[] = [] // Timestamps of blink starts
	private blinkDurations: { timestamp: number; duration: number }[] = [] // Durations of recent blinks in ms
	
	// Blink Logic
	private wasBlinking = false
	private blinkStartTimestamp = 0
	
	// Reactive state for UI consumption (if needed live)
	public liveMetrics = reactive({
		elapsedTime: 0,
		blinkRate: 0,
		blinkSpeed: 0,
		stillness: 0,
		breathRate: 0,
		eyeOpenness: 0,
		mouthOpenness: 0,
		headRoll: 0,
		headPitch: 0,
		browRaise: 0
	})

	constructor() {
		// Watch for blink changes to calculate duration and count
		watch(() => faceMeshService.debugData.blinkDetected, (isBlinking) => {
			if (!this.isTracking) return

			const now = Date.now()
			
			if (isBlinking && !this.wasBlinking) {
				// Blink Start
				this.wasBlinking = true
				this.blinkStartTimestamp = now
				this.blinkTimes.push(now)
				this.pruneOldBlinks(now)
			} else if (!isBlinking && this.wasBlinking) {
				// Blink End
				this.wasBlinking = false
				const duration = now - this.blinkStartTimestamp
				// Allow long blinks (eye closures) by removing the upper duration cap
				if (duration > 50) { 
					this.blinkDurations.push({ timestamp: now, duration: duration })
					this.pruneOldDurations(now)
				}
			}
		})
	}

	public startSession() {
		this.startTime = Date.now()
		this.isTracking = true
		this.snapshots = []
		
		this.resetBuffers()
		
		// Start Analyzers
		breathAnalyzer.start()
		postureAnalyzer.start()

		// Start Sampling Loop (e.g., 2Hz - every 500ms)
		if (this.intervalId) clearInterval(this.intervalId)
		this.intervalId = window.setInterval(() => {
			this.sample()
		}, 500)
	}

	public stopSession(): { snapshots: PhysiologicalSnapshot[], summary?: any } {
		this.isTracking = false
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
		}
		
		breathAnalyzer.stop()
		postureAnalyzer.stop()
		
		const summary = this.calculateBiometricSummary()

		return { 
			snapshots: [...this.snapshots],
			summary
		}
	}

	public get history() {
		return this.snapshots
	}
	
	private calculateBiometricSummary() {
		if (this.snapshots.length < 10) return undefined // Not enough data

		// Helper to get average of a key over a slice
		const getAvg = (data: PhysiologicalSnapshot[], key: keyof PhysiologicalSnapshot) => {
			if (data.length === 0) return 0
			const sum = data.reduce((acc, curr) => acc + (curr[key] as number), 0)
			return sum / data.length
		}

		// 1. Define Windows
		// Baseline: First 60 seconds (or 20% of session if short)
		// We sample at 2Hz (every 500ms), so 60s = 120 samples
		const baselineCount = Math.min(120, Math.floor(this.snapshots.length * 0.2))
		const baselineData = this.snapshots.slice(0, baselineCount)

		// 2. Calculate Baselines
		const baseline = {
			blinkRate: getAvg(baselineData, 'blinkRate'),
			blinkSpeed: getAvg(baselineData, 'blinkSpeed'),
			stillness: getAvg(baselineData, 'stillness'),
			tension: getAvg(baselineData, 'browRaise'),
			eyeOpenness: getAvg(baselineData, 'eyeOpenness')
		}

		// 3. Find "Deepest State" (Best 30s Window)
		// 30s = 60 samples
		const windowSize = 60
		let bestWindow = { ...baseline }
		let maxCoherenceScore = -Infinity

		// We slide through the session (skipping the very start to allow for settling)
		for (let i = baselineCount; i <= this.snapshots.length - windowSize; i++) {
			const window = this.snapshots.slice(i, i + windowSize)
			
			const avgStillness = getAvg(window, 'stillness') // Higher is better (0-1)
			const avgBlinkRate = getAvg(window, 'blinkRate') // Lower is better
			const avgTension = getAvg(window, 'browRaise')   // Lower is better

			// Normalize metrics to 0-1 scores for comparison
			const blinkScore = Math.max(0, 1 - (avgBlinkRate / 30))
			const tensionScore = Math.max(0, 1 - avgTension)

			// Coherence Score (Simple weighted sum)
			const score = (avgStillness * 0.4) + (blinkScore * 0.3) + (tensionScore * 0.3)

			if (score > maxCoherenceScore) {
				maxCoherenceScore = score
				bestWindow = {
					blinkRate: avgBlinkRate,
					blinkSpeed: getAvg(window, 'blinkSpeed'),
					stillness: avgStillness,
					tension: avgTension,
					eyeOpenness: getAvg(window, 'eyeOpenness')
				}
			}
		}

		// 4. Calculate Improvements (Percentage Change)
		const safePct = (base: number, best: number, isHigherBetter: boolean) => {
			if (base === 0) return isHigherBetter ? (best > 0 ? 1 : 0) : (best < 0 ? 1 : 0);
			const diff = isHigherBetter ? best - base : base - best
			return diff / base
		}

		return {
			blinkRate: {
				start: baseline.blinkRate,
				best: bestWindow.blinkRate,
				improvement: safePct(baseline.blinkRate, bestWindow.blinkRate, false)
			},
			blinkSpeed: {
				start: baseline.blinkSpeed,
				best: bestWindow.blinkSpeed,
				// For blink speed (duration), longer can be better (more relaxed), so isHigherBetter = true
				improvement: safePct(baseline.blinkSpeed, bestWindow.blinkSpeed, true)
			},
			stillness: {
				start: baseline.stillness,
				best: bestWindow.stillness,
				improvement: safePct(baseline.stillness, bestWindow.stillness, true)
			},
			relaxation: {
				start: baseline.tension,
				best: bestWindow.tension,
				improvement: safePct(baseline.tension, bestWindow.tension, false)
			},
			eyeDroop: {
				start: baseline.eyeOpenness,
				best: bestWindow.eyeOpenness,
				improvement: safePct(baseline.eyeOpenness, bestWindow.eyeOpenness, false)
			}
		}
	}
	
	private resetBuffers() {
		this.blinkTimes = []
		this.blinkDurations = []
		this.wasBlinking = false
		
		this.liveMetrics.blinkRate = 0
		this.liveMetrics.blinkSpeed = 0
		this.liveMetrics.stillness = 0
		this.liveMetrics.breathRate = 0
	}
	
	private pruneOldBlinks(now: number) {
		// Keep blinks from last 60 seconds
		const window = 60000
		this.blinkTimes = this.blinkTimes.filter(t => now - t < window)
	}

	private pruneOldDurations(now: number) {
		const window = 60000
		this.blinkDurations = this.blinkDurations.filter(item => now - item.timestamp < window)
	}

	private sample() {
		const now = Date.now()
		const elapsed = now - this.startTime
		this.liveMetrics.elapsedTime = elapsed

		// Prune old data on each sample to ensure live metrics are accurate
		this.pruneOldBlinks(now)
		this.pruneOldDurations(now)

		// Update Buffers
		const yaw = faceMeshService.debugData.headYaw
		const pitch = faceMeshService.debugData.headPitch
		const roll = faceMeshService.debugData.headRoll
		const brow = faceMeshService.debugData.browRaise
		
		// Calculate Metrics
		this.calculateBlinkRate(now)
		this.calculateBlinkSpeed()
		
		// Stillness from Analyzer
		// Drift is 0..N. Stillness is 0..1.
		// Sensitivity: Drift of 0.05 is "moved a lot".
		const drift = postureAnalyzer.drift.value
		const stillness = Math.max(0, 1 - (drift * 20)) // 0.05 * 20 = 1.0 (Full movement)
		this.liveMetrics.stillness = stillness
		
		this.liveMetrics.breathRate = breathAnalyzer.respirationRate.value
		this.liveMetrics.eyeOpenness = faceMeshService.debugData.eyeOpennessNormalized
		this.liveMetrics.mouthOpenness = faceMeshService.debugData.mouthOpenness
		this.liveMetrics.headRoll = roll
		this.liveMetrics.headPitch = pitch
		this.liveMetrics.browRaise = brow
		
		const snapshot: PhysiologicalSnapshot = {
			timestamp: elapsed,
			blinkRate: this.liveMetrics.blinkRate,
			blinkSpeed: this.liveMetrics.blinkSpeed,
			breathRate: this.liveMetrics.breathRate,
			stillness: this.liveMetrics.stillness,
			headYaw: yaw,
			headPitch: pitch,
			headRoll: roll,
			browRaise: brow,
			eyeOpenness: faceMeshService.debugData.eyeOpennessNormalized,
			mouthOpenness: this.liveMetrics.mouthOpenness
		}
		
		this.snapshots.push(snapshot)
	}
	
	private calculateBlinkRate(now: number) {
		const secondsActive = Math.min((now - this.startTime) / 1000, 60)
		if (secondsActive < 5) {
			this.liveMetrics.blinkRate = 0 // Too early
			return
		}
		
		const count = this.blinkTimes.length
		// Normalize to BPM
		this.liveMetrics.blinkRate = (count / secondsActive) * 60
	}
	
	private calculateBlinkSpeed() {
		if (this.blinkDurations.length === 0) {
			this.liveMetrics.blinkSpeed = 0
			return
		}
		const sum = this.blinkDurations.reduce((acc, item) => acc + item.duration, 0)
		this.liveMetrics.blinkSpeed = sum / this.blinkDurations.length
	}
}

export const sessionTracker = new SessionTracker()
