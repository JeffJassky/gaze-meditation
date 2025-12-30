import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, mouthRegion } from '../services'
import RelaxJawVisualizer from '../components/scene/visualizers/RelaxJawVisualizer.vue'

export interface RelaxJawBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class RelaxJawBehavior extends Behavior<RelaxJawBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']
	
	constructor(options: RelaxJawBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: true,
			threshold: 0.15,
			...options
		})
	}

	public get component() {
		return markRaw(RelaxJawVisualizer)
	}

	protected onStart() {
		this.addManagedEventListener(mouthRegion, 'update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop() {
		// Handled by base class
	}

	private handleUpdate = (e: Event) => {
		const detail = (e as CustomEvent).detail
		const rel = Math.max(0, detail.openness - detail.baseline)
		
		this.updateData({ openness: rel, threshold: this.options.threshold! })
		this.setConditionMet(rel > this.options.threshold!)
	}
}

	