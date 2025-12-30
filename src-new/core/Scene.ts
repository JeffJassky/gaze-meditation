import { markRaw, ref, type Ref } from 'vue'
import { type SceneConfig, type BehaviorSuggestion } from '@/types'
import { 
	NodBehavior, 
	StillnessBehavior, 
	BreatheBehavior, 
	NoBlinkBehavior, 
	CloseEyesBehavior, 
	OpenEyesBehavior,
	SpeechBehavior,
	TypeBehavior,
	RelaxJawBehavior,
	TongueOutBehavior,
	DirectionalGazeBehavior,
	FormBehavior,
	Behavior 
} from '@new/behaviors'
import SceneView from '@new/components/scene/Scene.vue'
import { voiceService } from '@/services/voiceService'
import { playbackSpeed } from '@/state/playback'
import { calculateDuration } from '@/utils/time'

export interface SceneContext {
	complete(success: boolean, metrics?: any, result?: any): void
	programId: string
	previousVoiceText?: string
}

export class Scene {
	public id: string
	public config: SceneConfig
	public behaviors: Behavior[] = []
	public isActive = false
	public progress: Ref<number> = ref(0) // 0-100
	
	// Reactive properties for the view
	public activeText = ref('')
	public isTextVisible = ref(false)

	protected context: SceneContext | null = null

	private progressIntervalId: any = null
	private activeTimer: number | null = null
	private startTime = 0

	constructor(config: SceneConfig) {
		this.config = {
			cooldown: 2000,
			...config
		}
		this.id = config.id || `scene_${Math.random().toString(36).substring(2, 11)}`
		this.initBehaviors()
	}

	// Alias for compatibility with code expecting Instruction.options
	get options() {
		return this.config
	}

	private initBehaviors() {
		const suggestions = this.config.behavior?.suggestions || []
		suggestions.forEach(suggestion => {
			const behavior = this.createBehavior(suggestion)
			if (behavior) {
				// Connect behavior events
				behavior.addEventListener('success', (e: any) => this.onBehaviorSuccess(behavior, e.detail))
				behavior.addEventListener('fail', (e: any) => this.onBehaviorFail(behavior, e.detail))
				behavior.addEventListener('progress', (e: any) => this.onBehaviorProgress(behavior, e.detail))
				this.behaviors.push(behavior)
			}
		})
	}

	private createBehavior(suggestion: BehaviorSuggestion): Behavior | null {
		const options = {
			duration: suggestion.duration,
			...suggestion.options,
			isExplicitDuration: suggestion.duration !== undefined && suggestion.duration !== Infinity
		}

		const BehaviorClass = Scene.getBehaviorClass(suggestion.type)
		if (!BehaviorClass) {
			console.warn(`[Scene] Unknown behavior type: ${suggestion.type}`)
			return null
		}

		switch (suggestion.type) {
			case 'head:nod':
				return new NodBehavior({ ...options, type: 'YES' })
			case 'head:shake':
				return new NodBehavior({ ...options, type: 'NO' })
			case 'speech:speak':
				return new SpeechBehavior({ ...options, targetValue: options.targetValue || options.value })
			case 'type':
				return new TypeBehavior({ ...options, targetPhrase: options.targetPhrase || options.value })
			case 'directional-gaze':
				return new DirectionalGazeBehavior({ 
					...options, 
					direction: options.direction || (suggestion.type.split(':')[1] as any) 
				})
			case 'form':
			case 'form:submit':
				return new (BehaviorClass as any)({ 
					...options, 
					question: (this.config as any).question || '', 
					fields: (this.config as any).fields || [] 
				})
			default:
				if (suggestion.type.startsWith('head:') && BehaviorClass === DirectionalGazeBehavior) {
					return new DirectionalGazeBehavior({ ...options, direction: suggestion.type.split(':')[1] as any })
				}
				return new (BehaviorClass as any)(options)
		}
	}

	public static getBehaviorClass(type: string): typeof Behavior | null {
		switch (type) {
			case 'head:nod':
			case 'head:shake':
				return NodBehavior
			case 'head:still':
				return StillnessBehavior
			case 'breathe':
				return BreatheBehavior
			case 'eyes:no-blink':
				return NoBlinkBehavior
			case 'eyes:close':
				return CloseEyesBehavior
			case 'eyes:open':
				return OpenEyesBehavior
			case 'speech:speak':
				return SpeechBehavior
			case 'type':
				return TypeBehavior
			case 'mouth:relax':
				return RelaxJawBehavior
			case 'tongue:out':
				return TongueOutBehavior
			case 'directional-gaze':
			case 'head:left':
			case 'head:right':
			case 'head:up':
			case 'head:down':
				return DirectionalGazeBehavior
			case 'form':
			case 'form:submit':
				return FormBehavior
			default:
				return null
		}
	}

	public async start(context: SceneContext) {
		console.log(`[Scene] Starting: ${this.id}`, {
			config: this.config,
			behaviors: this.behaviors.map(b => b.constructor.name)
		})
		this.context = context
		this.isActive = true
		this.progress.value = 0
		this.startTime = Date.now()

		// Reset Text State
		this.activeText.value = ''
		this.isTextVisible.value = false

		// 1. Handle Voice & Text Sequence
		const voiceText = this.config.voice
		const displayText = this.config.text

		const voicePromise = voiceText ? this.playVoiceSequence(voiceText, context) : Promise.resolve()
		const textPromise = displayText ? this.playTextSequence(displayText) : Promise.resolve()

		// Wait for both sequences
		Promise.all([voicePromise, textPromise]).then(() => {
			if (this.behaviors.length === 0 && !this.config.duration) {
				this.complete(true)
			}
		})

		// 2. Start Behaviors
		this.behaviors.forEach(b => b.start())

		// 3. Fallback/Progress Timer (only if forced duration)
		if (this.config.duration) {
			this.progressIntervalId = setInterval(() => {
				if (!this.isActive) return
				const elapsed = Date.now() - this.startTime
				const p = Math.min(100, (elapsed / (this.config.duration! / playbackSpeed.value)) * 100)
				
				if (this.behaviors.length === 0) {
					this.progress.value = p
				}

				if (elapsed >= (this.config.duration! / playbackSpeed.value)) {
					if (this.behaviors.length === 0) this.complete(true)
				}
			}, 32)
		}
	}

	private async playVoiceSequence(voice: string | string[], context: SceneContext) {
		const voiceText = Array.isArray(voice) ? voice.join(' ') : voice
		return voiceService.playVoice(voiceText, context.programId, { 
			previousText: context.previousVoiceText 
		})
	}

	private async playTextSequence(text: string | string[]) {
		const rawText = Array.isArray(text) ? text.join(' ~ ') : text
		const segments: string[] = rawText.split('~').map(s => s.trim()).filter(s => s)
		
		if (!segments.length) return

		for (let i = 0; i < segments.length; i++) {
			if (!this.isActive) break

			const segment = segments[i]
			if (!segment) continue

			this.activeText.value = segment
			this.isTextVisible.value = true

			// Calculate read time
			// We add a 1s buffer because the 'glacial' transition takes 2s to fully fade in
			const baseDuration = calculateDuration(segment)
			const durationMs = (Math.max(2500, baseDuration) + 1000) / playbackSpeed.value

			await this.wait(durationMs)
			
			if (i < segments.length - 1) {
				this.isTextVisible.value = false
				// Wait for cooldown (2s) to allow full glacial fade out before next segment
				await this.wait(this.cooldown)
			}
		}
		
		// Stay visible for a bit after last segment if no behaviors
		if (this.isActive && this.behaviors.length === 0) {
			await this.wait(1000 / playbackSpeed.value)
		}
	}

	private wait(ms: number): Promise<void> {
		return new Promise(resolve => {
			this.activeTimer = window.setTimeout(resolve, ms)
		})
	}

	public stop() {
		this.isActive = false
		if (this.progressIntervalId) {
			clearInterval(this.progressIntervalId)
			this.progressIntervalId = null
		}
		if (this.activeTimer) {
			clearTimeout(this.activeTimer)
			this.activeTimer = null
		}
		this.behaviors.forEach(b => b.stop())
	}

	protected onBehaviorSuccess(behavior: Behavior, data: any) {
		console.log(`[Scene] Behavior success: ${behavior.constructor.name}`, data)
		const allDone = this.behaviors.every(b => !b.isActive)
		if (allDone) {
			console.log(`[Scene] All behaviors complete, completing scene: ${this.id}`)
			this.complete(true, data)
		}
	}

	protected onBehaviorFail(behavior: Behavior, reason: any) {
		console.warn(`[Scene] Behavior failed: ${behavior.constructor.name}`, reason)
		this.complete(false, { reason, behaviorId: (behavior as any).constructor.name })
	}

	protected onBehaviorProgress(_behavior: Behavior, detail: { value: number }) {
		this.progress.value = detail.value * 100
	}

	protected complete(success: boolean, metrics?: any, result?: any) {
		if (!this.isActive) return
		this.stop()
		this.context?.complete(success, metrics, result)
	}

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
}