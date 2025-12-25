import type { Program } from '../types'
import { SpeechInstruction } from '../instructions/SpeechInstruction'
import { DirectionalGazeInstruction } from '../instructions/DirectionalGazeInstruction'
import { StillnessInstruction } from '../instructions/StillnessInstruction'
import { NoBlinkInstruction } from '../instructions/NoBlinkInstruction'
import { NodInstruction } from '../instructions/NodInstruction'
import { ReadInstruction } from '../instructions/ReadInstruction'
import { CloseEyesInstruction } from '../instructions/CloseEyesInstruction'
import { OpenEyesInstruction } from '../instructions/OpenEyesInstruction'
import { RelaxJawInstruction } from '../instructions/RelaxJawInstruction'

export const initialTrainingProgram: Program = {
	id: 'initial_training_short',
	title: 'Gaze Tutorial',
	description: 'Get started with Gaze in less than 5 minutes.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	instructions: [
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 1: JEFF'S INTRO
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Hey. Welcome. This is Jeff. Well, the voice you're hearing is computer generated, but it mostly sounds like me. It might glitch or sound goofy. If it does, just ignore it.`,
			text: 'Welcome',
			audio: {
				binaural: {
					hertz: 12
				}
			},
			skipIntro: true
		}),

		new ReadInstruction({
			voice: `If you know me, you know I'm into psychology, the nervous system, and emotional wellbeing. Hypnosis has given me some of the most profound experiences of my life. Moments where my understanding of myself—this body I'm living in—fundamentally shifted. For the better.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		new ReadInstruction({
			voice: `I built this to share that. Thanks for trying it.`,
			text: 'Thanks for being here',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 2: WHAT HYPNOSIS IS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `So what is hypnosis? It's simpler than you think. Just techniques to help your body relax and your mind focus.`,
			text: 'What is hypnosis?',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `The state it creates—trance—isn't unusual. You experience it every time you get absorbed in something and lose track of time. Driving a familiar route. A workout. A guided meditation. Your brain already knows how to do this.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `And you're always in control. You can pause, stop, open your eyes, adjust your position. Nothing is forced.`,
			text: "You're always in control",
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 3: HOW THE APP WORKS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `This app uses your camera to track signals from your body—your stillness, eye movements, blinks. It's biofeedback. The app responds to you.`,
			text: 'How Gaze works',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You'll see a dot, a ring, sometimes prompts. These aren't tests. Just guides. Your only job is to follow along.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 4: QUICK MECHANICS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Let's practice the basics. Each one takes a few seconds.`,
			text: "Let's practice",
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// --- Stillness ---

		new StillnessInstruction({
			voice: `First, stillness. You'll see a blue dot tracking your movement. Find a comfortable position and settle. Keep the dot centered. Ten seconds.`,
			prompt: 'Find stillness',
			duration: 20000,
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// --- Eyes ---

		new ReadInstruction({
			voice: `Now your eyes. Keeping them open without blinking makes them heavy. We use that.`,
			text: 'Your eyes',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new NoBlinkInstruction({
			voice: `Keep your eyes open. Soft. Notice the heaviness building.`,
			prompt: 'Eyes soft',
			duration: 8000,
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Blink if you need to.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// --- Eye Closure ---

		new CloseEyesInstruction({
			voice: `Closing your eyes shifts your nervous system. Let's try it briefly.`,
			text: '',
			duration: 5000,
			audio: {
				binaural: {
					hertz: 7
				}
			}
		}),

		new OpenEyesInstruction({
			voice: `Perfect. Now, gently open your eyes again.`,
			text: 'Open your eyes',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// --- Jaw ---

		new RelaxJawInstruction({
			voice: `Another place we hold tension is the jaw. Let the jaw soften. First, with space between the teeth. Then, letting the lips part and relax. Then, letting the mouth gently fall open.`,
			prompt: '',
			duration: 15000,
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// --- Gaze Direction ---

		new ReadInstruction({
			voice: `Sometimes I'll guide your gaze. Different positions affect your nervous system differently. Lowering your gaze can make you feel more relaxed where raising your gaze can make you feel more active.`,
			text: 'Gaze direction',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new DirectionalGazeInstruction({
			voice: `Try lowering your gaze gently. Notice the shift.`,
			prompt: 'Lower your gaze',
			direction: 'DOWN',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// --- Nodding ---

		new ReadInstruction({
			voice: `Sometimes I'll ask a question. You can answer by nodding or shaking your head.`,
			text: 'Responding',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new NodInstruction({
			voice: `If you understand, nod now.`,
			prompt: 'Nod yes',
			type: 'YES',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Finally, your voice. Speaking something aloud engages your body differently than just thinking it. The words become more real. More felt.`,
			text: 'Your voice',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new SpeechInstruction({
			voice: `Say aloud: "I am ready."`,
			prompt: 'Say "I am ready"',
			targetValue: 'I am ready',
			duration: 6000,
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. And you are.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 5: CLOSING
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `That's it! You've learned everything you need...  Be still. Relax your face. Follow along.`,
			text: "You're ready",
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Your body already knows how to do this. The app just helps you remember.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Now choose your first session. There's no wrong choice. Trust your instinct.`,
			text: 'Choose your first session',
			cooldown: 0,
			audio: {
				binaural: {
					hertz: 11
				}
			}
		})
	]
}
