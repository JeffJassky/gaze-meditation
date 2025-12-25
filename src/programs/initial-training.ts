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
	id: 'initial_training',
	title: 'Gaze Tutorial',
	description: 'Get started with Gaze in less than 5 minutes.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	instructions: [
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 1: WELCOME & JEFF'S INTRO
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Hey. Welcome. This is Jeff. Well, the voice you're hearing is AI-generated for now, but it mostly sounds like me. It might glitch, sound goofy, or shift volume a bit. If it does, just ignore it.`,
			text: 'Welcome',
			audio: {
				binaural: {
					hertz: 14 // Light beta - alert but receptive
				}
			},
			skipIntro: true
		}),

		new ReadInstruction({
			voice: `If you know me, and you probably do—you know I'm into psychology, the nervous system, and emotional wellbeing. Hypnosis has been something I've practiced for a bit because it's given me some of the most profound experiences of my life.`,
			text: '',
			audio: {
				binaural: {
					hertz: 13
				}
			}
		}),

		new ReadInstruction({
			voice: `I've discovered beautiful, peaceful, and transcendent parts of myself that I may have never found otherwise. Moments where my understanding of myself—this body I'm living in, my identity—fundamentally shifted. For the better.`,
			text: '',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		}),

		new ReadInstruction({
			voice: `I built this to try and share that. So thanks for coming along.`,
			text: 'Thanks for being here',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		}),

		new ReadInstruction({
			voice: `Now. Get comfortable, follow along, and stay curious.`,
			text: 'Get comfortable',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 2: MEETING THEM WHERE THEY ARE (Yes Set)
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `You just came from something. Whatever you were doing before this—scrolling, working, talking, thinking—some of that is probably still with you.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		new ReadInstruction({
			voice: `You might notice your body is holding tension somewhere. Your shoulders. Your jaw. Behind your eyes. That's normal. You don't need to fix it yet.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		new ReadInstruction({
			voice: `You're here now. You made time for this. That's already something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `And some part of you is curious. Maybe skeptical too. That's fine. Both can be true.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You're sitting or lying somewhere. You can feel the surface beneath you. The temperature of the air. The weight of your own body.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You're breathing. You've been breathing this whole time without thinking about it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. You're already doing this.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 3: WHAT HYPNOSIS ACTUALLY IS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `So. What is hypnosis?`,
			text: 'What is hypnosis?',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `It's simpler than you might think. Hypnosis is just a set of techniques to help the body relax and the mind focus. That's it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `The state it creates—trance—isn't unusual. You experience it many times a day.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You know that feeling when you're doing something familiar and you lose track of time? You get absorbed. Your body handles the task while your mind drifts somewhere else.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Maybe you've experienced it driving a route you know well. You're moving through traffic, making turns, and then—somewhere down the road—you come back to awareness and wonder where the last ten miles went.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Or during a workout. A yoga class. A guided meditation. You're following along, and at some point you stop thinking about following along. You're just... in it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `That's trance. You've already done it thousands of times. Your brain knows how.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Hypnosis just does that on purpose.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `And here's the thing—you're always in control. Trance isn't something that happens to you. It's something you allow. You can pause or stop anytime. You can open your eyes, scratch your nose, adjust your position. Nothing is forced.`,
			text: "You're always in control",
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Your mind stays aware. Your body learns to let go. That's the whole thing.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 4: HOW THIS APP WORKS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `This app uses your camera to track small signals from your body. Your stillness. Your eye movements. Your blinks.`,
			text: 'How Gaze works',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `It's biofeedback. The app watches how your body responds and adjusts to meet you where you are.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You'll see things on screen—a dot, a ring, sometimes prompts. These aren't tests. There's no failing. They're just gentle guides to help your nervous system find its rhythm.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Your only job is to follow along and notice what happens.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 5: FIRST EXPERIENCE (Before Explanation)
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Actually—before I explain anything else, let's just try something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `Don't worry about doing it right. Just follow along.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Take a slow breath in through your nose.`,
			text: 'Take a breath',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `And let it out through your mouth. Slow.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `One more. In.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		}),

		new ReadInstruction({
			voice: `And out.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		}),

		new ReadInstruction({
			voice: `Good.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Now let your breathing return to normal. You don't need to control it anymore.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Notice how you feel right now compared to sixty seconds ago. Even that small thing changed something.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `That's how this works. Small shifts. One after another. Until you're somewhere new.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 6: THE COMMITMENT MOMENT
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `In a moment, I'm going to ask you to actually try this. Not just watch. Not just listen. But participate.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `You don't have to believe anything. You don't have to commit to anything beyond the next few minutes.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Just decide—right now—that you're going to genuinely follow along. See what happens. Stay curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `If you're willing to do that, take one slow breath now.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Let's keep going.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 7: HANDS AND ENVIRONMENT
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `First—your hands. If you're holding your phone, put it somewhere stable. Rest your hands somewhere comfortable. Your lap, your sides, wherever feels natural.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Feel how different that is. Hands that aren't doing anything. Hands that can just be hands.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Now notice where your body meets the surface beneath you. The chair. The bed. The floor. Feel the places where you're supported.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `You don't have to hold yourself up right now. Something else is holding you.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 8: STILLNESS
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Stillness is one of the gateways into trance. When your body becomes still, your mind tends to follow.`,
			text: 'Stillness',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `You'll see a blue dot on screen. It tracks your subtle movements. The goal isn't to force yourself to be still. It's to allow stillness. Find a comfortable position and settle into it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new StillnessInstruction({
			voice: `Keep the dot centered in the ring. Fifteen seconds. Just breathing. Just being.`,
			prompt: 'Keep the dot centered',
			duration: 15000,
			audio: {
				binaural: {
					hertz: 7
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Even small stillness creates change. Your nervous system is already responding.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 9: EYES
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Now, your eyes.`,
			text: 'Your eyes',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `There's something interesting about keeping your eyes open without blinking. They naturally start to feel heavy. A little tired. Maybe dry.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `This isn't strain. It's your body preparing for rest. We're going to use that.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new NoBlinkInstruction({
			voice: `Keep your eyes open. Soft. Don't strain. Just notice what happens over the next ten seconds.`,
			prompt: 'Eyes open and soft',
			duration: 10000,
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Your eyelids probably feel a little different now. Heavier. That's your body's natural response.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Blink if you need to. Let them rest.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 10: EYE CLOSURE
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Closing your eyes changes things. Even just that small act shifts something in your nervous system.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new CloseEyesInstruction({
			voice: `When you're ready, let your eyes close. Not forced. Just... allowed.`,
			text: 'Close your eyes',
			duration: 8000,
			audio: {
				binaural: {
					hertz: 7
				}
			}
		}),

		new ReadInstruction({
			voice: `Notice what happens when the visual world disappears. The world outside softens. The world inside gets a little clearer.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7
				}
			}
		}),

		new OpenEyesInstruction({
			voice: `Now let them open again.`,
			text: 'Open your eyes',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Notice if the light might look slightly different.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 11: FACE AND JAW
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Now bring your attention to your face.`,
			text: 'Your face',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Without changing anything yet—just notice. Is there tension in your forehead? Around your eyes? In your jaw?`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `The jaw is where most of us hold stress without realizing it.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new RelaxJawInstruction({
			voice: `Let your jaw soften. Let it hang slightly open if it wants to. Teeth not touching. Tongue resting.`,
			duration: 6000,
			audio: {
				binaural: {
					hertz: 7
				}
			}
		}),

		new ReadInstruction({
			voice: `Notice how the rest of your face follows. When the jaw releases, tension has nowhere left to hide.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 12: BREATH
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Now, your breath. I'm not going to ask you to breathe any particular way.`,
			text: 'Your breath',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Just notice your breathing. And allow it to slow naturally if it wants to. Your body knows the rhythm it needs.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Three slow breaths. In through your nose. Out through your mouth. Let each exhale carry away a little more tension.`,
			text: '',
			cooldown: 8000,
			audio: {
				binaural: {
					hertz: 7.5
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Notice how you feel now compared to when we started.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 13: GAZE DIRECTION
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Sometimes I'll guide your gaze. Ask you to look up, or down, or to the side.`,
			text: 'Gaze direction',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Different gaze positions activate different parts of your nervous system. Looking down tends to be calming. Looking up can feel more activating or open.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new DirectionalGazeInstruction({
			voice: `Lower your gaze slightly now. Just enough to feel a subtle shift. Keep the blue light visible.`,
			prompt: 'Lower your gaze',
			direction: 'DOWN',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		new ReadInstruction({
			voice: `Good. Notice if that changed anything. Even slightly.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 14: HEAD MOVEMENT
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Sometimes during a session, I'll ask you a question. You can answer without speaking—just by nodding or shaking your head.`,
			text: 'Answering without speaking',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `This lets you respond while staying relaxed.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new NodInstruction({
			voice: `If you understand, nod gently now.`,
			prompt: 'Nod yes',
			type: 'YES',
			audio: {
				binaural: {
					hertz: 9
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

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 15: VOICE
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Finally, your voice. Speaking something aloud engages your body differently than just thinking it.`,
			text: 'Your voice',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `The words become more real. More felt.`,
			text: '',
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
		// SECTION 16: THE INNER VOICE
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `One more thing. You might notice a part of your mind commenting on all of this. Judging it. Wondering if it's working. Feeling a little silly.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `That's normal. That part can watch. It doesn't have to stop.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `But there's another part too. The part that's actually feeling your breath. Actually noticing your body. Actually curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `You can let both exist. They don't have to agree.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 17: NAMING THE SHIFT
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Take a moment to notice how you feel right now.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `Compare it to how you felt when you first opened the app. Something has shifted. Maybe subtle. Maybe not.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		new ReadInstruction({
			voice: `This feeling—this particular quality of calm readiness—you can return to it. Anytime you sit down with this app, this is your starting point. Your body will begin to remember. Faster each time.`,
			text: '',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 18: WHAT HAPPENS AFTER
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `When you finish a session, you might feel different for a while. Softer. Slower. A little more present.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `You can let that linger. You don't have to shake it off and rush back to normal. The transition back can be gradual. That's part of the practice too.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 19: THE PATH
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Each time you return, something will be different. Not because you're forcing progress. But because your nervous system is learning.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `What feels effortful now will become automatic. What feels subtle now will become profound.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `This is just the beginning.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 20: YOUR WHY
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `You're here for a reason. You don't have to name it. You might not even fully know what it is.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `But some part of you reached for something. Something quieter. Or stronger. Or more free.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		new ReadInstruction({
			voice: `That impulse is worth trusting.`,
			text: '',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 21: SUMMARY
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `You've just learned everything you need.`,
			text: "What you've learned",
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		new ReadInstruction({
			voice: `Be still. Relax your face. Breathe. Follow along. Stay curious.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		new ReadInstruction({
			voice: `Your body already knows how to do this. This app just helps you remember.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		}),

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 22: CLOSING
		// ═══════════════════════════════════════════════════════════════════════════

		new ReadInstruction({
			voice: `Next, you have a choice. You'll see a few introductory sessions to choose from. Each one is designed for beginners. Each offers something different. There's no wrong choice. Trust your instinct. When you're ready, select the one that feels right.`,
			text: '',
			audio: {
				binaural: {
					hertz: 11
				}
			}
		})
	]
}
