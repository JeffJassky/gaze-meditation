import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { eyesRegion } from '../services'
import EyeGraphicElement from '../components/scene/visualizers/EyeGraphicElement.vue'

export interface EyeBehaviorOptions extends BehaviorOptions {
	// ...
}

export class NoBlinkBehavior extends Behavior<EyeBehaviorOptions> {
	public openness: Ref<number> = ref(1)

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 5000,
			failOnTimeout: false, // Reaching the end of duration is success
			...options
		})
	}

	public get component() {
		return markRaw(EyeGraphicElement)
	}

	public getVisualizerProps() {
		return {
			openness: this.openness.value * 100
		}
	}

	protected onStart(): void {
		eyesRegion.addEventListener('update', this.handleUpdate)
		eyesRegion.addEventListener('blink', this.handleBlink)
	}

	protected onStop(): void {
		eyesRegion.removeEventListener('update', this.handleUpdate)
		eyesRegion.removeEventListener('blink', this.handleBlink)
	}

	private handleUpdate = (e: Event) => {
		this.openness.value = (e as CustomEvent).detail.open
	}

	private handleBlink = () => {
		this.emitFail('Blinked')
	}
}

export class CloseEyesBehavior extends Behavior<EyeBehaviorOptions> {
	public openness: Ref<number> = ref(1)

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 8000, // Timeout for the action
			failOnTimeout: true, 
			...options
		})
	}

	public get component() {
		return markRaw(EyeGraphicElement)
	}

	public getVisualizerProps() {
		return {
			openness: this.openness.value * 100
		}
	}

	protected onStart(): void {
		eyesRegion.addEventListener('update', this.handleUpdate)
		eyesRegion.addEventListener('close', this.handleClose)
	}

	protected onStop(): void {
		eyesRegion.removeEventListener('update', this.handleUpdate)
		eyesRegion.removeEventListener('close', this.handleClose)
	}

	private handleUpdate = (e: Event) => {
		this.openness.value = (e as CustomEvent).detail.open
	}

	private handleClose = () => {
		this.emitSuccess()
	}
}

export class OpenEyesBehavior extends Behavior<EyeBehaviorOptions> {
	public openness: Ref<number> = ref(0)

	constructor(options: EyeBehaviorOptions) {
		super({
			duration: 8000,
			failOnTimeout: true,
			...options
		})
	}

	public get component() {
		return markRaw(EyeGraphicElement)
	}

	public getVisualizerProps() {
		return {
			openness: this.openness.value * 100
		}
	}

	protected onStart(): void {
		eyesRegion.addEventListener('update', this.handleUpdate)
		eyesRegion.addEventListener('open', this.handleOpen)
	}

	protected onStop(): void {
		eyesRegion.removeEventListener('update', this.handleUpdate)
		eyesRegion.removeEventListener('open', this.handleOpen)
	}

	private handleUpdate = (e: Event) => {
		this.openness.value = (e as CustomEvent).detail.open
	}

	private handleOpen = () => {
		this.emitSuccess()
	}
}
