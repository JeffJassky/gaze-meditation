import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion, eyesRegion } from '../services'
import DirectionalGazeVisualizer from '../components/scene/visualizers/DirectionalGazeVisualizer.vue'

export interface DirectionalGazeBehaviorOptions extends BehaviorOptions {
	direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
	threshold?: number
}

export class DirectionalGazeBehavior extends Behavior<DirectionalGazeBehaviorOptions> {
	public isCorrect: Ref<boolean> = ref(false)
	public score: Ref<number> = ref(0) // percentage of correct frames

	private startTime = 0
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

	public getVisualizerProps() {
		return {
			direction: this.options.direction,
			isCorrect: this.isCorrect.value,
			score: this.score.value
		}
	}

	protected onStart() {
		this.isCorrect.value = false
		this.score.value = 0
		this.correctFrames = 0
		this.totalFrames = 0
		this.isInitialized = false
		this.startTime = Date.now()

		headRegion.addEventListener('pose', this.handleHeadPose)
		eyesRegion.addEventListener('update', this.handleEyesUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		headRegion.removeEventListener('pose', this.handleHeadPose)
		eyesRegion.removeEventListener('update', this.handleEyesUpdate)
	}

	private handleHeadPose = (e: Event) => {
		const d = (e as CustomEvent).detail
		this.currentYaw = d.yaw
		this.currentPitch = d.pitch
	}

	private handleEyesUpdate = (e: Event) => {
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
		const correct = this.checkDirection(relYaw, relPitch)
		this.isCorrect.value = correct

		if (correct) {
			this.correctFrames++
		} else {
			// Adapt baseline slowly when not correct
			const alpha = 0.02
			this.centerYaw = this.lerp(this.centerYaw, this.currentYaw, alpha)
			this.centerPitch = this.lerp(this.centerPitch, this.currentPitch, alpha)
		}

		this.score.value = (this.correctFrames / this.totalFrames) * 100
		this.emitProgress(this.score.value / 100)
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
		if (this.score.value >= 50) {
			this.emitSuccess({ score: this.score.value })
		} else {
			this.emitFail({ score: this.score.value, reason: 'Insufficient score' })
		}
	}
}
