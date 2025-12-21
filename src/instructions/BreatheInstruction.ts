import { ref, markRaw, reactive } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import BreatheView from './views/BreatheView.vue'
import { faceMeshService } from '../services/faceMeshService'

// --- CONSTANTS ---
const HISTORY_SIZE = 300 // 5 seconds @ 60fps
const MIN_BREATH_PERIOD = 1500 // 40 BPM (Fastest allowable breath)
const MAX_BREATH_PERIOD = 10000 // 6 BPM (Slowest allowable breath)

interface BreatheOptions extends InstructionOptions {
	duration?: number // Optional duration in ms.
}

// --- HELPER: Rolling Statistics ---
// Keeps track of Mean and StdDev without iterating the array every frame.
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
    // This is the "Magic Normalizer" that handles any gain automatically.
    getZScore(val: number): number {
        const sd = this.stdDev
        if (sd < 0.0001) return 0 // Guard div by zero (dead signal)
        return (val - this.mean) / sd
    }
}

// --- CLASS: Channel Supervisor ---
class ChannelSupervisor {
    private stats = new RollingStats(HISTORY_SIZE)
    private recentTrend = new RollingStats(30) // Short term (0.5s) for noise detection
    
    public reliability = 0 // 0.0 to 1.0
    public zValue = 0 // Standardized Output
    
    // Polarity: -1 means "Negative value = Inhale" (e.g., Pitch Up, Lift Up)
    constructor(public name: string, private polarity: number = -1) {}

    update(rawValue: number) {
        // 1. Ingest Data
        this.stats.push(rawValue)
        this.recentTrend.push(rawValue)

        // 2. Calculate Z-Score (The Signal)
        // We flip polarity here so Positive ALWAYS means Inhale
        this.zValue = this.stats.getZScore(rawValue) * this.polarity

        // 3. Analyze Quality
        this.calculateReliability()
    }

    private calculateReliability() {
        // Factor A: Signal Power (Is it moving?)
        const signalPower = this.stats.stdDev
        // Threshold: 0.001 to 0.002 depending on units. 
        // Pitch/Lift are ~0 to 1. Scale is pixels (5-50).
        // We need to normalize threshold? Or use relative?
        // Let's assume input is somewhat normalized or handle scale differently?
        // Scale is pixels. Pitch is normalized 0-1ish.
        // Quick Fix: Scale needs larger threshold.
        let deadThreshold = 0.002
        if (this.name === 'Scale') deadThreshold = 0.5 // 0.5 pixel movement

        if (signalPower < deadThreshold) { // Threshold for "Dead Still"
            this.reliability = Math.max(0, this.reliability - 0.05)
            return
        }

        // Factor B: Signal Cleanliness (SNR)
        // High stdDev in short-term vs long-term implies jitter/noise.
        // Breathing is smooth (Low Short-Term Variance), Talking is jagged (High Short-Term).
        const shortTermNoise = this.recentTrend.stdDev
        const longTermSignal = this.stats.stdDev
        
        // Ratio > 0.5 usually means the signal is mostly noise
        const noiseRatio = shortTermNoise / (longTermSignal + 0.0001)

        if (noiseRatio > 0.6) {
            // Noisy signal (Talking, shaking)
            this.reliability = Math.max(0, this.reliability - 0.05)
        } else {
            // Clean signal -> Boost
            this.reliability = Math.min(1, this.reliability + 0.05)
        }
    }
}

// --- CLASS: Adaptive Controller ---
class AdaptiveBreathController {
    public state = ref<'CALIBRATING' | 'LOCKED' | 'DISTURBED'>('CALIBRATING')
    public fusedSignal = ref(0) // The final "One True Breath"
    public confidence = ref(0)
    public activeAxis = ref('None') // Debug
    
    // Supervisors
    public channels = reactive({
        pitch: new ChannelSupervisor('Pitch', -1), // Head tilts back (neg) on inhale
        lift: new ChannelSupervisor('Lift', -1),   // Head moves up (neg) on inhale
        scale: new ChannelSupervisor('Scale', -1)  // IOD shrinks (neg) on lean back/inhale
    })

    private lastValue = 0

    update(faceData: any) {
        // 1. Feed Supervisors
        this.channels.pitch.update(faceData.headPitch)
        this.channels.lift.update(faceData.headY)
        this.channels.scale.update(faceData.faceScale)

        // 2. Global Veto (Mouth Openness)
        // If mouth is open > 15%, user might be talking. 
        // We clamp reliability instantly to avoid processing speech as breath.
        if (faceData.mouthOpenness > 0.15) {
             this.state.value = 'DISTURBED'
             this.confidence.value = 0
             // Decay signal to 0
             this.fusedSignal.value = this.lerp(this.fusedSignal.value, 0, 0.1)
             return
        }

        // 3. Consensus Engine (Weighted Average)
        let numerator = 0
        let denominator = 0
        let maxRel = 0
        let winner = 'None'

        Object.values(this.channels).forEach(ch => {
            // Only listen to channels with > 30% reliability
            if (ch.reliability > 0.3) {
                // Square the weight to heavily favor the BEST signal
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
            // If we are lost, gently drift to 0
            this.fusedSignal.value = this.lerp(this.fusedSignal.value, 0, 0.05)
            return
        } else {
            this.state.value = 'LOCKED'
            this.confidence.value = maxRel
        }

        // 5. Signal Fusion & Slew Limiting
        const rawMix = numerator / denominator

        // Sneeze/Jerk Guard: 
        // Real breathing Z-score rarely jumps > 0.5 per frame (at 60fps)
        const delta = rawMix - this.lastValue
        let clampedMix = rawMix
        
        if (Math.abs(delta) > 0.5) {
             // Limit the change (Slew Rate Limiter)
             clampedMix = this.lastValue + (Math.sign(delta) * 0.5)
        }

        // Smoothing (Low Pass Filter)
        // 0.1 alpha = responsive but smooth
        this.fusedSignal.value = this.lerp(this.fusedSignal.value, clampedMix, 0.1)
        this.lastValue = this.fusedSignal.value
    }

    private lerp(a: number, b: number, t: number) {
        return a + (b - a) * t
    }
}

// --- MAIN INSTRUCTION ---
export class BreatheInstruction extends Instruction<BreatheOptions> {
    public status = ref<'CALIBRATING' | 'RUNNING' | 'SUCCESS'>('CALIBRATING')
    public progress = ref(0)
    
    // Visual Outputs
    public breathSignal = ref(0) // -1 to 1 (Smoothed for UI)
    public breathDepth = ref(0)  // 0 to 1
    public respirationRate = ref(0)
    public breathsDetected = ref(0)
    public debugGain = ref(1.0) // Dummy for UI compatibility

    // The Brain
    public controller = new AdaptiveBreathController()

    protected context: InstructionContext | null = null
    private animationFrameId: number | null = null
    private startTime = 0
    private endTime = 0
    
    // Rate Logic (Schmitt Trigger)
    private crossingState: 'INHALE' | 'EXHALE' = 'EXHALE'
    private lastCrossingTime = 0
    private periods: number[] = []

    constructor(options: BreatheOptions) {
        super({
            duration: 30000,
            ...options,
            capabilities: { faceMesh: true, ...options.capabilities }
        })
    }

    async start(context: InstructionContext) {
        this.context = context
        this.resolvedTheme = context.resolvedTheme
        this.status.value = 'CALIBRATING'
        await faceMeshService.init()
        
        this.startTime = Date.now()
        if (this.options.duration) this.endTime = this.startTime + this.options.duration
        
        this.loop()
    }

    stop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
    }

    private loop() {
        if (this.status.value === 'SUCCESS') return
        const now = Date.now()

        // 1. Check Duration
        if (this.options.duration) {
            const elapsed = now - this.startTime
            this.progress.value = Math.min(100, (elapsed / this.options.duration) * 100)
            if (now >= this.endTime) {
                this.complete(true)
                this.status.value = 'SUCCESS'
                return
            }
        }

        // 2. Get Data
        const debug = faceMeshService.debugData
        // Guard against uninitialized data
        if (debug.faceScale === 0) {
            this.animationFrameId = requestAnimationFrame(() => this.loop())
            return
        }

        // 3. Update Controller
        this.controller.update({
            headPitch: debug.headPitch,
            headY: debug.headY,
            faceScale: debug.faceScale, 
            mouthOpenness: debug.mouthOpenness
        })

        // 4. Update UI State
        const zSignal = this.controller.fusedSignal.value
        
        // Compress Z-Score to -1..1 for UI
        // Z-score of breathing is usually +/- 1.5 to 2.0. We divide by 2.
        const uiSignal = Math.max(-1.5, Math.min(1.5, zSignal / 1.5))
        
        this.breathSignal.value = uiSignal
        this.breathDepth.value = Math.min(1, Math.abs(uiSignal))
        
        if (this.controller.state.value === 'LOCKED') {
            this.status.value = 'RUNNING'
            this.detectRate(now, uiSignal)
        } else {
            this.status.value = 'CALIBRATING'
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop())
    }

    private detectRate(now: number, signal: number) {
        // Schmitt Trigger for Robust Zero Crossing
        const UPPER_THRESH = 0.2
        const LOWER_THRESH = -0.2
        
        if (this.crossingState === 'EXHALE' && signal > UPPER_THRESH) {
            // Crossed Up (Start of Inhale)
            this.crossingState = 'INHALE'
            this.onBreathDetected(now)
        } else if (this.crossingState === 'INHALE' && signal < LOWER_THRESH) {
            // Crossed Down (Start of Exhale)
            this.crossingState = 'EXHALE'
        }
    }

    private onBreathDetected(now: number) {
        if (this.lastCrossingTime === 0) {
            this.lastCrossingTime = now
            return
        }

        const period = now - this.lastCrossingTime
        this.lastCrossingTime = now

        // Filter realistic limits (6 BPM to 40 BPM)
        if (period >= MIN_BREATH_PERIOD && period <= MAX_BREATH_PERIOD) {
            this.breathsDetected.value++
            this.periods.push(period)
            if (this.periods.length > 5) this.periods.shift()
            
            const avgPeriod = this.periods.reduce((a, b) => a + b, 0) / this.periods.length
            this.respirationRate.value = Math.round(60000 / avgPeriod)
        }
    }

    get component() {
        return markRaw(BreatheView)
    }
}