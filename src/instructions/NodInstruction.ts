import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import NodView from './views/NodView.vue'
import { faceMeshService } from '../services/faceMeshService'

interface NodOptions extends InstructionOptions {
	nodsRequired: number
	type: 'YES' | 'NO'
}

export class NodInstruction extends Instruction<NodOptions> {
	public nodsCompleted = ref(0)
	public currentStage = ref<'CALIBRATING' | 'CENTER' | 'WAIT_UP' | 'WAIT_DOWN' | 'WAIT_LEFT' | 'WAIT_RIGHT'>('CALIBRATING')
	
	// Pitch (Yes)
	public currentPitch = ref(0)
	public relativePitch = ref(0)
	
	// Yaw (No)
	public currentYaw = ref(0)
	public relativeYaw = ref(0)

	// public resolvedTheme!: ThemeConfig; // Removed redundant declaration

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	
	private baselinePitch = 0
	private baselineYaw = 0
	
	private pitchSamples: number[] = []
	private yawSamples: number[] = []

	// Thresholds (Relative to baseline)
	// Pitch: -Up, +Down
	public readonly UP_THRESH = -0.02
	public readonly DOWN_THRESH = 0.02
	
	// Yaw: -Left, +Right (Assuming standard mapping)
	public readonly LEFT_THRESH = -0.02
	public readonly RIGHT_THRESH = 0.02

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.nodsCompleted.value = 0
		this.currentStage.value = 'CALIBRATING'
		this.pitchSamples = []
		this.yawSamples = []

		await faceMeshService.init()

		// Run calibration for 1 second
		const startCal = Date.now()

		const calibrate = () => {
			if (Date.now() - startCal > 1000) {
				// Finish calibration
				if (this.pitchSamples.length > 0) {
					this.baselinePitch =
						this.pitchSamples.reduce((a, b) => a + b, 0) /
						this.pitchSamples.length
				}
				if (this.yawSamples.length > 0) {
					this.baselineYaw = 
						this.yawSamples.reduce((a, b) => a + b, 0) /
						this.yawSamples.length
				}
				
				this.currentStage.value = 'CENTER'
				this.loop()
				return
			}

			const pitch = faceMeshService.debugData.headPitch
			const yaw = faceMeshService.debugData.headYaw
			
			// Ignore zeros/uninitialized
			if (pitch !== 0) this.pitchSamples.push(pitch)
			if (yaw !== 0) this.yawSamples.push(yaw)

			this.animationFrameId = requestAnimationFrame(calibrate)
		}

		calibrate()
	}

	stop() {
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
	}

	private loop() {
		const rawPitch = faceMeshService.debugData.headPitch
		const rawYaw = faceMeshService.debugData.headYaw
		
		const relPitch = rawPitch - this.baselinePitch
		const relYaw = rawYaw - this.baselineYaw

		this.currentPitch.value = rawPitch
		this.relativePitch.value = relPitch
		
		this.currentYaw.value = rawYaw
		this.relativeYaw.value = relYaw

		// State Machine
		if (this.options.type === 'YES') {
			// YES: Vertical Nod
			// Reversed Logic: Expect DOWN first, then UP
			
			if (this.currentStage.value === 'CENTER') {
				// Waiting for start (Down first)
				if (relPitch > this.DOWN_THRESH) {
					this.currentStage.value = 'WAIT_UP'
				}
			} else if (this.currentStage.value === 'WAIT_UP') {
				// We went DOWN, now we must go UP past threshold
				if (relPitch < this.UP_THRESH) {
					this.completeNod()
				}
			}
		} else {
			// NO: Horizontal Shake
			// Sequence: Left -> Right (or Right -> Left, but we enforce one for simplicity, or detect the first move)
			
			if (this.currentStage.value === 'CENTER') {
				// Detect initial movement
				if (relYaw < this.LEFT_THRESH) {
					this.currentStage.value = 'WAIT_RIGHT'
				} else if (relYaw > this.RIGHT_THRESH) {
					// Optional: Support starting Right
					this.currentStage.value = 'WAIT_LEFT'
				}
			} else if (this.currentStage.value === 'WAIT_RIGHT') {
				// Went Left, need to go Right
				if (relYaw > this.RIGHT_THRESH) {
					this.completeNod()
				}
			} else if (this.currentStage.value === 'WAIT_LEFT') {
				// Went Right, need to go Left
				if (relYaw < this.LEFT_THRESH) {
					this.completeNod()
				}
			}
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private completeNod() {
		this.nodsCompleted.value++
		this.currentStage.value = 'CENTER' // Reset cycle

		if (this.nodsCompleted.value >= this.options.nodsRequired) {
			this.stop()
			this.context?.complete(true)
		}
	}

	get component() {
		return markRaw(NodView)
	}
}