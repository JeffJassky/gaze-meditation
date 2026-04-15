import { Behavior, type BehaviorOptions } from './Behavior'
import { registerBehavior } from './registry'

export interface DirectionalGazeBehaviorOptions extends BehaviorOptions {
	direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
}

export class DirectionalGazeBehavior extends Behavior<DirectionalGazeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: DirectionalGazeBehaviorOptions) {
		super({
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart() {
		this.addManagedEventListener(this.devices.headRegion, 'turn', this.handleTurn)
		this.addManagedEventListener(this.devices.headRegion, 'tilt', this.handleTilt)
		this.devices.camera.start().catch(console.error)
	}

	protected onStop() {
		// Handled by base class
	}

	private handleTurn = (e: Event) => {
		const d = (e as CustomEvent).detail
		if (this.options.direction === 'LEFT' && d.direction === 'LEFT') {
			this.emitSuccess()
		} else if (this.options.direction === 'RIGHT' && d.direction === 'RIGHT') {
			this.emitSuccess()
		}
	}

	private handleTilt = (e: Event) => {
		const d = (e as CustomEvent).detail
		if (this.options.direction === 'UP' && d.direction === 'UP') {
			this.emitSuccess()
		} else if (this.options.direction === 'DOWN' && d.direction === 'DOWN') {
			this.emitSuccess()
		}
	}
}

export class LeftGazeBehavior extends DirectionalGazeBehavior {
	constructor(options: Omit<DirectionalGazeBehaviorOptions, 'direction'>) {
		super({ ...options, direction: 'LEFT' })
	}
}

export class RightGazeBehavior extends DirectionalGazeBehavior {
	constructor(options: Omit<DirectionalGazeBehaviorOptions, 'direction'>) {
		super({ ...options, direction: 'RIGHT' })
	}
}

export class UpGazeBehavior extends DirectionalGazeBehavior {
	constructor(options: Omit<DirectionalGazeBehaviorOptions, 'direction'>) {
		super({ ...options, direction: 'UP' })
	}
}

export class DownGazeBehavior extends DirectionalGazeBehavior {
	constructor(options: Omit<DirectionalGazeBehaviorOptions, 'direction'>) {
		super({ ...options, direction: 'DOWN' })
	}
}

registerBehavior('head:left', LeftGazeBehavior)
registerBehavior('head:right', RightGazeBehavior)
registerBehavior('head:up', UpGazeBehavior)
registerBehavior('head:down', DownGazeBehavior)