import { markRaw } from 'vue'
import { Behavior, type BehaviorOptions } from './Behavior'
import { FormFieldType, type FormField } from '@/types'
import FormVisualizer from '../components/scene/visualizers/FormVisualizer.vue'

export interface FormBehaviorOptions extends BehaviorOptions {
	question: string
	fields: FormField[]
	autoContinue?: boolean
}

export class FormBehavior extends Behavior<FormBehaviorOptions> {
	constructor(options: FormBehaviorOptions) {
		super({
			duration: Infinity,
			failOnTimeout: false,
			...options
		})
		this.updateData({
			question: this.options.question,
			fields: this.options.fields,
			initialData: this.initFormData(),
			autoContinue: this.options.autoContinue,
			onSubmit: (data: Record<string, any>) => this.handleSubmit(data)
		})
	}

	public get component() {
		return markRaw(FormVisualizer)
	}

	private initFormData() {
		const formData: Record<string, any> = {}
		this.options.fields.forEach(field => {
			if (field.type === FormFieldType.MULTISELECT) {
				formData[field.name] = []
			} else {
				formData[field.name] = ''
			}
		})
		return formData
	}

	protected onStart() {
		// Data already initialized in constructor
	}

	protected onStop() {
		// Nothing specific
	}

	public handleSubmit(data: Record<string, any>) {
		this.emitSuccess(data)
	}
}
