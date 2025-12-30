import { ref, type Ref, markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { FormFieldType, type FormField } from '@/types'
import FormVisualizer from '../components/scene/visualizers/FormVisualizer.vue'

export interface FormBehaviorOptions extends BehaviorOptions {
	question: string
	fields: FormField[]
	autoContinue?: boolean
}

export class FormBehavior extends Behavior<FormBehaviorOptions> {
	public formData: Record<string, any> = {}

	constructor(options: FormBehaviorOptions) {
		super({
			duration: Infinity,
			failOnTimeout: false,
			...options
		})
		this.initFormData()
	}

	public get component() {
		return markRaw(FormVisualizer)
	}

	public getVisualizerProps() {
		return {
			question: this.options.question,
			fields: this.options.fields,
			initialData: this.formData,
			autoContinue: this.options.autoContinue,
			onSubmit: (data: Record<string, any>) => this.handleSubmit(data)
		}
	}

	private initFormData() {
		this.options.fields.forEach(field => {
			if (field.type === FormFieldType.MULTISELECT) {
				this.formData[field.name] = []
			} else {
				this.formData[field.name] = ''
			}
		})
	}

	protected onStart() {
		// Nothing specific
	}

	protected onStop() {
		// Nothing specific
	}

	public handleSubmit(data: Record<string, any>) {
		this.formData = data
		this.emitSuccess(data)
	}
}
