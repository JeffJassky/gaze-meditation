import { Behavior, type BehaviorOptions } from './Behavior'
import { eyesRegion, camera } from '../services'

export interface EyeBehaviorOptions extends BehaviorOptions {
	// ...
}

export class NoBlinkBehavior extends Behavior<EyeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: false, // Reaching the end of duration is success
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(eyesRegion, 'blink', this.handleBlink)
		camera.start().catch(console.error)
		this.setConditionMet(true)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private handleUpdate = (e: Event) => {
		this.updateData({ openness: (e as CustomEvent).detail.open * 100 })
	}

	private handleBlink = () => {
		this.emitFail('Blinked')
	}
}

export class CloseEyesBehavior extends Behavior<EyeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 8000, // Timeout for the action
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(eyesRegion, 'close', this.handleClose)
		camera.start().catch(console.error)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private handleUpdate = (e: Event) => {
		this.updateData({ openness: (e as CustomEvent).detail.open * 100 })
	}

	private handleClose = () => {
		console.log('[CloseEyesBehavior] handleClose triggered')
		this.emitSuccess()
	}
}

export class OpenEyesBehavior extends Behavior<EyeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 8000,
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(eyesRegion, 'open', this.handleOpen)
		camera.start().catch(console.error)
	}

	protected onStop(): void {
		// Handled by base class
	}

	private handleUpdate = (e: Event) => {
		this.updateData({ openness: (e as CustomEvent).detail.open * 100 })
	}

	private handleOpen = () => {
		console.log('[OpenEyesBehavior] handleOpen triggered')
		this.emitSuccess()
	}
}