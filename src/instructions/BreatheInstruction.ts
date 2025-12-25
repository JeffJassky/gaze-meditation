import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import BreatheView from './views/BreatheView.vue'
import { faceMeshService } from '../services/faceMeshService'
import { breathAnalyzer } from '../services/analysis/breathAnalyzer'

interface BreatheOptions extends InstructionOptions {
	duration?: number // Optional duration in ms.
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
    public debugGain = ref(1.0) 

    protected context: InstructionContext | null = null
    private animationFrameId: number | null = null
    private startTime = 0

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
        
        // Ensure analyzer is running (idempotent)
        breathAnalyzer.start()
        
        this.startTime = Date.now()
        this.loop()
    }

    stop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
        // We do NOT stop the analyzer here, as it might be needed for session tracking.
        // SessionTracker manages the analyzer's lifecycle during a session.
    }

    private loop() {
        if (this.status.value === 'SUCCESS') return
        const now = Date.now()

        // 1. Check Duration
        if (this.duration) {
            const elapsed = now - this.startTime
            this.progress.value = Math.min(100, (elapsed / this.duration) * 100)
            if (elapsed >= this.duration) {
                this.complete(true)
                this.status.value = 'SUCCESS'
                return
            }
        }

        // 2. Sync with Analyzer Service
        // The analyzer is updating asynchronously via its own loop or SessionTracker.
        // We just read the reactive state.
        
        // UI Signal Smoothing (Optional, if analyzer signal is raw)
        // Analyzer fusedSignal is already smoothed.
        // We might want to compress it for UI like before.
        const zSignal = breathAnalyzer.fusedSignal.value
        const uiSignal = Math.max(-1.5, Math.min(1.5, zSignal / 1.5))
        
        this.breathSignal.value = uiSignal
        this.breathDepth.value = breathAnalyzer.breathDepth.value
        this.respirationRate.value = breathAnalyzer.respirationRate.value
        
        if (breathAnalyzer.state.value === 'LOCKED') {
            this.status.value = 'RUNNING'
        } else {
            this.status.value = 'CALIBRATING'
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop())
    }

    get component() {
        return markRaw(BreatheView)
    }
}