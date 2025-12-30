export interface BehaviorOptions {
	duration?: number // Optional duration (ms) for the behavior to be active or held
	failOnTimeout?: boolean // If true (default), triggers emitFail on timeout. If false, triggers emitSuccess (useful for 'hold' behaviors like Stillness)
}

export abstract class Behavior<TOptions extends BehaviorOptions = BehaviorOptions> extends EventTarget {
	public options: TOptions
	public isActive = false

	// Timer State
	protected startTime = 0
	protected timeoutId: any = null
	protected progressIntervalId: any = null

	constructor(options: TOptions) {
		super()
		this.options = {
			failOnTimeout: true, // Default to "Active Task" mode (must complete in time)
			...options
		}
	}

	/**
	 * Returns props for the visualizer component.
	 */
	public abstract getVisualizerProps(): Record<string, any>

	/**
	 * Returns the Vue component for visualization.
	 */
	public abstract get component(): any

	/**
	 * Starts the behavior lifecycle.
	 * Sets isActive to true, starts timers, and calls the implementation-specific onStart().
	 */
	public start(): void {
		if (this.isActive) return
		this.isActive = true
		this.startTime = Date.now()

		this.startTimers()
		this.onStart()
		this.dispatchEvent(new Event('start'))
	}

	/**
	 * Stops the behavior lifecycle.
	 * Sets isActive to false, clears timers, and calls the implementation-specific onStop().
	 */
	public stop(): void {
		if (!this.isActive) return
		this.isActive = false
		this.clearTimers()
		this.onStop()
		this.dispatchEvent(new Event('stop'))
	}

	/**
	 * Implementation specific startup logic (e.g., adding event listeners).
	 */
	protected abstract onStart(): void

	/**
	 * Implementation specific cleanup logic (e.g., removing event listeners).
	 */
	protected abstract onStop(): void

	// --- Timer Logic ---

	private startTimers() {
		if (!this.options.duration) return

		// 1. Completion Timer
		this.timeoutId = setTimeout(() => {
			this.handleTimeout()
		}, this.options.duration)

		// 2. Progress Update (approx 60fps for smooth bars)
		this.progressIntervalId = setInterval(() => {
			if (!this.isActive || !this.options.duration) return
			const elapsed = Date.now() - this.startTime
			const progress = Math.min(1, elapsed / this.options.duration)
			this.dispatchEvent(new CustomEvent('timeProgress', { detail: { progress, elapsed } }))
		}, 16)
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

	// --- Helper Methods for emitting events ---

	/**
	 * Emits a 'progress' event with a value between 0 and 1.
	 * Represents "Task Progress" (e.g. nods completed), distinct from "Time Progress".
	 * @param value The progress value.
	 */
	protected emitProgress(value: number): void {
		this.dispatchEvent(new CustomEvent('progress', { detail: { value } }))
	}

	/**
	 * Emits a 'success' event and automatically stops the behavior.
	 * @param data Optional data to pass with the event.
	 */
	protected emitSuccess(data?: any): void {
		this.dispatchEvent(new CustomEvent('success', { detail: data }))
		this.stop()
	}

	/**
	 * Emits a 'fail' event and automatically stops the behavior.
	 * @param reason Optional reason for the failure.
	 */
	protected emitFail(reason?: any): void {
		this.dispatchEvent(new CustomEvent('fail', { detail: reason }))
		this.stop()
	}
}
