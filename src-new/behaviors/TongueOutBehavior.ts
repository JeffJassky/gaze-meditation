import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, mouthRegion } from '../services'
import TongueOutVisualizer from '../components/scene/visualizers/TongueOutVisualizer.vue'

export interface TongueOutBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class TongueOutBehavior extends Behavior<TongueOutBehaviorOptions> {
	public tongueScore: Ref<number> = ref(0)
	public isTongueDetected: Ref<boolean> = ref(false)
	public progress: Ref<number> = ref(0)

	private holdStartTime = 0

	constructor(options: TongueOutBehaviorOptions) {
		super({
			duration: 2000,
			failOnTimeout: false,
			threshold: 0.15,
			...options
		})
	}

	public get component() {
		return markRaw(TongueOutVisualizer)
	}

	public getVisualizerProps() {
		return {
			score: this.tongueScore.value,
			isDetected: this.isTongueDetected.value,
			progress: this.progress.value
		}
	}

	protected onStart() {
		this.tongueScore.value = 0
		this.isTongueDetected.value = false
		this.progress.value = 0

		mouthRegion.addEventListener('update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		mouthRegion.removeEventListener('update', this.handleUpdate)
	}

	private handleUpdate = (e: Event) => {
		const d = (e as CustomEvent).detail
		// detail: tongueMetric
		
		const score = Math.max(0, 1.0 - d.tongueMetric)
		this.tongueScore.value = score
		
		const isDetected = score > (this.options.threshold || 0.15)
		this.isTongueDetected.value = isDetected

		if (isDetected) {
			if (this.holdStartTime === 0) {
				this.holdStartTime = Date.now()
			} else {
				const elapsed = Date.now() - this.holdStartTime
				this.progress.value = Math.min(100, (elapsed / this.options.duration!) * 100)
				this.emitProgress(this.progress.value)

				if (elapsed >= this.options.duration!) {
					this.emitSuccess()
				}
			}
		} else {
			this.holdStartTime = 0
			this.progress.value = 0
		}
	}
}
