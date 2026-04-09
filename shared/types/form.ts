import type { SceneConfig } from './session.js'

export enum FormFieldType {
	TEXT = 'text',
	LONG_TEXT = 'longText',
	NUMBER = 'number',
	EMAIL = 'email',
	RADIO = 'radio',
	MULTISELECT = 'multiselect'
}

export interface FormField {
	label: string
	type: FormFieldType
	name: string
	options?: string[]
	required?: boolean
}

export interface FormSceneConfig extends SceneConfig {
	question: string
	fields: FormField[]
	autoContinue?: boolean
}
