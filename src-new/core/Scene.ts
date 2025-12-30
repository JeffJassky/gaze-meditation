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
	protected context: SceneContext | null = null

	private progressIntervalId: any = null
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
			...suggestion.options
		}

		switch (suggestion.type) {
			case 'head:nod':
				return new NodBehavior({ ...options, type: 'YES' })
			case 'head:shake':
				return new NodBehavior({ ...options, type: 'NO' })
			case 'head:still':
				return new StillnessBehavior(options)
			case 'breathe':
				return new BreatheBehavior(options)
			case 'eyes:no-blink':
				return new NoBlinkBehavior(options)
			case 'eyes:close':
				return new CloseEyesBehavior(options)
			case 'eyes:open':
				return new OpenEyesBehavior(options)
			case 'speech:speak':
				return new SpeechBehavior({ ...options, targetValue: options.targetValue || options.value })
			case 'type':
				return new TypeBehavior({ ...options, targetPhrase: options.targetPhrase || options.value })
			case 'mouth:relax':
				return new RelaxJawBehavior(options)
			case 'tongue:out':
				return new TongueOutBehavior(options)
			case 'directional-gaze':
				// Handle legacy direct type if needed
				return new DirectionalGazeBehavior({ 
					...options, 
					direction: options.direction || (suggestion.type.split(':')[1] as any) 
				})
			case 'head:left': return new DirectionalGazeBehavior({ ...options, direction: 'LEFT' })
			case 'head:right': return new DirectionalGazeBehavior({ ...options, direction: 'RIGHT' })
			case 'head:up': return new DirectionalGazeBehavior({ ...options, direction: 'UP' })
			case 'head:down': return new DirectionalGazeBehavior({ ...options, direction: 'DOWN' })
			case 'form':
			case 'form:submit':
				return new FormBehavior({ 
					...options, 
					question: (this.config as any).question || '', 
					fields: (this.config as any).fields || [] 
				})
			default:
				console.warn(`[Scene] Unknown behavior type: ${suggestion.type}`)
				return null
		}
	}

	public async start(context: SceneContext) {
		this.context = context
		this.isActive = true
		this.progress.value = 0
		this.startTime = Date.now()

		// 1. Handle Voice
		if (this.config.voice) {
			const voiceText = Array.isArray(this.config.voice)
				? this.config.voice.join(' ')
				: this.config.voice
			
			voiceService.playVoice(voiceText, context.programId, { 
				previousText: context.previousVoiceText 
			}).then(() => {
				if (this.behaviors.length === 0 && !this.config.duration) {
					this.complete(true)
				}
			})
		}

		// 2. Start Behaviors
		this.behaviors.forEach(b => b.start())

		// 3. Fallback/Progress Timer
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

	public stop() {
		this.isActive = false
		if (this.progressIntervalId) {
			clearInterval(this.progressIntervalId)
			this.progressIntervalId = null
		}
		this.behaviors.forEach(b => b.stop())
	}

	protected onBehaviorSuccess(behavior: Behavior, data: any) {
		const allDone = this.behaviors.every(b => !b.isActive)
		if (allDone) {
			this.complete(true, data)
		}
	}

	protected onBehaviorFail(behavior: Behavior, reason: any) {
		this.complete(false, { reason, behaviorId: (behavior as any).constructor.name })
	}

	protected onBehaviorProgress(behavior: Behavior, detail: { value: number }) {
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