import { ref, reactive, type Ref } from 'vue'

export interface BehaviorOptions {
	duration?: number // Optional duration (ms) for the behavior to be active or held
	failOnTimeout?: boolean // If true (default), triggers emitFail on timeout. If false, triggers emitSuccess (useful for 'hold' behaviors like Stillness)
	isExplicitDuration?: boolean // If true, indicates the duration was explicitly provided by the user/config
	failBehavior?: 'pause' | 'reset' // How to handle progress when behavior is interrupted. Defaults to 'pause'.
}

export abstract class Behavior<TOptions extends BehaviorOptions = BehaviorOptions> extends EventTarget {
	public static readonly requiredDevices: string[] = []
	public options: TOptions
	public isActive = false
	public hasExplicitDuration = false
	public accumulatedTime = 0

	// Reactive State for UI
	public readonly progress: Ref<number> = ref(0)
	public readonly isConditionMet: Ref<boolean> = ref(false)
	protected readonly data = reactive<Record<string, any>>({})

	protected isProgressActive = false
	private lastTick = 0

	// Event tracking for cleanup
	private managedListeners: Array<{
		target: EventTarget | { stop: () => void } | (() => void)
		type?: string
		callback?: (e: any) => void
	}> = []

	// Timer State
	protected startTime = 0
	protected timeoutId: any = null
	protected progressIntervalId: any = null

	constructor(options: TOptions) {
		super()
		this.hasExplicitDuration = options.isExplicitDuration === true
		this.options = {
			failOnTimeout: true, // Default to "Active Task" mode (must complete in time)
			failBehavior: 'pause',
			...options
		}
	}

	/**
	 * Returns props for the visualizer component.
	 */
	public getVisualizerProps(): Record<string, any> {
		return {
			...this.data,
			progress: this.progress.value * 100, // Visualizers usually expect 0-100
			isConditionMet: this.isConditionMet.value,
			isHolding: this.isConditionMet.value
		}
	}

	/**
	 * Returns the Vue component for visualization.
	 */	public abstract get component(): any

	/**
	 * Registers an event listener or cleanup function that will be automatically processed when the behavior stops.
	 */
	protected addManagedEventListener(target: EventTarget | { stop: () => void } | (() => void), type?: string, callback?: (e: any) => void) {
		if (target instanceof EventTarget && type && callback) {
			target.addEventListener(type, callback)
			this.managedListeners.push({ target, type, callback })
		} else {
			this.managedListeners.push({ target })
		}
	}

	private removeAllManagedEventListeners() {
		this.managedListeners.forEach(({ target, type, callback }) => {
			if (target instanceof EventTarget && type && callback) {
				target.removeEventListener(type, callback)
			} else if (typeof target === 'function') {
				target()
			} else if (target && typeof (target as any).stop === 'function') {
				(target as any).stop()
			}
		})
		this.managedListeners = []
	}

	/**
	 * Starts the behavior lifecycle.
	 * Sets isActive to true, starts timers, and calls the implementation-specific onStart().
	 */
	public start(): void {
		if (this.isActive) return
		console.log(`[Behavior] ${this.constructor.name} starting`, this.options)
		this.isActive = true
		this.startTime = Date.now()

		this.startTimers()
		this.onStart()
		this.dispatchEvent(new Event('start'))
	}

	/**
	 * Stops the behavior lifecycle.
	 * Sets isActive to false, clears timers, and calls the implementation-specific onStop().
	 */	public stop(): void {
		if (!this.isActive) return
		console.log(`[Behavior] ${this.constructor.name} stopping`)
		this.isActive = false
		this.clearTimers()
		this.removeAllManagedEventListeners()
		this.onStop()
		this.dispatchEvent(new Event('stop'))
	}

	/**
	 * Implementation specific startup logic (e.g., adding event listeners).
	 */	protected abstract onStart(): void

	/**
	 * Implementation specific cleanup logic (e.g., removing event listeners).
	 */	protected abstract onStop(): void

	// --- Timer Logic ---

	private startTimers() {
		this.lastTick = Date.now()

		// 1. Completion Timer
		// Only start if NOT using explicit duration (which manages its own progress/success)
		if (this.options.duration && !this.hasExplicitDuration) {
			this.timeoutId = setTimeout(() => {
				this.handleTimeout()
			}, this.options.duration)
		}

		// 2. Progress Update (approx 60fps for smooth bars)
		this.progressIntervalId = setInterval(() => {
			if (!this.isActive) return

			const now = Date.now()
			const delta = now - this.lastTick
			this.lastTick = now

			// Built-in Time-based Progress Accumulation
			if (this.isProgressActive && this.options.duration) {
				this.accumulatedTime += delta
				const progress = Math.min(1, this.accumulatedTime / this.options.duration)
				this.emitProgress(progress)

				if (this.accumulatedTime >= this.options.duration) {
					this.emitSuccess({ reason: 'Target duration reached' })
				}
			}

			const elapsed = now - this.startTime
			this.dispatchEvent(new CustomEvent('timeProgress', { detail: { progress: 0, elapsed } }))
		}, 16)
	}

	protected resumeProgress() {
		if (this.isProgressActive) return
		console.log(`[Behavior] ${this.constructor.name} progress resumed`)
		this.isProgressActive = true
		this.lastTick = Date.now()
	}

	protected pauseProgress() {
		if (!this.isProgressActive) return
		console.log(`[Behavior] ${this.constructor.name} progress paused`)
		this.isProgressActive = false

		if (this.options.failBehavior === 'reset') {
			this.resetProgress()
		}
	}

	protected resetProgress() {
		console.log(`[Behavior] ${this.constructor.name} progress reset`)
		this.accumulatedTime = 0
		this.emitProgress(0)
	}

	private clearTimers() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId)
			this.timeoutId = null
		}
		if (this.progressIntervalId) {
			clearInterval(this.progressIntervalId)
			this.progressIntervalId = null
		}
	}

	protected handleTimeout() {
		if (this.options.failOnTimeout) {
			this.emitFail('Timeout')
		} else {
			this.emitSuccess({ reason: 'Timeout (Duration Complete)' })
		}
	}

	private lastProgressValue = 0

	// --- Helper Methods for emitting events ---

	/**
	 * Signals that the behavior's target condition is currently being met (or not).
	 * Automatically manages progress accumulation based on this state.
	 */
	protected setConditionMet(met: boolean) {
		if (this.isConditionMet.value === met) return
		this.isConditionMet.value = met

		if (met) {
			this.resumeProgress()
		} else {
			this.pauseProgress()
		}
	}

	/**
	 * Updates custom data that will be passed as props to the visualizer.
	 */
	protected updateData(newData: Record<string, any>) {
		Object.assign(this.data, newData)
	}

	/**
	 * Emits a 'progress' event with a value between 0 and 1.
	 * Represents "Task Progress" (e.g. nods completed), distinct from "Time Progress".
	 * @param value The progress value.
	 */
	protected emitProgress(value: number): void {
		if (value === this.lastProgressValue) return
		this.lastProgressValue = value
		this.progress.value = value
		this.dispatchEvent(new CustomEvent('progress', { detail: { value } }))
	}

	/**
	 * Emits a 'success' event and automatically stops the behavior.
	 * @param data Optional data to pass with the event.
	 */
	protected emitSuccess(data?: any): void {
		console.log(`[Behavior] ${this.constructor.name} success`, data)
		this.stop()
		this.dispatchEvent(new CustomEvent('success', { detail: data }))
	}

	/**
	 * Emits a 'fail' event and automatically stops the behavior.
	 * @param reason Optional reason for the failure.
	 */
	protected emitFail(reason?: any): void {
		console.log(`[Behavior] ${this.constructor.name} fail:`, reason)
		this.stop()
		this.dispatchEvent(new CustomEvent('fail', { detail: reason }))
	}
}
