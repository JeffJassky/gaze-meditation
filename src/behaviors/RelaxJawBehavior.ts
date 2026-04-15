import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import RelaxJawVisualizer from '../components/scene/visualizers/RelaxJawVisualizer.vue'
import { BEHAVIOR_DURATION_DEFAULT, MOUTH_THRESHOLD_DEFAULT } from '@shared/constants/behavior'
import { registerBehavior } from './registry'

export interface RelaxJawBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class RelaxJawBehavior extends Behavior<RelaxJawBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']
	public static override readonly kind = 'hold' as const

	constructor(options: RelaxJawBehaviorOptions) {
		super({
			duration: BEHAVIOR_DURATION_DEFAULT,
			failOnTimeout: true,
			threshold: MOUTH_THRESHOLD_DEFAULT,
			...options
		})
		this.updateData({ openness: 0, threshold: this.options.threshold! })
	}

	public get component() {
		return markRaw(RelaxJawVisualizer)
	}

	protected onStart() {
		this.addManagedEventListener(this.devices.mouthRegion, 'update', this.handleUpdate)
		this.devices.camera.start().catch(console.error)
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

registerBehavior('mouth:relax', RelaxJawBehavior)