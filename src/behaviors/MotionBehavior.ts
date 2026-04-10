import { Behavior, type BehaviorOptions } from './Behavior'
import { registerBehavior } from './registry'

export class MotionBehavior extends Behavior<BehaviorOptions> {
	public static override readonly requiredDevices = ['accelerometer']

	constructor(options: BehaviorOptions) {
		super({
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(this.devices.accelerometer, 'move', this.handleMove)
		this.addManagedEventListener(this.devices.accelerometer, 'still', this.handleStill)
		this.addManagedEventListener(this.devices.accelerometer, 'worn', this.handleStill)
		this.devices.accelerometer.start().catch(e => {
			console.warn('[MotionBehavior] Accelerometer start failed', e)
			this.emitFail('Accelerometer access failed')
		})
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
	}
}

registerBehavior('motion:move', MotionBehavior)
