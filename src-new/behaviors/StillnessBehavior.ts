import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { headRegion } from '../services'
import DriftVisualizer from '../components/scene/visualizers/DriftVisualizer.vue'

export interface StillnessBehaviorOptions extends BehaviorOptions {
	tolerance?: number // Drift threshold before failure (default 0.05)
}

export class StillnessBehavior extends Behavior<StillnessBehaviorOptions> {

	public static override readonly requiredDevices = ['camera']



	constructor(options: StillnessBehaviorOptions) {

		super({

			duration: 5000,

			failOnTimeout: true,

			tolerance: 0.05,

			...options

		})

	}



	public get component() {

		return markRaw(DriftVisualizer)

	}



		protected onStart(): void {



			this.updateData({



				driftX: 0,



				driftY: 0,



				driftRatio: 0,



				isStable: true,



				tolerance: this.options.tolerance || 0.05



			})



	



			this.addManagedEventListener(headRegion, 'stillness', this.handleStillness)



			this.addManagedEventListener(headRegion, 'unstable', this.handleUnstable)



		}



	



		protected onStop(): void {



			// Handled by base class



		}



	



	private handleStillness = (e: Event) => {

		const detail = (e as CustomEvent).detail

		const tolerance = this.options.tolerance || 0.05



		this.updateData({

			driftX: detail.x / tolerance,

			driftY: detail.y / tolerance,

			driftRatio: Math.min(1, detail.drift / tolerance),

			isStable: detail.isStable

		})



		this.setConditionMet(detail.isStable)

	}



	private handleUnstable = () => {

		// this.emitFail('Sudden movement detected')

	}

}
