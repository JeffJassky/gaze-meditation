import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion, eyesRegion } from '../services'
import DirectionalGazeVisualizer from '../components/scene/visualizers/DirectionalGazeVisualizer.vue'

export interface DirectionalGazeBehaviorOptions extends BehaviorOptions {
	direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
	threshold?: number
}

export class DirectionalGazeBehavior extends Behavior<DirectionalGazeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	private correctFrames = 0
	private totalFrames = 0
	
	private centerYaw = 0
	private centerPitch = 0
	private isInitialized = false

	private currentYaw = 0
	private currentPitch = 0

	constructor(options: DirectionalGazeBehaviorOptions) {
		super({
			duration: 5000,
			threshold: 0.02,
			...options
		})
	}

	public get component() {
		return markRaw(DirectionalGazeVisualizer)
	}

	protected onStart() {
		this.updateData({
			direction: this.options.direction,
			isCorrect: false,
			score: 0
		})

		this.correctFrames = 0
		this.totalFrames = 0
		this.isInitialized = false
		this.startTime = Date.now()

		this.addManagedEventListener(headRegion, 'pose', this.handleHeadPose)
		this.addManagedEventListener(eyesRegion, 'update', this.handleEyesUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		// Handled by base class
	}

	private handleHeadPose = (e: Event) => {
		const d = (e as CustomEvent).detail
		this.currentYaw = d.yaw
		this.currentPitch = d.pitch
	}

	private handleEyesUpdate = () => {
		if (!this.isActive) return

		if (!this.isInitialized) {
			if (this.currentYaw !== 0 || this.currentPitch !== 0) {
				this.centerYaw = this.currentYaw
				this.centerPitch = this.currentPitch
				this.isInitialized = true
			}
			return
		}

		const relYaw = this.currentYaw - this.centerYaw
		const relPitch = this.currentPitch - this.centerPitch

		this.totalFrames++
		const isCorrect = this.checkDirection(relYaw, relPitch)

		if (isCorrect) {
			this.correctFrames++
		} else {
			// Adapt baseline slowly when not correct
			const alpha = 0.02
			this.centerYaw = this.lerp(this.centerYaw, this.currentYaw, alpha)
			this.centerPitch = this.lerp(this.centerPitch, this.currentPitch, alpha)
		}

		const score = (this.correctFrames / this.totalFrames) * 100
		
		this.updateData({ isCorrect, score })
		this.emitProgress(score / 100)
	}

	private checkDirection(relYaw: number, relPitch: number): boolean {
		const thresh = this.options.threshold || 0.02
		switch (this.options.direction) {
			case 'LEFT': return relYaw < -thresh
			case 'RIGHT': return relYaw > thresh
			case 'UP': return relPitch < -thresh
			case 'DOWN': return relPitch > thresh
			default: return false
		}
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	// Override handleTimeout to succeed based on score
	protected handleTimeout() {
		const score = (this.correctFrames / this.totalFrames) * 100
		if (score >= 50) {
			this.emitSuccess({ score })
		} else {
			this.emitFail({ score, reason: 'Insufficient score' })
		}
	}
}
