import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, headRegion } from '../services'
import NodVisualizer from '../components/scene/visualizers/NodVisualizer.vue'

export interface NodBehaviorOptions extends BehaviorOptions {
	type?: 'YES' | 'NO'
	nodsRequired?: number
}

export class NodBehavior extends Behavior<NodBehaviorOptions> {
	// Visualizer Props
	public nodsCompleted: Ref<number> = ref(0)
	public pitchState: Ref<number> = ref(0)
	public yawState: Ref<number> = ref(0)

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

	public getVisualizerProps() {
		return {
			type: this.options.type || 'YES',
			nodsCompleted: this.nodsCompleted.value,
			nodsRequired: this.options.nodsRequired || 2,
			pitchState: this.pitchState.value,
			yawState: this.yawState.value
		}
	}

	protected onStart(): void {
		this.nodsCompleted.value = 0
		this.pitchState.value = 0
		this.yawState.value = 0

		headRegion.addEventListener('nod', this.handleNod)
		headRegion.addEventListener('pose', this.handlePose)

		camera.start().catch(e => {
			console.warn('[NodBehavior] Camera start failed', e)
			this.emitFail('Camera access failed')
		})
	}

	protected onStop(): void {
		headRegion.removeEventListener('nod', this.handleNod)
		headRegion.removeEventListener('pose', this.handlePose)
	}

	private handleNod = (e: Event) => {
		const detail = (e as CustomEvent).detail
		const requiredType = this.options.type || 'YES'

		if (detail.type === requiredType) {
			this.nodsCompleted.value++
			
			if (this.nodsCompleted.value >= (this.options.nodsRequired || 2)) {
				this.emitSuccess({ nods: this.nodsCompleted.value })
			} else {
				const progress = this.nodsCompleted.value / (this.options.nodsRequired || 2)
				this.emitProgress(progress)
			}
		}
	}

	private handlePose = (e: Event) => {
		const detail = (e as CustomEvent).detail
		if (detail.pitchState !== undefined) this.pitchState.value = detail.pitchState
		if (detail.yawState !== undefined) this.yawState.value = detail.yawState
	}
}