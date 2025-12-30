import type { Session } from '../types'

export const initialTrainingSession: Session = {
	id: 'initial_training',
	title: 'Gaze Tutorial',
	skipIntro: true,
	description: 'Get started with Gaze in less than 5 minutes.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	scenes: [
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 1: WELCOME & JEFF'S INTRO
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Hey. Welcome. This is Jeff. Well, the voice you're hearing is AI-generated for now, but it mostly sounds like me. It might glitch, sound goofy, or shift volume a bit. If it does, just ignore it.`,
			text: 'Welcome',
			audio: {
				binaural: {
					hertz: 14 // Light beta - alert but receptive
				}
			}
		},

		{
			voice: `If you know me, and you probably do—you know I'm into psychology, the nervous system, and emotional wellbeing. Hypnosis has been something I've practiced for a bit because it's given me some of the most profound experiences of my life.`,
			text: '',
			audio: {
				binaural: {
					hertz: 13
				}
			}
		},

		{
			voice: `I've discovered beautiful, peaceful, and transcendent parts of myself that I may have never found otherwise. Moments where my understanding of myself—this body I'm living in, my identity—fundamentally shifted. For the better.`,
			text: '',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		},

		{
			voice: `I built this to try and share that. So thanks for coming along.`,
			text: 'Thanks for being here',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		},

		{
			voice: `Now. Get comfortable, follow along, and stay curious.`,
			text: 'Get comfortable',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 2: MEETING THEM WHERE THEY ARE (Yes Set)
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `You just came from something. Whatever you were doing before this—scrolling, working, talking, thinking—some of that is probably still with you.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},

		{
			voice: `You might notice your body is holding tension somewhere. Your shoulders. Your jaw. Behind your eyes. That's normal. You don't need to fix it yet.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},

		{
			voice: `You're here now. You made time for this. That's already something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `And some part of you is curious. Maybe skeptical too. That's fine. Both can be true.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `You're sitting or lying somewhere. You can feel the surface beneath you. The temperature of the air. The weight of your own body.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `You're breathing. You've been breathing this whole time without thinking about it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Good. You're already doing this.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 3: WHAT HYPNOSIS ACTUALLY IS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `So. What is hypnosis?`,
			text: 'What is hypnosis?',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `It's simpler than you might think. Hypnosis is just a set of techniques to help the body relax and the mind focus. That's it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `The state it creates—trance—isn't unusual. You experience it many times a day.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `You know that feeling when you're doing something familiar and you lose track of time? You get absorbed. Your body handles the task while your mind drifts somewhere else.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Maybe you've experienced it driving a route you know well. You're moving through traffic, making turns, and then—somewhere down the road—you come back to awareness and wonder where the last ten miles went.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Or during a workout. A yoga class. A guided meditation. You're following along, and at some point you stop thinking about following along. You're just... in it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `That's trance. You've already done it thousands of times. Your brain knows how.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Hypnosis just does that on purpose.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `And here's the thing—you're always in control. Trance isn't something that happens to you. It's something you allow. You can pause or stop anytime. You can open your eyes, scratch your nose, adjust your position. Nothing is forced.`,
			text: "You're always in control",
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Your mind stays aware. Your body learns to let go. That's the whole thing.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 4: HOW THIS APP WORKS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `This app uses your camera to track small signals from your body. Your stillness. Your eye movements. Your blinks.`,
			text: 'How Gaze works',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `It's biofeedback. The app watches how your body responds and adjusts to meet you where you are.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `You'll see things on screen—a dot, a ring, sometimes prompts. These aren't tests. There's no failing. They're just gentle guides to help your nervous system find its rhythm.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Your only job is to follow along and notice what happens.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 5: FIRST EXPERIENCE (Before Explanation)
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Actually—before I explain anything else, let's just try something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Don't worry about doing it right. Just follow along.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Take a slow breath in through your nose.`,
			text: 'Take a breath',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `And let it out through your mouth. Slow.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `One more. In.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		},

		{
			voice: `And out.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		},

		{
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Now let your breathing return to normal. You don't need to control it anymore.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Notice how you feel right now compared to sixty seconds ago. Even that small thing changed something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `That's how this works. Small shifts. One after another. Until you're somewhere new.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 6: THE COMMITMENT MOMENT
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `In a moment, I'm going to ask you to actually try this. Not just watch. Not just listen. But participate.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `You don't have to believe anything. You don't have to commit to anything beyond the next few minutes.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Just decide—right now—that you're going to genuinely follow along. See what happens. Stay curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `If you're willing to do that, take one slow breath now.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Good. Let's keep going.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 7: HANDS AND ENVIRONMENT
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `First—your hands. If you're holding your phone, put it somewhere stable. Rest your hands somewhere comfortable. Your lap, your sides, wherever feels natural.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Feel how different that is. Hands that aren't doing anything. Hands that can just be hands.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Now notice where your body meets the surface beneath you. The chair. The bed. The floor. Feel the places where you're supported.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `You don't have to hold yourself up right now. Something else is holding you.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 8: STILLNESS
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Stillness is one of the gateways into trance. When your body becomes still, your mind tends to follow.`,
			text: 'Stillness',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `You'll see a blue dot on screen. It tracks your subtle movements. The goal isn't to force yourself to be still. It's to allow stillness. Find a comfortable position and settle into it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Keep the dot centered in the ring. Fifteen seconds. Just breathing. Just being.`,
			text: 'Keep the dot centered',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 15000 }]
			},
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `Good. Even small stillness creates change. Your nervous system is already responding.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 9: EYES
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Now, your eyes.`,
			text: 'Your eyes',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `There's something interesting about keeping your eyes open without blinking. They naturally start to feel heavy. A little tired. Maybe dry.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `This isn't strain. It's your body preparing for rest. We're going to use that.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Keep your eyes open. Soft. Don't strain. Just notice what happens over the next ten seconds.`,
			text: 'Eyes open and soft',
			behavior: {
				suggestions: [{ type: 'eyes:no-blink', duration: 10000 }]
			},
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Good. Your eyelids probably feel a little different now. Heavier. That's your body's natural response.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Blink if you need to. Let them rest.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 10: EYE CLOSURE
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Closing your eyes changes things. Even just that small act shifts something in your nervous system.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `When you're ready, let your eyes close. Not forced. Just... allowed.`,
			text: 'Close your eyes',
			behavior: {
				suggestions: [{ type: 'eyes:close', duration: 8000 }]
			},
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `Notice what happens when the visual world disappears. The world outside softens. The world inside gets a little clearer.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `Now let them open again.`,
			text: 'Open your eyes',
			behavior: {
				suggestions: [{ type: 'eyes:open' }]
			},
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Notice if the light might look slightly different.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 11: FACE AND JAW
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Now bring your attention to your face.`,
			text: 'Your face',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Without changing anything yet—just notice. Is there tension in your forehead? Around your eyes? In your jaw?`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `The jaw is where most of us hold stress without realizing it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Let your jaw soften. Let it hang slightly open if it wants to. Teeth not touching. Tongue resting.`,
			behavior: {
				suggestions: [{ type: 'mouth:relax', duration: 6000 }]
			},
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `Notice how the rest of your face follows. When the jaw releases, tension has nowhere left to hide.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 12: BREATH
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Now, your breath. I'm not going to ask you to breathe any particular way.`,
			text: 'Your breath',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Just notice your breathing. And allow it to slow naturally if it wants to. Your body knows the rhythm it needs.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Three slow breaths. In through your nose. Out through your mouth. Let each exhale carry away a little more tension.`,
			text: '',
			cooldown: 8000,
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		},

		{
			voice: `Good. Notice how you feel now compared to when we started.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 13: GAZE DIRECTION
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Sometimes I'll guide your gaze. Ask you to look up, or down, or to the side.`,
			text: 'Gaze direction',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Different gaze positions activate different parts of your nervous system. Looking down tends to be calming. Looking up can feel more activating or open.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Lower your gaze slightly now. Just enough to feel a subtle shift. Keep the blue light visible.`,
			text: 'Lower your gaze',
			behavior: {
				suggestions: [{ type: 'head:down' }]
			},
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		{
			voice: `Good. Notice if that changed anything. Even slightly.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 14: HEAD MOVEMENT
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Sometimes during a session, I'll ask you a question. You can answer without speaking—just by nodding or shaking your head.`,
			text: 'Answering without speaking',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `This lets you respond while staying relaxed.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `If you understand, nod gently now.`,
			text: 'Nod yes',
			behavior: {
				suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
			},
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 15: VOICE
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Finally, your voice. Speaking something aloud engages your body differently than just thinking it.`,
			text: 'Your voice',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `The words become more real. More felt.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Say aloud: "I am ready."`,
			text: 'Say "I am ready"',
			behavior: {
				suggestions: [
					{ type: 'speech:speak', options: { targetValue: 'I am ready', duration: 6000 } }
				]
			},
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Good. And you are.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 16: THE INNER VOICE
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `One more thing. You might notice a part of your mind commenting on all of this. Judging it. Wondering if it's working. Feeling a little silly.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `That's normal. That part can watch. It doesn't have to stop.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `But there's another part too. The part that's actually feeling your breath. Actually noticing your body. Actually curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `You can let both exist. They don't have to agree.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 17: NAMING THE SHIFT
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Take a moment to notice how you feel right now.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Compare it to how you felt when you first opened the app. Something has shifted. Maybe subtle. Maybe not.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `This feeling—this particular quality of calm readiness—you can return to it. Anytime you sit down with this app, this is your starting point. Your body will begin to remember. Faster each time.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 18: WHAT HAPPENS AFTER
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `When you finish a session, you might feel different for a while. Softer. Slower. A little more present.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `You can let that linger. You don't have to shake it off and rush back to normal. The transition back can be gradual. That's part of the practice too.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 19: THE PATH
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Each time you return, something will be different. Not because you're forcing progress. But because your nervous system is learning.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `What feels effortful now will become automatic. What feels subtle now will become profound.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `This is just the beginning.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 20: YOUR WHY
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `You're here for a reason. You don't have to name it. You might not even fully know what it is.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `But some part of you reached for something. Something quieter. Or stronger. Or more free.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `That impulse is worth trusting.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 21: SUMMARY
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `You've just learned everything you need.`,
			text: "What you've learned",
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},

		{
			voice: `Be still. Relax your face. Breathe. Follow along. Stay curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},

		{
			voice: `Your body already knows how to do this. This app just helps you remember.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 22: CLOSING
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Next, you have a choice. You'll see a few introductory sessions to choose from. Each one is designed for beginners. Each offers something different. There's no wrong choice. Trust your instinct. When you're ready, select the one that feels right.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}
	]
}
