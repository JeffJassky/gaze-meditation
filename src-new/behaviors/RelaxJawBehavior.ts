import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, mouthRegion } from '../services'
import RelaxJawVisualizer from '../components/scene/visualizers/RelaxJawVisualizer.vue'

export interface RelaxJawBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class RelaxJawBehavior extends Behavior<RelaxJawBehaviorOptions> {
	public currentOpenness: Ref<number> = ref(0)
	public isHolding: Ref<boolean> = ref(false)
	public progress: Ref<number> = ref(0)

	private holdStartTime = 0
	
	constructor(options: RelaxJawBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: false,
			threshold: 0.15,
			...options
		})
	}

	public get component() {
		return markRaw(RelaxJawVisualizer)
	}

	public getVisualizerProps() {
		return {
			openness: this.currentOpenness.value,
			threshold: this.options.threshold!,
			isHolding: this.isHolding.value,
			progress: this.progress.value
		}
	}

	protected onStart() {
		this.currentOpenness.value = 0
		this.isHolding.value = false
		this.progress.value = 0

		mouthRegion.addEventListener('update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		mouthRegion.removeEventListener('update', this.handleUpdate)
	}

	private handleUpdate = (e: Event) => {
		const detail = (e as CustomEvent).detail
		// detail: openness, isOpen, baseline
		// We want relative openness (openness - baseline)
		// But baseline adapts. Let's use raw openness if baseline is tricky, 
		// or use the logic from instruction: relativeOpenness = openness - baseline
		
		const rel = Math.max(0, detail.openness - detail.baseline)
		this.currentOpenness.value = rel

		const threshold = this.options.threshold!

		if (rel > threshold) {
			if (!this.isHolding.value) {
				this.isHolding.value = true
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
			this.isHolding.value = false
			this.progress.value = 0
		}
	}
}
