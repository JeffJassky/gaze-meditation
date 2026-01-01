import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { headRegion, camera } from '../services'
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

		this.updateData({
			driftX: 0,
			driftY: 0,
			driftRatio: 0,
			isStable: true,
			tolerance: this.options.tolerance || 0.05
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



			camera.start().catch(e => {

				console.warn('[StillnessBehavior] Camera start failed', e)

				this.emitFail('Camera access failed')

			})

		}



		protected onStop(): void {

			// Handled by base class

		}



	private handleStillness = (e: Event) => {
		
		const detail = (e as CustomEvent).detail
		const tolerance = this.options.tolerance || 0.05

		// Use the adaptive drift values from the HeadRegion event
		// Include both Rotation (x/y) and Position (posX/posY)
		// detail.x = relYaw, detail.posX = relX
		// Weight position by 1.5 to match HeadRegion's internal drift logic
		const rawDriftX = detail.x + (detail.posX * 1.5)
		const rawDriftY = detail.y + (detail.posY * 1.5)

		// Negate driftX to mirror movement (Left turn/move = Right dot movement)
		const driftX = -rawDriftX / tolerance
		const driftY = rawDriftY / tolerance
		
		const driftRatio = Math.min(1, Math.hypot(driftX, driftY))
		const isWithinTolerance = driftRatio < 1.0

		this.updateData({
			driftX,
			driftY,
			driftRatio,
			isStable: isWithinTolerance
		})

		this.setConditionMet(isWithinTolerance)

	}



	private handleUnstable = () => {

		// this.emitFail('Sudden movement detected')

	}

}
