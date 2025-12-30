import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, mouthRegion } from '../services'
import TongueOutVisualizer from '../components/scene/visualizers/TongueOutVisualizer.vue'

export interface TongueOutBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class TongueOutBehavior extends Behavior<TongueOutBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: TongueOutBehaviorOptions) {
		super({
			duration: 2000,
			failOnTimeout: true,
			threshold: 0.15,
			...options
		})
	}

	public get component() {
		return markRaw(TongueOutVisualizer)
	}

	protected onStart() {
		this.addManagedEventListener(mouthRegion, 'update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		// Handled by base class
	}

	private handleUpdate = (e: Event) => {
		const d = (e as CustomEvent).detail
		const score = Math.max(0, 1.0 - d.tongueMetric)
		const isDetected = score > (this.options.threshold || 0.15)

		this.updateData({ score, isDetected })
		this.setConditionMet(isDetected)
	}
}



	