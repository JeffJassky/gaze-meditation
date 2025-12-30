import type { Session } from '../types'

export const initialTrainingSession: Session = {
	id: 'initial_training_short',
	title: 'Gaze Tutorial',
	description: 'Get started with Gaze in less than 5 minutes.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	scenes: [
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 1: JEFF'S INTRO
		// ═══════════════════════════════════════════════════════════════════════════
		{
			voice: `Hey. Welcome. This is Jeff. Well, the voice you're hearing is computer generated, but it mostly sounds like me. It might glitch or sound goofy. If it does, just ignore it.`,
			text: 'Welcome',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		},

		{
			voice: `If you know me, you know I'm into psychology, the nervous system, and emotional wellbeing.`
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 2: WHAT HYPNOSIS IS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `And you might be wondering - what IS hypnosis? Well... It's less mysterious than you might think... It's like guided meditation - just with some added techniques to help your body relax and your mind focus.`,
			text: 'What is hypnosis?'
		},
		{
			voice: `The state it creates — trance - is one you've experienced thousands of times. You experience trance every day. You experience it every time you get absorbed in something and lose track of time. Driving a familiar route. A workout. A flow state. Your brain already knows how to do it.`
		},
		{
			voice: `By directing focus and attention, we can shift our nervous system, and craft very real, and unique internal experiences. These experiences have been some of the most profound experiences of my life. Moments where my understanding of myself and this body I'm living in fundamentally changes, for the better.`
		},
		{
			voice: `I created Gaze to share that with you. Thank you for being here, and for being curious.`,
			text: 'Thanks for being here',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},
		{
			voice: `During hypnosis, you are always in full control of the experience. You can always choose to pause or stop, or open your eyes, or adjust your position. So you can rest easy, knowing that you will always be in full control.`,
			text: "You're always in control"
		},
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 3: HOW THE APP WORKS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `This app uses your device to monitor signals from your body — your stillness, eye movements, breathing, blnking. The app responds, meeting you where you are.`,
			text: 'How Gaze works',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Sometimes, you'll see a dot on the screen, or a ring. Sometimes prompts, or questions. These are gentle guides that help direct your focus. They're usually placed at predetermined points in each session and serve to guide you along. Your only job is to follow.`
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 4: QUICK MECHANICS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Let's practice the basics. Each one takes a few seconds.`,
			text: "Let's practice"
		},

		// --- Stillness ---

		{
			voice: `First, stillness. You'll see a blue dot tracking your movement. Find a comfortable position and settle. Keep the dot centered. Ten seconds.`,
			text: 'Find stillness',
			duration: 20000,
			behavior: {
				suggestions: [
					{
						type: 'head:still'
					}
				]
			}
		},

		{
			voice: `Good.`,
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// --- Eyes ---

		{
			voice: `Now your eyes. Keeping them open without blinking makes them heavy. We use that.`,
			text: 'Your eyes'
		},

		{
			voice: `Keep your eyes open. Soft. Notice the heaviness building.`,
			text: 'Eyes soft',
			behavior: {
				suggestions: [
					{
						type: 'eyes:open',
						duration: 8000
					}
				]
			}
		},

		{
			voice: `Good. Blink if you need to.`
		},

		// --- Eye Closure ---

		{
			voice: `Closing your eyes shifts your nervous system. Let's try it briefly.`,
			behavior: {
				suggestions: [
					{
						type: 'eyes:close'
					}
				]
			}
		},

		{
			voice: `Perfect. Now, gently open your eyes again.`,
			text: 'Open your eyes',
			behavior: {
				suggestions: [
					{
						type: 'eyes:open'
					}
				]
			}
		},

		// --- Jaw ---

		{
			voice: `Another place we hold tension is the jaw. Let the jaw soften. First, with space between the teeth. Then, letting the lips part and relax. Then, letting the mouth gently fall open.`,
			duration: 15000,
			audio: {
				binaural: {
					hertz: 7
				}
			},
			behavior: {
				suggestions: [
					{
						type: 'mouth:relax'
					}
				]
			}
		},

		{
			voice: `Good.`
		},

		// --- Gaze Direction ---

		{
			voice: `Sometimes I'll guide your gaze. Different positions affect your nervous system differently. Lowering your gaze can make you feel more relaxed where raising your gaze can make you feel more active.`,
			text: 'Gaze direction'
		},

		{
			voice: `Try lowering your gaze gently now.`,
			text: 'Lower your gaze',
			behavior: {
				suggestions: [
					{
						type: 'eyes:down'
					}
				]
			}
		},

		{
			voice: `Good. You might notice a subtle shift in energy. In relaxation.`
		},

		// --- Nodding ---

		{
			voice: `Sometimes I'll ask a question. You can answer by nodding or shaking your head.`,
			text: 'Responding'
		},
		{
			voice: `If you understand, nod now.`,
			text: 'Nod yes',
			behavior: {
				suggestions: [
					{
						type: 'head:nod'
					}
				]
			}
		},

		{
			voice: `Good. Finally, your voice. In a moment, I'll ask you to speak something aloud. Speaking something aloud engages your body differently than just thinking it. The words become more real. More felt.`,
			text: 'Your voice'
		},

		{
			voice: `Try saying aloud: "I am ready."`,
			text: 'Say "I am ready"',
			behavior: {
				suggestions: [
					{
						type: 'speech:speak',
						options: {
							targetValue: 'I am ready'
						}
					}
				]
			}
		},

		{
			voice: `Good. And you are.`
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 5: CLOSING
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `That's it! You've learned everything you need...  Be still. Relax your face. Follow along.`,
			text: "You're ready"
		},

		{
			voice: `Your mind and body already know how to do this. The app just helps guide you.`
		},

		{
			voice: `Now, since you're ready, you can choose your first session. There are no wrong choices here. Trust your instinct.`,
			text: 'Choose your first session',
			cooldown: 0
		}
	]
}
