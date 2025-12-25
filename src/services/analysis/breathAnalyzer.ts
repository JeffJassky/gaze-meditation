import { ref, reactive } from 'vue'
import { faceMeshService } from '../faceMeshService'

// --- CONSTANTS ---
const HISTORY_SIZE = 300 // 5 seconds @ 60fps
const MIN_BREATH_PERIOD = 1500 // 40 BPM (Fastest allowable breath)
const MAX_BREATH_PERIOD = 10000 // 6 BPM (Slowest allowable breath)

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
    private stats = new RollingStats(HISTORY_SIZE)
    private recentTrend = new RollingStats(30) // Short term (0.5s) for noise detection
    
    public reliability = 0 // 0.0 to 1.0
    public zValue = 0 // Standardized Output
    
    constructor(public name: string, private polarity: number = -1) {}

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

// --- MAIN SERVICE ---
class BreathAnalyzer {
    public state = ref<'CALIBRATING' | 'LOCKED' | 'DISTURBED'>('CALIBRATING')
    public fusedSignal = ref(0) // The final "One True Breath"
    public confidence = ref(0)
    public activeAxis = ref('None')
    
    // Metrics
    public respirationRate = ref(0)
    public breathDepth = ref(0)
    public isRunning = false

    // Supervisors
    private channels = {
        pitch: new ChannelSupervisor('Pitch', -1),
        lift: new ChannelSupervisor('Lift', -1),
        scale: new ChannelSupervisor('Scale', -1)
    }

    private lastValue = 0
    private rafId: number | null = null
    
    public crossingState = ref<'INHALE' | 'EXHALE'>('EXHALE')
    private lastCrossingTime = 0
    private periods: number[] = []

    public start() {
        if (this.isRunning) return
        this.isRunning = true
        this.reset()
        this.loop()
    }

    public stop() {
        this.isRunning = false
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    public reset() {
        this.state.value = 'CALIBRATING'
        this.fusedSignal.value = 0
        this.confidence.value = 0
        this.respirationRate.value = 0
        this.breathDepth.value = 0
        this.lastValue = 0
        this.periods = []
        this.crossingState.value = 'EXHALE'
        this.lastCrossingTime = 0
        
        Object.values(this.channels).forEach(c => c.reset())
    }

    private loop() {
        if (!this.isRunning) return

        const debug = faceMeshService.debugData
        // Only process if we have valid scale (face detected)
        if (debug.faceScale > 0) {
            this.processFrame({
                headPitch: debug.headPitch,
                headY: debug.headY,
                faceScale: debug.faceScale,
                mouthOpenness: debug.mouthOpenness
            })
        }

        this.rafId = requestAnimationFrame(() => this.loop())
    }

    private processFrame(faceData: any) {
        // 1. Feed Supervisors
        this.channels.pitch.update(faceData.headPitch)
        this.channels.lift.update(faceData.headY)
        this.channels.scale.update(faceData.faceScale)

        // 2. Global Veto (Mouth Openness)
        if (faceData.mouthOpenness > 0.15) {
             this.state.value = 'DISTURBED'
             this.confidence.value = 0
             this.fusedSignal.value = this.lerp(this.fusedSignal.value, 0, 0.1)
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

        this.activeAxis.value = winner

        // 4. State Transitions
        if (maxRel < 0.3) {
            this.state.value = 'CALIBRATING'
            this.confidence.value = 0
            this.fusedSignal.value = this.lerp(this.fusedSignal.value, 0, 0.05)
        } else {
            this.state.value = 'LOCKED'
            this.confidence.value = maxRel
        }

        // 5. Signal Fusion & Slew Limiting
        const rawMix = denominator > 0 ? numerator / denominator : 0
        
        const delta = rawMix - this.lastValue
        let clampedMix = rawMix
        
        if (Math.abs(delta) > 0.5) {
             clampedMix = this.lastValue + (Math.sign(delta) * 0.5)
        }

        this.fusedSignal.value = this.lerp(this.fusedSignal.value, clampedMix, 0.1)
        this.lastValue = this.fusedSignal.value
        
        // 6. Metrics Calculation
        this.calculateMetrics(this.fusedSignal.value)
    }
    
    private calculateMetrics(signal: number) {
        // Depth (0-1 approx, smoothed)
        const depth = Math.min(1, Math.abs(signal))
        this.breathDepth.value = this.breathDepth.value * 0.95 + depth * 0.05
        
        // Rate Detection (Schmitt Trigger)
        if (this.state.value !== 'LOCKED') return

        const now = Date.now()
        // Compress Z-Score for reliable triggering
        const uiSignal = Math.max(-1.5, Math.min(1.5, signal / 1.5))
        
        const UPPER_THRESH = 0.2
        const LOWER_THRESH = -0.2
        
        if (this.crossingState.value === 'EXHALE' && uiSignal > UPPER_THRESH) {
            this.crossingState.value = 'INHALE'
            this.onBreathDetected(now)
        } else if (this.crossingState.value === 'INHALE' && uiSignal < LOWER_THRESH) {
            this.crossingState.value = 'EXHALE'
        }
    }

    private onBreathDetected(now: number) {
        if (this.lastCrossingTime === 0) {
            this.lastCrossingTime = now
            return
        }

        const period = now - this.lastCrossingTime
        this.lastCrossingTime = now

        if (period >= MIN_BREATH_PERIOD && period <= MAX_BREATH_PERIOD) {
            this.periods.push(period)
            if (this.periods.length > 5) this.periods.shift()
            
            const avgPeriod = this.periods.reduce((a, b) => a + b, 0) / this.periods.length
            this.respirationRate.value = Math.round(60000 / avgPeriod)
        }
    }

    private lerp(a: number, b: number, t: number) {
        return a + (b - a) * t
    }
}

export const breathAnalyzer = new BreathAnalyzer()
