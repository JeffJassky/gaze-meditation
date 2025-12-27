import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import NodView from './views/NodView.vue'
import { faceMeshService } from '../services/faceMeshService'

interface NodOptions extends InstructionOptions {
	type: 'YES' | 'NO'
	nodsRequired?: number
	showProgress?: boolean
	showSwitch?: boolean
	showDots?: boolean
}

export class NodInstruction extends Instruction<NodOptions> {
	public nodsCompleted = ref(0)
	public currentStage = ref<'CENTER' | 'WAIT_UP' | 'WAIT_DOWN' | 'WAIT_LEFT' | 'WAIT_RIGHT'>(
		'CENTER'
	)

	constructor(options: NodOptions) {
		super({
			nodsRequired: 2,
			showProgress: false,
			showSwitch: false,
			showDots: false,
			...options,
			capabilities: { faceMesh: true, ...options.capabilities }
		})
	}

	// Pitch (Yes)
	public currentPitch = ref(0)
	public relativePitch = ref(0)
	public pitchState = ref<-1 | 0 | 1>(0) // -1: Up, 0: Center, 1: Down

	// Yaw (No)
	public currentYaw = ref(0)
	public relativeYaw = ref(0)
	public yawState = ref<-1 | 0 | 1>(0) // -1: Left, 0: Center, 1: Right

	public totalProgress = ref(0) // 0-100

	protected context: InstructionContext | null = null
	private animationFrameId: number | null = null
	private completionTimer: number | null = null
	private isFinished = false
	private voicePlaying = false
	private isActive = false

	// Dynamic Centering (Low Pass Filter)
	private centerPitch = 0
	private centerYaw = 0
	private isInitialized = false

	// Thresholds (Relative to dynamic center)
	// Pitch: -Up, +Down
	public readonly UP_THRESH = -0.008 // nodding is mostly down from baseline
	public readonly DOWN_THRESH = 0.012

	// Yaw: -Left, +Right
	public readonly LEFT_THRESH = -0.009
	public readonly RIGHT_THRESH = 0.009

	async start(context: InstructionContext) {
		this.isActive = true
		this.context = context
		this.resolvedTheme = context.resolvedTheme
		this.nodsCompleted.value = 0
		this.currentStage.value = 'CENTER'
		this.isFinished = false
		this.pitchState.value = 0
		this.yawState.value = 0
		this.isInitialized = false
		this.totalProgress.value = 0
		this.voicePlaying = false

		if (this.options.voice) {
			this.voicePlaying = true
			const voiceText = Array.isArray(this.options.voice) ? this.options.voice.join(' ') : this.options.voice
			this.playVoice(voiceText, { previousText: context.previousVoiceText }).then(() => {
				this.voicePlaying = false
				if (this.isActive && this.nodsCompleted.value >= this.options.nodsRequired!) {
					this.complete(true)
				}
			})
		}

		await faceMeshService.init()
		if (!this.isActive) return
		this.loop()
	}

	stop() {
		this.isActive = false
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
		if (this.completionTimer) clearTimeout(this.completionTimer)
	}

	private loop() {
		const rawPitch = faceMeshService.debugData.headPitch
		const rawYaw = faceMeshService.debugData.headYaw

		// Initialization: Set center to current value on first frame
		if (!this.isInitialized) {
			if (rawPitch !== 0 || rawYaw !== 0) {
				this.centerPitch = rawPitch
				this.centerYaw = rawYaw
				this.isInitialized = true
			}
		} else {
			// Continuous Center Adaptation (Low Pass Filter for the center point)
			// Slowly drift the baseline 'center' towards the current raw posture.
			// - Higher alpha: Faster adaptation, less smoothing (center follows movement more closely).
			// - Lower alpha: Slower adaptation, more smoothing (center stays more stable).
			// 0.01 means it takes ~100 frames (~2 sec @ 60fps) to move 63% of the way to a new posture.
			// This filters out slow posture changes (drift) while preserving quick nod deviations.
			const alpha = 0.02
			this.centerPitch = this.lerp(this.centerPitch, rawPitch, alpha)
			this.centerYaw = this.lerp(this.centerYaw, rawYaw, alpha)
		}

		const relPitch = rawPitch - this.centerPitch
		const relYaw = rawYaw - this.centerYaw

		this.currentPitch.value = rawPitch
		this.relativePitch.value = relPitch

		this.currentYaw.value = rawYaw
		this.relativeYaw.value = relYaw

		// Update Discrete States (Sticky Logic)
		// Pitch
		if (this.pitchState.value === 0) {
			if (relPitch < this.UP_THRESH) this.pitchState.value = -1
			else if (relPitch > this.DOWN_THRESH) this.pitchState.value = 1
		} else {
			// Latch logic: switch only on opposite threshold
			if (this.pitchState.value === -1 && relPitch > this.DOWN_THRESH) {
				this.pitchState.value = 1
			} else if (this.pitchState.value === 1 && relPitch < this.UP_THRESH) {
				this.pitchState.value = -1
			}
		}

		// Yaw
		if (this.yawState.value === 0) {
			if (relYaw < this.LEFT_THRESH) this.yawState.value = -1
			else if (relYaw > this.RIGHT_THRESH) this.yawState.value = 1
		} else {
			if (this.yawState.value === -1 && relYaw > this.RIGHT_THRESH) {
				this.yawState.value = 1
			} else if (this.yawState.value === 1 && relYaw < this.LEFT_THRESH) {
				this.yawState.value = -1
			}
		}

		// Nod Detection Logic
		if (this.options.type === 'YES') {
			// YES: Vertical Nod (Down First)

			if (this.currentStage.value === 'CENTER') {
				if (relPitch > this.DOWN_THRESH) {
					this.currentStage.value = 'WAIT_UP'
				}
			} else if (this.currentStage.value === 'WAIT_UP') {
				if (relPitch < this.UP_THRESH) {
					this.completeNod()
				}
			}

			this.updateProgress(
				relPitch,
				this.DOWN_THRESH,
				this.UP_THRESH,
				this.options.nodsRequired!
			)
		} else {
			// NO: Horizontal Shake

			if (this.currentStage.value === 'CENTER') {
				if (relYaw < this.LEFT_THRESH) {
					this.currentStage.value = 'WAIT_RIGHT'
				} else if (relYaw > this.RIGHT_THRESH) {
					this.currentStage.value = 'WAIT_LEFT'
				}
			} else if (this.currentStage.value === 'WAIT_RIGHT') {
				if (relYaw > this.RIGHT_THRESH) {
					this.completeNod()
				}
			} else if (this.currentStage.value === 'WAIT_LEFT') {
				if (relYaw < this.LEFT_THRESH) {
					this.completeNod()
				}
			}

			// Progress Logic for Yaw
			// Use absolute thresholds logic
			// Left is negative, Right is positive
			// Thresholds: LEFT_THRESH (-0.015), RIGHT_THRESH (0.015)
			// Wait, the generic updateProgress function I'm about to write needs to handle this.

			// For Shake, we sum the absolute travel required.
			// Center -> Side = 0.015
			// Side -> Side = 0.03
			// Total = 0.045 per shake

			// Let's customize updateProgress calculation inline to be safe and clear
			const perShake =
				Math.abs(this.RIGHT_THRESH) + Math.abs(this.LEFT_THRESH - this.RIGHT_THRESH)
			const totalReq = perShake * this.options.nodsRequired!

			let currentAdd = 0
			if (this.currentStage.value === 'CENTER') {
				const val = Math.min(Math.abs(this.RIGHT_THRESH), Math.abs(relYaw))
				currentAdd = val
			} else if (this.currentStage.value === 'WAIT_RIGHT') {
				// From Left (-0.015) to Right (0.015)
				// Current val is relYaw
				// dist = relYaw - Left
				const start = this.LEFT_THRESH
				const end = this.RIGHT_THRESH
				const val = Math.max(start, Math.min(relYaw, end))
				const dist = val - start
				currentAdd = Math.abs(this.LEFT_THRESH) + dist
			} else if (this.currentStage.value === 'WAIT_LEFT') {
				// From Right (0.015) to Left (-0.015)
				// dist = Right - relYaw
				const start = this.RIGHT_THRESH
				const end = this.LEFT_THRESH
				const val = Math.max(end, Math.min(relYaw, start))
				const dist = start - val
				currentAdd = Math.abs(this.RIGHT_THRESH) + dist
			}
			const rawProgress = this.nodsCompleted.value * perShake + currentAdd
			this.totalProgress.value = Math.min(100, (rawProgress / totalReq) * 100)
		}

		this.animationFrameId = requestAnimationFrame(() => this.loop())
	}

	private updateProgress(val: number, thresh1: number, thresh2: number, required: number) {
		// Generic logic for Pitch (Down->Up)
		// thresh1 = Down (0.015), thresh2 = Up (-0.015)
		const perNod = Math.abs(thresh1) + Math.abs(thresh2 - thresh1)
		const totalReq = perNod * required

		let currentAdd = 0
		if (this.currentStage.value === 'CENTER') {
			// Center -> Down
			const v = Math.max(0, Math.min(val, thresh1))
			currentAdd = v
		} else if (this.currentStage.value === 'WAIT_UP') {
			// Down -> Up
			// Dist = Down - Current
			const start = thresh1
			const end = thresh2
			const v = Math.max(end, Math.min(val, start))
			const dist = start - v
			currentAdd = Math.abs(thresh1) + dist
		}

		const rawProgress = this.nodsCompleted.value * perNod + currentAdd
		this.totalProgress.value = Math.min(100, (rawProgress / totalReq) * 100)
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	private completeNod() {
		if (this.isFinished) return

		this.nodsCompleted.value++
		this.currentStage.value = 'CENTER' // Reset cycle

		if (this.nodsCompleted.value >= this.options.nodsRequired!) {
			this.isFinished = true
			if (!this.voicePlaying) {
				this.complete(true)
			}
		}
	}

	get component() {
		return markRaw(NodView)
	}
}
