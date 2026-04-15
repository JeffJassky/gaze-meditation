import { Behavior, type BehaviorOptions } from './Behavior'
import { BEHAVIOR_DURATION_DEFAULT, MOUTH_THRESHOLD_DEFAULT } from '@shared/constants/behavior'
import { registerBehavior } from './registry'

export interface TongueOutBehaviorOptions extends BehaviorOptions {
	threshold?: number
}

export class TongueOutBehavior extends Behavior<TongueOutBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']
	public static override readonly kind = 'hold' as const

	constructor(options: TongueOutBehaviorOptions) {
		super({
			duration: BEHAVIOR_DURATION_DEFAULT,
			failOnTimeout: true,
			threshold: MOUTH_THRESHOLD_DEFAULT,
			...options
		})
		this.updateData({ score: 0, isDetected: false })
	}

	public get component() {
		return null
	}

	protected onStart() {
		this.addManagedEventListener(this.devices.mouthRegion, 'update', this.handleUpdate)
		this.devices.camera.start().catch(console.error)
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

registerBehavior('tongue:out', TongueOutBehavior)
