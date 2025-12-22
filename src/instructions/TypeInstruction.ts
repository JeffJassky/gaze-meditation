import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import TypeView from './views/TypeView.vue'
import { playbackSpeed } from '../state/playback'

interface TypeOptions extends InstructionOptions {
	targetPhrase: string
}

export class TypeInstruction extends Instruction<TypeOptions> {
	public input = ref('')
	public target = ref('')
	public isComplete = ref(false)
	public progress = ref(0) // 0-100%
	// public resolvedTheme!: ThemeConfig; // Removed redundant declaration

	protected context: InstructionContext | null = null
	private handler: ((e: KeyboardEvent) => void) | null = null
	private normalizedTargetPhrase = ''
	private completionTimer: number | null = null

	private normalizeString(str: string): string {
		return str
			.toLowerCase()
			.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
			.replace(/\s{2,}/g, ' ')
	}

	async start(context: InstructionContext) {
		this.context = context
		this.resolvedTheme = context.resolvedTheme // Store the resolved theme
		this.target.value = this.options.targetPhrase
		this.input.value = ''
		this.isComplete.value = false
		this.normalizedTargetPhrase = this.normalizeString(this.options.targetPhrase)
		this.updateProgress()
	}

	stop() {
		if (this.completionTimer) {
			clearTimeout(this.completionTimer)
			this.completionTimer = null
		}
	}

	/**
	 * Called by TypeView when the hidden input changes.
	 * This supports mobile keyboards and ensures consistent behavior.
	 */
	public handleInputUpdate(newValue: string) {
		if (this.isComplete.value) return
		this.input.value = newValue
		this.checkInput()
	}

	private checkInput() {
		const normalizedInput = this.normalizeString(this.input.value)

		// Check for completion based on normalized strings
		if (normalizedInput === this.normalizedTargetPhrase) {
			this.isComplete.value = true
			this.completionTimer = window.setTimeout(() => {
				this.context?.complete(true, { input: this.input.value })
			}, 250 / playbackSpeed.value)
		} else if (
			normalizedInput.length >= this.normalizedTargetPhrase.length &&
			normalizedInput !== this.normalizedTargetPhrase
		) {
			// If they typed beyond the length of the target and it's not a match,
			// still allow them to backspace. UI can indicate incorrectness.
		}
		this.updateProgress() // Update progress after every input change
	}

	private updateProgress() {
		const normalizedInput = this.normalizeString(this.input.value)

		let matchingLength = 0
		for (let i = 0; i < normalizedInput.length; i++) {
			if (
				i < this.normalizedTargetPhrase.length &&
				normalizedInput[i] === this.normalizedTargetPhrase[i]
			) {
				matchingLength++
			} else {
				break
			}
		}

		if (this.normalizedTargetPhrase.length > 0) {
			this.progress.value = (matchingLength / this.normalizedTargetPhrase.length) * 100
		} else {
			this.progress.value = 0
		}
		this.progress.value = Math.min(100, this.progress.value) // Clamp to 100%
	}

	get component() {
		return markRaw(TypeView)
	}
}
