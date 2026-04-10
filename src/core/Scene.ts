import { markRaw, ref, type Ref } from 'vue'
import { type SceneConfig, type BehaviorSuggestion } from '@/types'
import { type SceneBlock, type SceneRegion } from '@/api/sessions'
// Side-effect import: each behavior module calls registerBehavior() at load
// time, populating the registry. Importing the barrel ensures every behavior
// is registered before Scene tries to look anything up.
import { Behavior } from '@/behaviors'
import '@/behaviors'
import { getBehaviorClass } from '@/behaviors/registry'
import type { DeviceContext } from '@/behaviors/DeviceContext'
import SceneView from '@/components/scene/Scene.vue'
import { voiceService } from '@/services/voiceService'
import { playbackSpeed } from '@/state/playback'
import { calculateDuration } from '@/utils/time'

export interface SceneContext {
	complete(success: boolean, metrics?: any, result?: any): void
	programId: string
	previousVoiceText?: string
	/** Master audio asset key — set when voiceStructure is 'session'. */
	masterAudioKey?: string
}

/**
 * Explicit scene lifecycle states.
 *
 *   IDLE           → scene constructed, not yet started
 *   MEDIA_PLAYING  → voice / text sequences are running, behaviors may be starting
 *   BEHAVIORS_ACTIVE → media finished, waiting for behaviors to resolve
 *   COMPLETE       → scene has emitted its completion callback
 *   STOPPED        → scene was externally stopped (cleanup done)
 */
const enum ScenePhase {
	IDLE,
	MEDIA_PLAYING,
	BEHAVIORS_ACTIVE,
	COMPLETE,
	STOPPED,
}

export class Scene {
	public id: string
	public config: SceneConfig
	/** Time region in the session's master audio (session-level voice mode). */
	public region?: SceneRegion
	public behaviors: Behavior[] = []
	public progress: Ref<number> = ref(0)

	// Reactive properties for the view
	public activeText = ref('')
	public isTextVisible = ref(false)

	protected context: SceneContext | null = null
	private devices: DeviceContext | null = null

	private progressIntervalId: any = null
	private activeTimer: number | null = null
	private startTime = 0

	private phase: ScenePhase = ScenePhase.IDLE
	private pendingBehaviorResult: any = null

	constructor(block: SceneBlock, options: { skipBehaviors?: boolean; devices?: DeviceContext } = {}) {
		this.config = block.config ?? {}
		this.id = block.id
		this.region = block.region
		this.devices = options.devices ?? null
		if (!options.skipBehaviors) {
			this.initBehaviors()
		}
	}

	/** Whether the scene is currently running (media or behaviors). */
	get isActive() {
		return this.phase === ScenePhase.MEDIA_PLAYING || this.phase === ScenePhase.BEHAVIORS_ACTIVE
	}

	// Alias for compatibility with code expecting Instruction.options
	get options() {
		return this.config
	}

	// ---------------------------------------------------------------------------
	// Behavior setup
	// ---------------------------------------------------------------------------

	private initBehaviors() {
		const suggestions = this.config.behavior?.suggestions || []
		for (const suggestion of suggestions) {
			const behavior = this.createBehavior(suggestion)
			if (behavior) {
				behavior.addEventListener('success', (e: any) =>
					this.onBehaviorSuccess(behavior, e.detail),
				)
				behavior.addEventListener('fail', (e: any) =>
					this.onBehaviorFail(behavior, e.detail),
				)
				behavior.addEventListener('progress', (e: any) =>
					this.onBehaviorProgress(behavior, e.detail),
				)
				behavior.addEventListener('conditionChange', () =>
					this.syncBehaviors(),
				)
				this.behaviors.push(behavior)
			}
		}
	}

	private syncBehaviors() {
		const holdBehaviors = this.behaviors.filter(b => b.options.duration && b.isActive)
		if (holdBehaviors.length < 2) return

		const allMet = holdBehaviors.every(b => b.isConditionMet.value)
		for (const b of holdBehaviors) {
			allMet ? b.resumeProgress() : b.pauseProgress()
		}
	}

	private createBehavior(suggestion: BehaviorSuggestion): Behavior | null {
		const options = {
			duration: suggestion.duration,
			failBehavior: suggestion.failBehavior,
			...suggestion.options,
		}

		const BehaviorClass = getBehaviorClass(suggestion.type)
		if (!BehaviorClass) {
			console.warn(`[Scene] Unknown behavior type: ${suggestion.type}`)
			return null
		}

		const behavior = new BehaviorClass(options)
		if (this.devices) {
			behavior.devices = this.devices
		}
		return behavior
	}

	public static getBehaviorClass(type: string) {
		return getBehaviorClass(type) || null
	}

	public rebuildBehaviors() {
		for (const b of this.behaviors) {
			try { b.stop() } catch { /* best-effort cleanup */ }
		}
		this.behaviors = []
		this.initBehaviors()
	}

	// ---------------------------------------------------------------------------
	// Lifecycle
	// ---------------------------------------------------------------------------

	public async start(context: SceneContext) {
		console.log(`[Scene] Starting: ${this.id}`, {
			config: this.config,
			behaviors: this.behaviors.map(b => b.constructor.name),
		})

		this.context = context
		this.phase = ScenePhase.MEDIA_PLAYING
		this.progress.value = 0
		this.startTime = Date.now()
		this.pendingBehaviorResult = null

		this.rebuildBehaviors()

		// Reset text state.
		this.activeText.value = ''
		this.isTextVisible.value = false

		// 1. Launch voice & text sequences in parallel.
		// Session-level audio: play the region from the master recording.
		// Per-scene audio: generate/play individual voice clip from text.
		let voicePromise: Promise<void>
		if (this.region && context.masterAudioKey) {
			voicePromise = voiceService.playRegion(
				context.masterAudioKey,
				this.region.start,
				this.region.end,
			)
		} else if (this.config.voice) {
			voicePromise = this.playVoiceSequence(this.config.voice, context)
		} else {
			voicePromise = Promise.resolve()
		}
		const textPromise = this.config.text
			? this.playTextSequence(this.config.text)
			: Promise.resolve()

		Promise.all([voicePromise, textPromise])
			.then(() => this.onMediaComplete())
			.catch(e => console.error('[Scene] Media sequence failed', e))

		// 2. Start behaviors immediately (they run alongside media).
		for (const b of this.behaviors) b.start()
		this.syncBehaviors()

		// 3. Duration-based progress timer.
		if (this.config.duration) {
			this.progressIntervalId = setInterval(() => {
				if (!this.isActive) return
				const elapsed = Date.now() - this.startTime
				const target = this.config.duration! / playbackSpeed.value
				const p = Math.min(100, (elapsed / target) * 100)

				if (this.behaviors.length === 0) {
					this.progress.value = p
				}

				if (elapsed >= target && this.behaviors.length === 0) {
					this.complete(true)
				}
			}, 32)
		}
	}

	public stop() {
		if (this.phase === ScenePhase.STOPPED) return
		this.phase = ScenePhase.STOPPED

		if (this.progressIntervalId) {
			clearInterval(this.progressIntervalId)
			this.progressIntervalId = null
		}
		if (this.activeTimer) {
			clearTimeout(this.activeTimer)
			this.activeTimer = null
		}
		for (const b of this.behaviors) b.stop()
		voiceService.stop()
	}

	// ---------------------------------------------------------------------------
	// State transitions
	// ---------------------------------------------------------------------------

	/**
	 * Called when voice + text sequences finish.
	 * Transitions MEDIA_PLAYING → BEHAVIORS_ACTIVE (or completes if no behaviors).
	 */
	private onMediaComplete() {
		if (this.phase !== ScenePhase.MEDIA_PLAYING) return
		console.log(`[Scene] Media sequence complete: ${this.id}`)

		if (this.behaviors.length > 0) {
			// Check if behaviors already finished while media was playing.
			const allDone = this.behaviors.every(b => !b.isActive)
			if (allDone) {
				console.log('[Scene] Media done, behaviors already done. Completing.')
				this.complete(true, this.pendingBehaviorResult)
			} else {
				this.phase = ScenePhase.BEHAVIORS_ACTIVE
			}
		} else if (!this.config.duration) {
			// No behaviors, no forced duration — media finishing is completion.
			this.complete(true)
		}
		// If duration is set but no behaviors, the progress timer handles completion.
	}

	/**
	 * Called when a behavior emits success and all behaviors are done.
	 * If media is still playing, stash the result; otherwise complete.
	 */
	protected onBehaviorSuccess(behavior: Behavior, data: any) {
		console.log(`[Scene] Behavior success: ${behavior.constructor.name}`, data)

		const allDone = this.behaviors.every(b => !b.isActive)
		if (!allDone) {
			this.syncBehaviors()
			return
		}

		this.pendingBehaviorResult = data

		if (this.phase === ScenePhase.BEHAVIORS_ACTIVE) {
			// Media already finished — we're done.
			console.log(`[Scene] All behaviors complete, completing scene: ${this.id}`)
			this.complete(true, data)
		} else {
			// Media still playing — completion will happen in onMediaComplete.
			console.log('[Scene] Behaviors complete, waiting for media...')
		}
	}

	protected onBehaviorFail(behavior: Behavior, reason: any) {
		console.warn(`[Scene] Behavior failed: ${behavior.constructor.name}`, reason)
		this.complete(false, { reason, behaviorId: behavior.constructor.name })
	}

	protected onBehaviorProgress(_behavior: Behavior, detail: { value: number }) {
		if (this.behaviors.length > 1) {
			const minProgress = Math.min(
				...this.behaviors.map(b => (b.isActive ? b.progress.value : 1)),
			)
			this.progress.value = minProgress * 100
		} else {
			this.progress.value = detail.value * 100
		}
	}

	protected complete(success: boolean, metrics?: any, result?: any) {
		if (this.phase === ScenePhase.COMPLETE || this.phase === ScenePhase.STOPPED) return
		this.phase = ScenePhase.COMPLETE
		this.stop()
		this.context?.complete(success, metrics, result)
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	public onComplete(success: boolean, result?: any): string | undefined {
		if (this.config.onCompleteCallback) {
			return this.config.onCompleteCallback(success, result)
		}
		return undefined
	}

	get component() {
		return markRaw(SceneView)
	}

	get duration(): number {
		return (this.config.duration || 5000) / playbackSpeed.value
	}

	get cooldown(): number {
		return (this.config.cooldown || 2000) / playbackSpeed.value
	}

	// ---------------------------------------------------------------------------
	// Media playback (private)
	// ---------------------------------------------------------------------------

	private async playVoiceSequence(voice: string | string[], context: SceneContext) {
		const voiceText = Array.isArray(voice) ? voice.join(' ') : voice
		return voiceService.playVoice(voiceText, context.programId, {
			previousText: context.previousVoiceText,
		})
	}

	private async playTextSequence(text: string | string[]) {
		const segments: string[] = (Array.isArray(text) ? text : [text])
			.map(s => s.trim())
			.filter(s => s)

		if (!segments.length) return

		for (let i = 0; i < segments.length; i++) {
			if (!this.isActive) break

			const segment = segments[i]
			if (!segment) continue

			this.activeText.value = segment
			this.isTextVisible.value = true

			const baseDuration = calculateDuration(segment)
			const durationMs = (Math.max(2500, baseDuration) + 1000) / playbackSpeed.value
			await this.wait(durationMs)

			if (i < segments.length - 1) {
				this.isTextVisible.value = false
				await this.wait(this.cooldown)
			}
		}

		if (this.isActive && this.behaviors.length === 0) {
			await this.wait(1000 / playbackSpeed.value)
		}
	}

	private wait(ms: number): Promise<void> {
		return new Promise(resolve => {
			this.activeTimer = window.setTimeout(resolve, ms)
		})
	}
}
