import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import TypeVisualizer from '../components/scene/visualizers/TypeVisualizer.vue'

export interface TypeBehaviorOptions extends BehaviorOptions {
	targetPhrase: string
}

export class TypeBehavior extends Behavior<TypeBehaviorOptions> {
	public currentInput: Ref<string> = ref('')
	public isComplete: Ref<boolean> = ref(false)

	private normalizedTarget = ''

	constructor(options: TypeBehaviorOptions) {
		super({
			duration: Infinity, // Usually untimed until complete
			failOnTimeout: false,
			...options
		})
		this.normalizedTarget = this.normalizeString(options.targetPhrase)
	}

	public get component() {
		return markRaw(TypeVisualizer)
	}

	public getVisualizerProps() {
		return {
			targetText: this.options.targetPhrase,
			currentInput: this.currentInput.value,
			isComplete: this.isComplete.value,
			'onUpdate:input': (val: string) => this.handleInput(val)
		}
	}

	protected onStart() {
		this.currentInput.value = ''
		this.isComplete.value = false
	}

	protected onStop() {
		// Nothing to stop
	}

	public handleInput(val: string) {
		if (this.isComplete.value) return
		this.currentInput.value = val
		this.checkInput()
	}

	private checkInput() {
		const normalizedInput = this.normalizeString(this.currentInput.value)
		
		if (normalizedInput === this.normalizedTarget) {
			this.isComplete.value = true
			setTimeout(() => {
				this.emitSuccess({ input: this.currentInput.value })
			}, 250)
		}
	}

	private normalizeString(str: string): string {
		return str
			.toLowerCase()
			.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
			.replace(/\s{2,}/g, ' ')
	}
}
