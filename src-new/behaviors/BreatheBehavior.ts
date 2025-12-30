import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { camera, breathRegion } from '../services'
import BreathingVisualizer from '../components/scene/visualizers/BreathingVisualizer.vue'

export interface BreatheBehaviorOptions extends BehaviorOptions {
	// Add specific options if needed
}

export class BreatheBehavior extends Behavior<BreatheBehaviorOptions> {
	// Visualizer Props
	public signal: Ref<number> = ref(0)
	public velocity: Ref<number> = ref(0)
	public respirationRate: Ref<number> = ref(0)
	public state: Ref<string> = ref('CALIBRATING')

	private lastSignal = 0

	constructor(options: BreatheBehaviorOptions) {
		super({
			duration: 30000,
			failOnTimeout: false, // Breathing for the duration is success
			...options
		})
	}

	public get component() {
		return markRaw(BreathingVisualizer)
	}

	public getVisualizerProps() {
		return {
			signal: this.signal.value,
			velocity: this.velocity.value,
			respirationRate: this.respirationRate.value,
			state: this.state.value
		}
	}

	protected onStart(): void {
		this.signal.value = 0
		this.velocity.value = 0
		this.respirationRate.value = 0
		this.state.value = 'CALIBRATING'

		breathRegion.addEventListener('update', this.handleUpdate)
		camera.start().catch(console.error)
	}

	protected onStop(): void {
		breathRegion.removeEventListener('update', this.handleUpdate)
	}

	private handleUpdate = (e: Event) => {
		const detail = (e as CustomEvent).detail
		
		this.signal.value = detail.uiSignal
		this.velocity.value = detail.uiSignal - this.lastSignal
		this.respirationRate.value = detail.rate
		this.state.value = detail.state

		this.lastSignal = detail.uiSignal
	}
}