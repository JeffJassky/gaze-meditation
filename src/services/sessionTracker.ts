import { reactive, watch } from 'vue'
import { faceMeshService } from './faceMeshService'
import { breathAnalyzer } from './analysis/breathAnalyzer'
import { postureAnalyzer } from './analysis/postureAnalyzer'
import type { PhysiologicalSnapshot } from '../types'

class SessionTracker {
	private startTime: number = 0
	private intervalId: number | null = null
	private isTracking = false
	
	// Data storage
	private snapshots: PhysiologicalSnapshot[] = []
	
	// Temporary buffers for rolling calculations
	private blinkTimes: number[] = [] // Timestamps of blink starts
	private blinkDurations: number[] = [] // Durations of recent blinks in ms
	
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
				if (duration > 50 && duration < 1000) { // Filter noise
					this.blinkDurations.push(duration)
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

	public stopSession(): PhysiologicalSnapshot[] {
		this.isTracking = false
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
		}
		
		breathAnalyzer.stop()
		postureAnalyzer.stop()
		
		return [...this.snapshots]
	}

	public get history() {
		return this.snapshots
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
		// Keep durations from last 60 seconds (approx) - actually just keep last N samples might be easier, 
		// but let's stick to time or count. Let's keep last 20 blinks for average speed.
		if (this.blinkDurations.length > 20) {
			this.blinkDurations = this.blinkDurations.slice(this.blinkDurations.length - 20)
		}
	}

	private sample() {
		const now = Date.now()
		const elapsed = now - this.startTime
		this.liveMetrics.elapsedTime = elapsed

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
		this.pruneOldBlinks(now)
		// Extrapolate if less than 1 minute passed? Or just raw count?
		// Raw count over last minute is standard "Blinks Per Minute".
		// If < 1 min has passed, we can project, but it might be noisy. 
		// Let's just return Count for now, but maybe scaled if < 10s? No, strictly "Blinks in last 60s".
		// Actually, if we are at second 10 and have 2 blinks, rate is 12. 
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
		const sum = this.blinkDurations.reduce((a, b) => a + b, 0)
		this.liveMetrics.blinkSpeed = sum / this.blinkDurations.length
	}
}

export const sessionTracker = new SessionTracker()
