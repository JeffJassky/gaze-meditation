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



		private initialYaw: number | null = null
		private initialPitch: number | null = null

		protected onStart(): void {

			// Capture initial position from the global headRegion service
			// We use a small delay or check to ensures we have a valid reading if needed, 
			// but usually the user is already tracked when this starts.
			this.initialYaw = headRegion.yaw
			this.initialPitch = headRegion.pitch

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



	private handleStillness = () => {
		
		const tolerance = this.options.tolerance || 0.05
		
		// If we somehow missed the initial capture (e.g. no face detected yet), capture now
		if (this.initialYaw === null || this.initialPitch === null) {
			this.initialYaw = headRegion.yaw
			this.initialPitch = headRegion.pitch
		}

		// Calculate drift based on absolute position relative to start
		// (ignoring HeadRegion's adaptive centering)
		const currentYaw = headRegion.yaw
		const currentPitch = headRegion.pitch

		const rawDriftX = currentYaw - (this.initialYaw ?? 0)
		const rawDriftY = currentPitch - (this.initialPitch ?? 0)

		const driftX = rawDriftX / tolerance
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
