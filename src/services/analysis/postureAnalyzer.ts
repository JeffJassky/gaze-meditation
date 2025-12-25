import { ref, reactive } from 'vue'
import { faceMeshService } from '../faceMeshService'

class PostureAnalyzer {
    // Reactive State
    public state = ref<'CALIBRATING' | 'TRACKING'>('CALIBRATING')
    public drift = ref(0) // Total drift magnitude
    public driftX = ref(0) // Yaw diff
    public driftY = ref(0) // Pitch diff
    public driftXPos = ref(0) // X Pos diff
    public driftYPos = ref(0) // Y Pos diff
    
    public isRunning = false

    // Internal Baselines (The "Center")
    private center = reactive({
        yaw: 0,
        pitch: 0,
        x: 0,
        y: 0
    })
    
    private isInitialized = false
    private rafId: number | null = null

    // Constants
    private readonly ADAPTATION_RATE = 0.005 // Very slow adaptation to drifting center
    private readonly INIT_SAMPLES = 60 // 1 second @ 60fps to set initial baseline

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
        this.isInitialized = false
        this.state.value = 'CALIBRATING'
        this.drift.value = 0
        this.driftX.value = 0
        this.driftY.value = 0
        this.driftXPos.value = 0
        this.driftYPos.value = 0
        
        this.center.yaw = 0
        this.center.pitch = 0
        this.center.x = 0
        this.center.y = 0
    }
    
    // Explicitly set center (e.g., "Hold THIS position")
    public captureCenter() {
        const d = faceMeshService.debugData
        this.center.yaw = d.headYaw
        this.center.pitch = d.headPitch
        this.center.x = d.headX
        this.center.y = d.headY
        this.isInitialized = true
        this.state.value = 'TRACKING'
    }

    private loop() {
        if (!this.isRunning) return

        const d = faceMeshService.debugData
        
        // Wait for FaceMesh to be ready
        if (d.faceScale === 0) {
            this.rafId = requestAnimationFrame(() => this.loop())
            return
        }

        if (!this.isInitialized) {
            // Fast initialization for first frame
            if (d.headYaw !== 0 || d.headPitch !== 0) {
                this.captureCenter()
            }
        } else {
            // Adaptive Center (Slow Moving Average)
            // This handles natural slow postural shifts without penalizing the user,
            // while still catching sudden movements.
            this.center.yaw = this.lerp(this.center.yaw, d.headYaw, this.ADAPTATION_RATE)
            this.center.pitch = this.lerp(this.center.pitch, d.headPitch, this.ADAPTATION_RATE)
            this.center.x = this.lerp(this.center.x, d.headX, this.ADAPTATION_RATE)
            this.center.y = this.lerp(this.center.y, d.headY, this.ADAPTATION_RATE)
        }
        
        // Calculate Deviations
        const diffYaw = d.headYaw - this.center.yaw
        const diffPitch = d.headPitch - this.center.pitch
        const diffHeadX = d.headX - this.center.x
        const diffHeadY = d.headY - this.center.y

        this.driftX.value = diffYaw
        this.driftY.value = diffPitch
        this.driftXPos.value = -diffHeadX
        this.driftYPos.value = diffHeadY

        // Total weighted drift score
        // Position changes are weighted heavier than rotation for "Stillness" usually.
        this.drift.value = Math.hypot(diffYaw, diffPitch, diffHeadX * 1.5, diffHeadY * 1.5)

        this.rafId = requestAnimationFrame(() => this.loop())
    }

    private lerp(start: number, end: number, amt: number) {
        return (1 - amt) * start + amt * end
    }
}

export const postureAnalyzer = new PostureAnalyzer()
