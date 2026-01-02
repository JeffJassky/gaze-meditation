import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion } from '../services'

export interface DirectionalGazeBehaviorOptions extends BehaviorOptions {
	direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
}

export class DirectionalGazeBehavior extends Behavior<DirectionalGazeBehaviorOptions> {
	public static override readonly requiredDevices = ['camera']

	constructor(options: DirectionalGazeBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return null
	}

	protected onStart() {
		this.addManagedEventListener(headRegion, 'turn', this.handleTurn)
		this.addManagedEventListener(headRegion, 'tilt', this.handleTilt)
		camera.start().catch(console.error)
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