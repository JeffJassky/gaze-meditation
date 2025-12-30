import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { headRegion } from '../services'
import DriftVisualizer from '../components/scene/visualizers/DriftVisualizer.vue'

export interface StillnessBehaviorOptions extends BehaviorOptions {
	tolerance?: number // Drift threshold before failure (default 0.05)
}

export class StillnessBehavior extends Behavior<StillnessBehaviorOptions> {
	// Visualizer Props
	public driftX: Ref<number> = ref(0)
	public driftY: Ref<number> = ref(0)
	public driftRatio: Ref<number> = ref(0)
	public isStable: Ref<boolean> = ref(true)

	constructor(options: StillnessBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: false, // Success if we reach the end of duration
			tolerance: 0.05,
			...options
		})
	}

	public get component() {
		return markRaw(DriftVisualizer)
	}

	public getVisualizerProps() {
		return {
			driftX: this.driftX.value,
			driftY: this.driftY.value,
			driftRatio: this.driftRatio.value,
			tolerance: this.options.tolerance || 0.05
		}
	}

	protected onStart(): void {
		this.driftX.value = 0
		this.driftY.value = 0
		this.driftRatio.value = 0
		this.isStable.value = true

		headRegion.addEventListener('stillness', this.handleStillness)
		headRegion.addEventListener('unstable', this.handleUnstable)
	}

	protected onStop(): void {
		headRegion.removeEventListener('stillness', this.handleStillness)
		headRegion.removeEventListener('unstable', this.handleUnstable)
	}

	private handleStillness = (e: Event) => {
		const detail = (e as CustomEvent).detail
		const tolerance = this.options.tolerance || 0.05

		this.driftX.value = detail.x / tolerance
		this.driftY.value = detail.y / tolerance
		this.driftRatio.value = Math.min(1, detail.drift / tolerance)
		this.isStable.value = detail.isStable

		if (detail.drift > tolerance) {
			this.emitFail('Moved too much')
		}
	}

	private handleUnstable = () => {
		// this.emitFail('Sudden movement detected')
	}
}