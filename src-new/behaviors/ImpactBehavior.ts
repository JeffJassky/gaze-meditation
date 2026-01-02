import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { accelerometer } from '../services'
import ImpactVisualizer from '../components/scene/visualizers/ImpactVisualizer.vue'

export interface ImpactBehaviorOptions extends BehaviorOptions {
	impacts?: number
	display?: 'none' | 'progress' | 'dots'
}

export class ImpactBehavior extends Behavior<ImpactBehaviorOptions> {
	public static override readonly requiredDevices = ['accelerometer']

	constructor(options: ImpactBehaviorOptions) {
		super({
			impacts: 1,
			display: 'progress',
			...options
		})

		this.updateData({
			impactsCount: 0,
			impactsRequired: this.options.impacts || 1,
			display: this.options.display || 'progress'
		})
	}

	public get component() {
		return markRaw(ImpactVisualizer)
	}

	protected onStart(): void {
		this.addManagedEventListener(accelerometer, 'impact', this.handleImpact)
		accelerometer.start().catch(console.error)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private handleImpact = () => {
		const currentCount = (this.data.impactsCount || 0) + 1
		const required = this.options.impacts || 1

		this.updateData({ impactsCount: currentCount })
		this.emitProgress(Math.min(1, currentCount / required))

		if (currentCount >= required) {
			this.emitSuccess({ count: currentCount })
		}
	}
}
