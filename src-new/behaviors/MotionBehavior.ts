import { Behavior, type BehaviorOptions } from './Behavior'
import { accelerometer } from '../services'

export class MotionBehavior extends Behavior<BehaviorOptions> {
	public static override readonly requiredDevices = ['accelerometer']

	constructor(options: BehaviorOptions) {
		super({
			duration: 10000, // Default timeout for the action
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(accelerometer, 'move', this.handleMove)
		this.addManagedEventListener(accelerometer, 'still', this.handleStill)
		this.addManagedEventListener(accelerometer, 'worn', this.handleStill)
		accelerometer.start().catch(console.error)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private handleMove = () => {
		this.setConditionMet(true)
		if (!this.options.duration) {
			this.emitSuccess()
		}
	}

	private handleStill = () => {
		this.setConditionMet(false)
		this.emitFail('Device is still')
	}
}
