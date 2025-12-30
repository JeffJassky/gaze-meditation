import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, breathRegion } from '../services'
import BreathingVisualizer from '../components/scene/visualizers/BreathingVisualizer.vue'

export interface BreatheBehaviorOptions extends BehaviorOptions {
	// Add specific options if needed
}

export class BreatheBehavior extends Behavior<BreatheBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: BreatheBehaviorOptions) {
		super({
			duration: 30000,
			failOnTimeout: true, // Breathing for the duration is success
			...options
		})
	}

	public get component() {
		return markRaw(BreathingVisualizer)
	}

	protected onStart(): void {
		this.updateData({
			signal: 0,
			velocity: 0,
			respirationRate: 0,
			state: 'CALIBRATING'
		})

		this.addManagedEventListener(breathRegion, 'update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private lastSignal = 0

	private handleUpdate = (e: Event) => {
		const detail = (e as CustomEvent).detail
		const velocity = detail.uiSignal - this.lastSignal
		this.lastSignal = detail.uiSignal

		this.updateData({
			signal: detail.uiSignal,
			velocity,
			respirationRate: detail.rate,
			state: detail.state
		})

		this.setConditionMet(detail.state !== 'CALIBRATING')
	}
}
