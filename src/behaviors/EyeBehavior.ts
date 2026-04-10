import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import BlinkVisualizer from '../components/scene/visualizers/BlinkVisualizer.vue'
import { BEHAVIOR_DURATION_DEFAULT, BEHAVIOR_DURATION_LONG } from '@shared/constants/behavior'
import { registerBehavior } from './registry'

export interface EyeBehaviorOptions extends BehaviorOptions {
	// ...
}

export class NoBlinkBehavior extends Behavior<EyeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']
	public static override readonly kind = 'hold' as const

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: BEHAVIOR_DURATION_DEFAULT,
			failOnTimeout: false, // Reaching the end of duration is success
			...options
		})
		this.updateData({ openness: 100 })
	}

	public get component() {
		return markRaw(BlinkVisualizer)
	}

	protected onStart(): void {
		this.addManagedEventListener(this.devices.eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(this.devices.eyesRegion, 'blink', this.handleBlink)
		this.devices.camera.start().catch(console.error)
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
			duration: BEHAVIOR_DURATION_LONG,
			failOnTimeout: true,
			...options
		})
		this.updateData({ openness: 100 })
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(this.devices.eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(this.devices.eyesRegion, 'close', this.handleClose)
		this.devices.camera.start().catch(console.error)
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
			duration: BEHAVIOR_DURATION_LONG,
			failOnTimeout: true,
			...options
		})
		this.updateData({ openness: 0 })
	}

	public get component() {
		return null
	}

	protected onStart(): void {
		this.addManagedEventListener(this.devices.eyesRegion, 'update', this.handleUpdate)
		this.addManagedEventListener(this.devices.eyesRegion, 'open', this.handleOpen)
		this.devices.camera.start().catch(console.error)
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

registerBehavior('eyes:no-blink', NoBlinkBehavior)
registerBehavior('eyes:close', CloseEyesBehavior)
registerBehavior('eyes:open', OpenEyesBehavior)
