import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion } from '../services'
import NodVisualizer from '../components/scene/visualizers/NodVisualizer.vue'

export interface NodBehaviorOptions extends BehaviorOptions {
	type?: 'YES' | 'NO'
	nodsRequired?: number
}

export class NodBehavior extends Behavior<NodBehaviorOptions> {

	public static override readonly requiredDevices = ['camera']



	private nodsCompleted = 0



	constructor(options: NodBehaviorOptions) {

		super({

			type: 'YES',

			nodsRequired: 2,

			...options

		})

	}



	public get component() {

		return markRaw(NodVisualizer)

	}



	protected onStart(): void {

		this.nodsCompleted = 0

		this.updateData({

			type: this.options.type || 'YES',

			nodsCompleted: 0,

			nodsRequired: this.options.nodsRequired || 2,

			pitchState: 0,

			yawState: 0

		})



		this.addManagedEventListener(headRegion, 'nod', this.handleNod)

		this.addManagedEventListener(headRegion, 'pose', this.handlePose)



		camera.start().catch(e => {

			console.warn('[NodBehavior] Camera start failed', e)

			this.emitFail('Camera access failed')

		})

	}



	protected onStop(): void {

		// Handled by base class

	}



	private handleNod = (e: Event) => {

		const detail = (e as CustomEvent).detail

		const requiredType = this.options.type || 'YES'



		if (detail.type === requiredType) {

			this.nodsCompleted++

			const required = this.options.nodsRequired || 2

			

			this.updateData({ nodsCompleted: this.nodsCompleted })



			if (this.nodsCompleted >= required) {

				this.emitSuccess({ nods: this.nodsCompleted })

			} else {

				this.emitProgress(this.nodsCompleted / required)

			}

		}

	}



	private handlePose = (e: Event) => {

		const detail = (e as CustomEvent).detail

		this.updateData({

			pitchState: detail.pitchState ?? 0,

			yawState: detail.yawState ?? 0

		})

	}

}
