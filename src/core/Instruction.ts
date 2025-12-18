import type { ThemeConfig } from '../types'
import { DEFAULT_THEME } from '../theme' // Import DEFAULT_THEME

export interface InstructionContext {
	// Callbacks to report status to the engine
	complete(success: boolean, metrics?: any, result?: any): void

	// Access to shared resources if needed (e.g. DOM container)
	container?: HTMLElement

	// Resolved theme for the current instruction
	resolvedTheme: ThemeConfig
}

export interface InstructionCapabilities {
	faceMesh?: boolean
	audioInput?: boolean
	speech?: boolean // Uses shared SpeechService
}

export interface InstructionOptions {
	id: string
	prompt: string
	duration?: number // ms
	capabilities?: InstructionCapabilities
	onCompleteCallback?: (success: boolean, result?: any) => string | undefined // NEW
	positiveReinforcement?: {
		enabled?: boolean
		message?: string
	}
	negativeReinforcement?: {
		enabled?: boolean
		message?: string
	}
	theme?: ThemeConfig // Optional theme configuration for the instruction
}

export abstract class Instruction<TOptions extends InstructionOptions = InstructionOptions> {
	public options: TOptions
	protected context: InstructionContext | null = null
	public resolvedTheme: ThemeConfig // Public property to hold the resolved theme

	constructor(options: TOptions) {
		this.options = {
			duration: 5000, // Default duration
			...options,
			positiveReinforcement: {
				...{ enabled: true, message: 'REINFORCED' },
				...(options.positiveReinforcement || {})
			},
			negativeReinforcement: {
				...{ enabled: true, message: 'CORRECTION REQUIRED' },
				...(options.negativeReinforcement || {})
			}
		}
		this.resolvedTheme = DEFAULT_THEME // Initialize with default theme
	}

	// Lifecycle: Called when instruction becomes active
	abstract start(context: InstructionContext): void

	// Lifecycle: Called when instruction is stopped/swapped out
	abstract stop(): void

	// Lifecycle: Called every frame (optional)
	// update(time: number, delta: number): void {}

	// Called by the engine after the instruction has completed
	// Can return an instruction ID to jump to, otherwise continues sequentially
	public onComplete(success: boolean, result?: any): string | undefined {
		if (this.options.onCompleteCallback) {
			return this.options.onCompleteCallback(success, result)
		}
		return undefined // Continue sequentially
	}
}
