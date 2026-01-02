import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion } from '../services'

export interface NodBehaviorOptions extends BehaviorOptions {
	type?: 'YES' | 'NO'
}

export class NodBehavior extends Behavior<NodBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: NodBehaviorOptions) {
		super({
			type: 'YES',
			...options
		})
		// Initialize data for the visualizer to prevent errors
		this.updateData({
			type: this.options.type || 'YES',
			nodsCompleted: 0,
			nodsRequired: 1,
			pitchState: 0,
			yawState: 0
		})
	}

	public get component() {
		return null
	}

	protected onStart() {
		this.addManagedEventListener(headRegion, 'turn', this.handleTurn)
		this.addManagedEventListener(headRegion, 'tilt', this.handleTilt)

		camera.start().catch(e => {
			console.warn('[NodBehavior] Camera start failed', e)
			this.emitFail('Camera access failed')
		})
	}

	protected onStop() {
		// Handled by base class
	}

	private handleTurn = (_e: Event) => {
		// Any turn event resolves a 'NO' shake
		if (this.options.type === 'NO') {
			this.emitSuccess()
		}
	}

	private handleTilt = (_e: Event) => {
		// Any tilt event resolves a 'YES' nod
		// Default to YES if type is not specified
		if (this.options.type === 'YES' || !this.options.type) {
			this.emitSuccess()
		}
	}
}
