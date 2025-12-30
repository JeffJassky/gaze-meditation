import type { Session } from '../types'

export const heldWithoutRope: Session = {
	id: 'held_without_rope',
	title: 'Held Without Rope',
	isAdult: true,
	skipIntro: true,
	description:
		'A 25-minute session exploring sensation, surrender, and the feeling of being held by nothing but attention and words.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	scenes: [
		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 1: ARRIVAL + YES-SET
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `You're here again, back in this space. Your body already resting somewhere — sitting, lying down, however you've arranged yourself...Already breathing, already present, already beginning to settle.`,
			text: 'Welcome back',
			audio: {
				binaural: {
					hertz: 10
				}
			},
		},

		{
			voice: `You've done this before, maybe once, maybe more. You already know how to settle, how to quiet, how to find the way down.`,
			text: ''
		},

		{
			voice: `So let's begin with something simple.`,
			text: ''
		},

		{
			voice: `Do you want to be hypnotized right now? Not later, not in theory, but right now, in this moment. If so, nod your head yes.`,
			text: 'Nod yes',
			behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},

		{
			voice: `And would you like to follow along and see what happens?`,
			text: 'Nod yes again.',
			behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},

		{
			voice: `Good. Place your hands on your lap now, palms down, resting comfortably. Not gripping anything, not holding anything... Just hands resting.`,
			text: ''
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 4000 }]
            }
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 2: EYELID CATALEPSY
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Now, allow your eyes to gently close... And bring your attention to your eyelids. Just your eyelids — nothing else matters right now.`,
			text: 'Close your eyes',
			behavior: {
                suggestions: [{ type: 'eyes:close', duration: 3000 }]
            },
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Relax them. Really relax them. Let them become heavy, comfortable, at ease... like they've been waiting all day for the opportunity to rest.`,
			text: ''
		},

		{
			voice: `Make them so relaxed, so perfectly content where they are, that in a moment, when I ask you to try to open them, they won't want to. Not because they can't but because they're so comfortable... they'd just rather stay closed.`,
			text: ''
		},

		{
			voice: `Feel that heaviness gathering now. Pleasant weight settling over your eyes like a blanket. Heavy, warm, content.`,
			text: '',
			audio: {
				binaural: {
					hertz: 8
				}
			},
			cooldown: 5000
		},

		{
			voice: `And when you're certain they won't open even if you try — test it now. Try to open your eyes.`,
			text: 'Test it now',
			cooldown: 4000
		},

		{
			voice: `Notice what happens... Maybe they stay closed, maybe they flutter slightly... Whatever happens, that's your body showing you something important about itself. It responds to focus, to words, to your own attention.`,
			text: ''
		},

		{
			voice: `Stop trying now. Just allow them rest. They've already shown you what they can do.`,
			text: ''
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 3: FRACTIONATION
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `In a moment I'm going to ask you to open your eyes briefly. When you close them again, you'll go deeper than before. Each time the eyes close, the body takes you further down.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `Open your eyes now, just for a moment.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            }
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 3000 }]
            }
		},

		{
			voice: `And close them. Just a little deeper this time.`,
			text: 'Close your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:close' }]
            }
		},

		{
			voice: `Again, open your eyes... Just enough for the light to come in.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            }
		},

		{
			voice: `Notice how much they want to close, how much they prefer the dark. Hold them open... feel the pull...`,
			text: 'Feel the weight'
		},

		{
			voice: `And down. Closed. All the way down now. Feel how good that feels... How much easier it is to be here than up there.`,
			text: 'Close your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:close' }]
            },
			audio: {
				binaural: {
					hertz: 6
				}
			}
		},

		{
			voice: `Your body is relaxing now. You can feel it happening — the muscles loosening, the weight settling. But let's find out just how much.`,
			text: ''
		},

		{
			voice: `Focus on one of your arms, your right or your left, whichever you notice first. Notice its weight... as gravity pulls it down... allow it to rest on your leg.`,
			text: ''
		},

		{
			voice: `Maybe it feels heavy... Or maybe it feels light... Just notice what's there.`,
			text: '',
			cooldown: 5000
		},

		{
			voice: `Let the weight of your arm double... Relaxing... The muscles becoming loose...`,
			text: ''
		},

		{
			voice: `Again, letting the weight double... Twice as much... resting more fully against your leg.`,
			text: ''
		},

		{
			voice: `Now allowing that weight to triple... Three times as much...`,
			text: '',
			cooldown: 5000
		},

		{
			voice: `So heavy that if someone tried to lift it and let it go, it would fall right back down.`
		},

		{
			voice: `Completely loose... no resistance... just gravity, and relaxation.`,
			cooldown: 5000
		},

		{
			voice: `In a moment I'm going to ask you to count. Starting at one and counting upward... As you count, the numbers will begin to drift away. Softening.. One by one..`,
			text: ''
		},

		{
			voice: `The numbers will fade further from your mind... harder to hold onto... like trying to grip water as it flows through your fingers.`,
			text: ''
		},

		{
			voice: `The numbers will become distant... foggy... unimportant... Until at some point you won't want to count anymore... and the numbers... are just... gone... out of your mind... like smoke, through an open window...`
		},

		{
			voice: `Begin counting now, out loud or silently, starting at one.`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `As you're counting notice the numbers getting further... and further... away... More distant... more foggy...`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `Their shapes... becoming less and less distinct... their edges blurring as their distance grows.`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `Letting them drift further... and further... until you can't find the next one.`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `When the numbers are gone — completely gone, when you can't find the next one — gently nod your head, or drop your gaze to let me know.`,
			text: 'Lower your gaze',
            behavior: {
                suggestions: [{ type: 'head:down' }]
            }
		},

		{
			voice: `The mind is quiet now... Empty of numbers... Empty of effort... Just... stillness.`,
			text: '',
			audio: {
				binaural: {
					hertz: 5
				}
			}
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 4: DEEPENING
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Imagine a way down... A staircase into soft darkness, an elevator descending, a feeling of sinking into something deeper.... However down appears to you, let that form be your guide.`,
			text: '',
			cooldown: 5000
		},

		{
			voice: `As you have that form, you'll begin descendng`
		},

		{
			voice: `Five... starting to descend... down... the first layer of depth.`
		},

		{
			voice: `Four... the world above fading... Sounds and light growing distant.`,
			audio: {
				binaural: {
					hertz: 5
				}
			}
		},

		{
			voice: `Three... body heavier... mind quieter... less, and less, to think about.`
		},

		{
			voice: `Two... almost there... a place of stillness is approaching.`,
			text: '2'
		},

		{
			voice: `One... all the way down... resting at the bottom.`,
			text: '1',
			audio: {
				binaural: {
					hertz: 4
				}
			},
			cooldown: 5000
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 5: DISCOVERY — HAND TO LEG
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `So far, you've felt your eyes stay closed when you tried to open them. Your mind and body responding to nothing but words... focus... and attention...`,
			text: ''
		},

		{
			voice: `Bring your attention to one of your hands... whichever one is resting on your leg. Feel where it touches... The warmth there... Where skin meets fabric... or skin meets skin... That point of contact.`,
			text: ''
		},

		{
			voice: `Now notice something more specific. Feel where the hand crosses the curve of your thigh... the particular shape of muscle beneath, the way the palm settles... The warmth isn't just general warmth. It's concentrated... where you're paying attention, the warmth builds up.`,
			text: ''
		},

		{
			voice: `Let that warmth become weight... As if the warmth itself has mass... As if the connection between the hand and your leg is growing heavier and denser with each breath.`,
			text: ''
		},

		{
			voice: `Weight becoming connection. As if gravity acts stronger on it... Connection becoming something that holds the hand there. Not gripping — just preferring to stay... Resting heavily... Like the hand has found its exact right place and sees no reason to move.`,
			text: ''
		},

		{
			voice: `The longer you focus, the more the hand belongs exactly where it is.`,
			text: ''
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 5000 }]
            }
		},

		{
			voice: `You might want to test it. Go ahead — try to lift that hand. Just a small attempt.`,
			text: ''
		},

		{
			voice: `Notice what happens. Maybe it lifts easily. Or maybe it doesn't want to move... Maybe it feels stuck, or heavy, or simply uninterested in going anywhere... Whatever happens is your body showing you something about itself.`,
			text: ''
		},

		{
			voice: `If it stays, just notice how it feels to have your hand held in place by nothing but warmth and the weight of your own attention.`,
			text: '',
			cooldown: 6000
		},

		{
			voice: `It's as if something stops trying... because trying feels unimportant... There's only rest... Just allowing... the stillness.`,
			text: '',
			audio: {
				binaural: {
					hertz: 4
				}
			},
			cooldown: 4000
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 6: RELEASING FIRST BOND + THE GAP
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `The connection is thinning now... The warmth fading... The weight lifting... gradually...`,
			text: ''
		},

		{
			voice: `Three... loosening... dissolving...`,
			text: ''
		},

		{
			voice: `Two... releasing... fading...`,
			text: ''
		},

		{
			voice: `One... Your hand... is free.`,
			text: ''
		},

		{
			voice: `Move your fingers slightly. Feel the freedom return.`,
			text: ''
		},

		{
			voice: `And notice something else: part of you almost misses it... Part of you preferred being held... There's something comfortable about not being able to move... Something right about it.`,
			text: ''
		},

		{
			voice: `That preference... of wanting to be held in place... that's interesting... Because now there's a question forming somewhere in you.`,
			text: ''
		},

		{
			voice: `What would it feel like to be held even more deliberately?... Even more, completely...`,
			text: ''
		},

		{
			voice: `What would it feel like to really not be able to move — not your hand stuck to your leg, but... something that holds you more...`
		},

		{
			voice: `Something, that wraps, around you... Something you can feel against your skin... Something that doesn't let go, until it decides to...`,
			cooldown: 6000
		},

		{
			voice: `Would you like to try that?... Would you like to find out what that feels like?`
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 7: WRISTS TOGETHER
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Bring your attention to your wrists now. Both of them. The inner wrists, where the skin is thin... and you can feel your pulse. That soft, vulnerable part of each arm.`,
			text: '',
			audio: {
				binaural: {
					hertz: 4
				}
			}
		},

		{
			voice: `Notice them separately first... Your left wrist... Your right wrist... Wherever they might be resting.`,
			text: ''
		},

		{
			voice: `Now... notice the space between them. The air... The distance...`,
			text: ''
		},

		{
			voice: `And something in that space. Faint at first... a pull. Like two magnets at the edge of their range, just beginning to sense each other.`,
			text: ''
		},

		{
			voice: `The pull getting stronger as you notice it... The more attention you give it, the stronger it becomes... Your hands beginning to drift... Each toward the other.`,
			text: ''
		},

		{
			voice: `Closer now. Drawn together by something invisible, and growing in strength... Closer still....`,
			text: ''
		},

		{
			voice: `Until they touch... Your wrists meeting, making contact.`,
			text: ''
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 3000 }]
            }
		},

		{
			voice: `Wrists now gently pressed against each other. And free — you could separate them anytime. Nothing holding them together except their proximity.`,
			text: ''
		},

		{
			voice: `Notice that freedom for a moment.`,
			text: ''
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 3000 }]
            }
		},

		{
			voice: `And now... notice it being taken.`,
			text: '',
			audio: {
				binaural: {
					hertz: 3
				}
			}
		},

		{
			voice: `Something beginning to wrap around your wrists...You can feel its texture... Thousands of tiny fibers pressing into the soft skin on the back of your wrists.`,
			text: ''
		},

		{
			voice: `An earthy, fibrous scent gently fills the air. Hemp. Jute. Something organic... Rope. Cool at first, then warming from your body heat.`,
			text: ''
		},

		{
			voice: `Looping around both wrists... snug against your skin... You feel the slight roughness... The way it settles into that valley between the small bones of each wrist, where you're most easily held.`
		},

		{
			voice: `Another loop... Tighter now. More secure. The pressure building.`,
			text: ''
		},

		{
			voice: `One last loop... Doubling over the others... The hold undeniable now — three loops of rope wrapped around your wrists, keeping them exactly where they are.`,
			text: ''
		},

		{
			voice: `And now a knot being placed... You hear it. The soft sound of rope being pulled through rope... fibers against fibers. Friction building a small amount of heat... Then... the cinch. The tightening. The knot pulled secure.`,
			text: ''
		},

		{
			voice: `Bound together... Wrists locked... You... are not going anywhere.`
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 5000 }]
            }
		},

		{
			voice: `Feel the weight of the rope... There's length to it — it goes somewhere. You don't know where. Out into the space around you... Attached to something you can't quite see.`,
			text: ''
		},

		{
			voice: `Try to pull your wrists apart now. Really try.`,
			text: ''
		},

		{
			voice: `Notice what happens. The rope doesn't give. It holds... And the harder you try, the more it tightens, the more it pulls back, the more it reminds you... you're not getting out of this. Not until the rope decides to let you go.`,
			text: ''
		},

		{
			voice: `No need to struggle any further... The rope has you. At this point... Just... feel what that's like. Bound. Held...`,
			text: '',
			audio: {
				binaural: {
					hertz: 3
				}
			}
		},

		{
			voice: `And notice something even more interesting now... Something in the part of you that makes decisions. The part that's always calculating, always planning, always three steps ahead. That part has nothing to do here. The rope has taken its job away.`,
			text: ''
		},

		{
			voice: `And instead of panic... relief.`,
			text: ''
		},

		{
			voice: `Permission to stop. Permission to simply be held. Permission to let something else be in charge for once.`,
			text: '',
			duration: 5000
		},

		{
			voice: `And now... feel the rope tug.`,
			text: ''
		},

		{
			voice: `A gentle pull. Forward. Your wrists drawn toward something, in some direction. Your shoulders follow. Your chest follows. Your whole body leaning slightly toward wherever the rope is leading.`,
			text: ''
		},

		{
			voice: `Feel the direction of it. Not hard, not demanding.. but certain. A pull that doesn't negotiate.`,
			text: '',
			cooldown: 8000
		},

		{
			voice: `Another tug now. Firmer this time... The rope reminding you it's there... that you're connected to something beyond yourself.`,
			text: ''
		},

		{
			voice: `And the pull is asking something of you... Not in words — but a curiosity you can sense... What would it be like, to follow?... What would it be like to let the rope take you wherever it leads?`,
			text: ''
		},

		{
			behavior: {
                suggestions: [{ type: 'head:still', duration: 10000 }]
            }
		},

		{
			voice: `Something is responding in your body right now. You know where. It might be your chest, your stomach, somewhere else entirely. But something is responding to being pulled. To being held. To not being in control.`,
			text: ''
		},

		{
			voice: `You don't have to name it. Just feel it. Just let it be what it is.`,
			text: '',
			duration: 8000
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 8: DWELLING
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Wrists bound. Rope tight. Body pulled toward something you can't see.`,
			text: '',
			audio: {
				binaural: {
					hertz: 3
				}
			}
		},

		{
			voice: `Nowhere to go. Nothing to do. Nothing to figure out or fix.`,
			text: ''
		},

		{
			voice: `The body can relax. The mind can stop. Everything can be... exactly... what it is.`,
			text: ''
		},

		{
			voice: `Just this.`,
			text: 'Just this'
		},

		{
			voice: `Time does a strange thing here... You might not know how long you've been held. Seconds.. maybe minutes... or how long you'll be held for.`,
			text: ''
		},

		{
			voice: `Time, like the rope has become circular... looping over itself. You.. are bound... inside of it.`,
			cooldown: 8000
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 9: RELEASE
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `The rope here, has done its job.... And it's time to gently begin letting you go.`
		},

		{
			voice: `The knot beginning to loosen... Slowly... the cinch softening. The tension releasing.`,
			text: '',
			audio: {
				binaural: {
					hertz: 4
				}
			}
		},

		{
			voice: `One loop... unwinding... sliding free... then... another...`,
			text: ''
		},

		{
			voice: `Then... the last loop... Releasing its hold... The ropes pressure dissolving... the scent of hemp fading into ordinary air.`
		},

		{
			voice: `Feel it sliding away from your skin... The texture disappearing... Gone.`,
			text: ''
		},

		{
			voice: `Feel the freedom return... Your wrists, gently, separating...`,
			text: ''
		},

		{
			voice: `As they separate, the marks remain... Not visible... but felt. The memory of being bound. The pressure where the loops were. Your skin remembers.`,
			text: '',
			cooldown: 5000
		},

		{
			voice: `And notice what it's like to be free again. Relief, maybe. But something else too... something that almost misses the rope... Something that could have stayed bound longer... Something already wondering when it will feel that again.`,
			text: '',
			cooldown: 5000
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 10: INTEGRATION
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Your eyes stayed closed when you tried to open them... Your hand stayed stuck to your leg... held by nothing but attention. Your wrists stayed bound, wrapped in rope that was never there... pulled by something you couldn't see.`,
			text: '',
			audio: {
				binaural: {
					hertz: 5
				}
			}
		},

		{
			voice: `All of this from words. All of this from focus. All of this from you — allowing it to happen, letting your body respond.`,
			text: ''
		},

		{
			voice: `That's something you know about yourself now. You're someone whose body does this. Someone who can feel what isn't there. Someone who can be held without hands... bound without rope.`,
			text: ''
		},

		{
			voice: `And you might find, in the days after this, that certain things remind you. The weight of a bracelet on your wrist... Sleeves that fit snugly... Someone's hand brushing yours... Your own wrists resting close together without thinking about it... Each of these might bring a faint sensation... just a moment, just a ghost... of what you've felt here.`,
			text: ''
		},

		{
			voice: `Not enough to hold you. Just enough to remind you.`,
			text: ''
		},

		{
			voice: `There's more to discover. This was just the beginning.`,
			text: ''
		},

		// ═══════════════════════════════════════════════════════════════════════════
		// SECTION 11: EMERGENCE
		// ═══════════════════════════════════════════════════════════════════════════

		{
			voice: `Coming back now... slowly.`,
			text: '',
			audio: {
				binaural: {
					hertz: 7
				}
			}
		},

		{
			voice: `One... awareness returning to your hands, and to your feet.`,
			text: 'One'
		},

		{
			voice: `Two... the weight of your body... where it rests... the surface beneath you.. feeling solid.`,
			text: 'Two'
		},

		{
			voice: `Three... sounds becoming clearer... the room around you... existing again.`,
			text: 'Three',
			audio: {
				binaural: {
					hertz: 9
				}
			}
		},

		{
			voice: `Four... take a deeper breath... feeling your lungs expand.`,
			text: 'Four'
		},

		{
			voice: `Five... energy returning to your limbs... fingers wanting to move... toes wanting to stretch.`,
			text: 'Five'
		},

		{
			voice: `Six... the room taking shape... Becoming aware of the walls and ceiling and space.`,
			text: 'Six'
		},

		{
			voice: `Seven... another deep breath... bringing you back.`,
			text: 'Seven',
			audio: {
				binaural: {
					hertz: 10
				}
			}
		},

		{
			voice: `Eight — head tilting upward slightly... almost there, present and alert.`,
			text: 'Eight'
		},

		{
			voice: `Nine... trance fading, but the memory, remaining.`,
			text: 'Nine',
			audio: {
				binaural: {
					hertz: 12
				}
			}
		},

		{
			voice: `Ten... Open your eyes now, slowly. Let them adjust.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            },
			cooldown: 5000
		},

		{
			voice: `Take your time... Notice how you feel...`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `When you're ready you might want to stretch your hands. Roll your shoulders. Feel your feet against the floor... Get a glass of water...`,
			text: '',
			cooldown: 10000
		},

		{
			voice: `Welcome back.`,
			text: 'Welcome back',
			cooldown: 5000
		},

		{
			voice: `Until next time.`,
			cooldown: 20000
		}
	]
}