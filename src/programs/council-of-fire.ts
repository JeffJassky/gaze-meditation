import type { Session } from '../types'

export const councilOfFireLong: Session = {
	id: 'prog_council_fire',
	title: 'The Council of Fire',
	description:
		'A deep hypnotic journey of ancestral recognition, calm authority, and steadiness.',
	tags: ['confidence'],
	audio: {
		musicTrack: '/audio/music.mp3',
		binaural: { hertz: 12 },
		soundboard: [
			{
				id: 'wind',
				path: '/sessions/prog_council_fire/audio/fx/MA_Beison_Winter_Wind_at_the_Edge_of_the_Forest_3_Long_with_Birds.mp3',
				volume: 1.25,
				loop: true,
				fadeInDuration: 5,
				fadeOutDuration: 5
			},
			{
				id: 'drums',
				path: '/sessions/prog_council_fire/audio/fx/drums.mp3',
				volume: 3,
				loop: true,
				fadeInDuration: 5,
				fadeOutDuration: 5
			},
			{
				id: 'fire',
				path: '/sessions/prog_council_fire/audio/fx/fire.mp3',
				volume: 1,
				loop: true,
				fadeInDuration: 3,
				fadeOutDuration: 3
			}
		]
	},
	spiralBackground: '/img/spiral.png',
	scenes: [
		// ============================================================
		// PHASE 1: THE UNTETHERING - Building the Yes-Set
		// ============================================================

		{
			voice: `Welcome. You are here now. You are breathing. Your heart is beating. These things are already true.`,
			text: 'Welcome'
		},

		{
			voice: `This is a long journey. There is nowhere else you need to be. Time belongs to you here. Now.`,
			text: ''
		},

		{
			voice: `Your body knows how to settle. It has done this ten thousand times before. Allow it to make small adjustments now.`,
			text: ''
		},

		{
			voice: `Uncross your legs if they are crossed. Let your hands rest where they naturally fall. Notice how the body knows comfort without being told.`,
			text: ''
		},

		{
			voice: `Choose a single point to rest your eyes upon.`,
			text: ''
		},

		{
			voice: `Notice how attention gathers there. Not by force. But by invitation.`,
			text: ''
		},

		{
			voice: `The edges of your vision begin to soften. Colors lose their urgency. The world doesn't disappear. It simply steps back. Awareness remains clear. Steady. Present.`,
			text: ''
		},

		{
			voice: `Allow your blinks to come slowly now. Heavy. Unhurried. Like waves returning to shore.`,
			text: 'Stillness',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 20000 }]
			}
		},

		{
			voice: `Each time your eyelids close, they feel more comfortable staying closed. Each time they open, the effort seems less necessary.`,
			text: ''
		},

		{
			voice: `You may close them now and let them rest.`,
			text: 'Close your eyes',
			behavior: {
				suggestions: [{ type: 'eyes:close' }]
			}
		},

		{
			voice: `Darkness is easy. The body knows how to be still. Nothing here requires effort.`,
			text: ''
		},

		{
			voice: `And when it feels natural, allow your eyes to open again.`,
			text: 'Open your eyes',
			behavior: {
				suggestions: [{ type: 'eyes:open' }]
			}
		},

		{
			voice: `Good. And in a moment I'll ask you to close them again for the remainder of the session. When you do, just let them rest, knowing there's nothing else you'll need to see.`,
			text: ''
		},

		{
			voice: `Now, allow yourself to rest your eyes closed.`,
			text: 'Close your eyes',
			behavior: {
				suggestions: [{ type: 'eyes:close' }]
			}
		},

		{
			voice: `Just relaxing in darkness... In stillness...`,
			text: '',
			cooldown: 5000
		},

		// ============================================================
		// PHASE 2: THE DESCENT - Sensory Immersion
		// ============================================================

		{
			voice: `Now, imagine that you are standing at the edge of a forest.`
		},

		{
			voice: `Not imagining hard. Just allowing the image to arrive.`,
			text: ''
		},

		{
			voice: `It's night time. The air against your skin is cold and clean. You can almost taste it. Sharp and ancient. Like water from deep stone.`,
			text: '',
			audio: {
				soundboard: [{ event: 'start', id: 'wind' }]
			}
		},
		{
			voice: `Above you, stars are beginning to appear. So many you could never count them. They've been here for longer than cities have existed.`,
			text: ''
		},

		{
			voice: `Beneath your feet, the earth is soft. Layers of fallen needles and moss. Your weight presses into it gently. The forest floor yields. And holds you.`,
			text: ''
		},

		{
			voice: `Let your gaze lower. As if looking down at this ground.`,
			text: 'Lower your gaze',
			behavior: {
				suggestions: [{ type: 'head:down' }]
			}
		},

		{
			voice: `You take a step forward. Then another. The vast forest around you like a living cathedral.`,
			text: ''
		},

		{
			voice: `And with each step, time begins to loosen its grip. Not vanishing. Just becoming less important.`,
			text: ''
		},

		// ============================================================
		// PHASE 3: THE TIME WALK - Embodied Regression
		// ============================================================

		{
			voice: `Walking deeper into these trees, you notice the sounds of the modern world fading. No engines. No electricity. No hurry.`,
			text: '',
			audio: { binaural: { hertz: 8 } }
		},

		{
			voice: `The years begin to fall away. Not counting. Just releasing. Layer after layer. Decade after decade. `,
			text: ''
		},

		{
			voice: `The trees grow older. The path grows quieter. Time softens into something that doesn't need a name.`,
			text: ''
		},

		{
			voice: `Your jaw softens. Your breath deepens without trying. Centuries fall away. Fading like fog.`,
			text: 'Soften your jaw',
			behavior: {
				suggestions: [{ type: 'mouth:relax', duration: 15000 }]
			}
		},

		{
			voice: `You pass a tree so wide it would take five people to circle it. This tree was ancient before machines were imagined.`,
			text: ''
		},

		{
			voice: `Millennia pass by. The silence becomes more complete. Not empty. But full of older sounds. Wind through branches. The shift of an animal. The fall of your feet on the ground.`,
			text: ''
		},

		{
			voice: `No stone roads. Only paths worn by footsteps over centuries.`,
			text: ''
		},

		{
			voice: `The darkness is complete now. But your eyes have adjusted. You can see by starlight. By some inner compass.`,
			text: ''
		},

		{
			voice: `You walk in silence. Breath matching footsteps. Footsteps matching heartbeat.`,
			text: 'Stillness',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 25000 }]
			}
		},

		{
			voice: `A thousand years ago. Two thousand. Time has no borders here.`,
			text: ''
		},

		{
			voice: `You are simply a traveler. One of countless travelers who have walked this same ground. Their footsteps beneath yours.`,
			text: ''
		},

		// ============================================================
		// PHASE 4: THE SUMMONING - Primal Rhythm
		// ============================================================

		{
			voice: `In the distance. So faint you're not sure if you're hearing it or feeling it. There is a drum.`,
			text: ''
		},

		{
			voice: `Slow. Rhythmic. Like the pulse of the earth itself.`,
			text: '',
			audio: {
				soundboard: [{ event: 'start', id: 'drums' }]
			}
		},

		{
			voice: `Your breath begins to sync with it. Not deliberately. But the way breath always finds rhythm with drums.`,
			text: ''
		},

		{
			voice: `Each beat pulls you forward gently. Not commanding. Welcoming, like the drum is saying: Come this way.`,
			text: ''
		},

		{
			voice: `And as you walk, you begin to smell something. Woodsmoke. A sweet, resinous smoke of pine and oak.`,
			text: ''
		},

		// ============================================================
		// PHASE 5: THE THRESHOLD - The Sacred Approach
		// ============================================================

		{
			voice: `Ahead, through the trees, you see light. A glow, the deep orange color of flame.`,
			text: ''
		},

		{
			voice: `It flickers between the trunks as you approach. Growing brighter with each step.`,
			text: ''
		},

		{
			voice: `The faint sound of wood crackling reverberates off the tree trunks and forest canopy.`
		},

		{
			voice: `The trees open into a clearing. Circular. Natural. As if the forest chose this place itself.`,
			text: ''
		},

		{
			voice: `At the center burns a fire. It does not flicker wildly. It burns Steady. As if it has been burning for centuries.`,
			text: 'The fire'
		},

		{
			voice: `You stop at the edge of the light. Something in you knows. This circle does not accept what is carried heavily.`,
			text: ''
		},

		{
			voice: `You become aware of a weight you've been carrying. `,
			text: ''
		},

		{
			voice: `You don't need to name it. Your body knows what it is instinctively.`
		},

		{
			voice: `The body also knows how to set things down.`
		},

		{
			voice: `If it feels right, imagine setting this weight down. Like removing a heavy pack after a long journey.`,
			text: ''
		},

		{
			voice: `You can always retrieve it later if you choose. But here. Now. It serves no purpose.`,
			text: ''
		},

		{
			voice: `You reach back. One strap slides from your shoulder. Then the other.`
		},

		{
			voice: `You gently set the weight down, as it settles on the ground behind you.`
		},

		{
			voice: `Notice the release in your body. How your chest opens. How the breaths move more deeply, with less effort.`,
			text: ''
		},

		{
			voice: `This is how your body stands when it's allowed to fully rest.`,
			text: ''
		},

		{
			voice: `When you feel ready, step into the circle.`,
			text: 'Are you ready?',
			behavior: {
				suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
			}
		},

		// ============================================================
		// PHASE 6: THE COUNCIL - Recognition
		// ============================================================

		{
			voice: `The fire burns at the center. You can feel the warmth beginning to reach your face. Your chest. Your hands. Warm. Welcoming.`,
			text: '',
			audio: {
				binaural: { hertz: 5 },
				soundboard: [
					{ event: 'start', id: 'fire' },
					{ event: 'stop', id: 'wind' },
					{ event: 'stop', id: 'drums' }
				]
			}
		},

		{
			voice: `Let your eyes rest on the flames. Watching them move. Ancient. Hypnotic. Alive.`,
			text: 'Watch the flames'
		},

		{
			voice: `And as your eyes adjust to the firelight, you notice you are not alone.`,
			text: ''
		},

		{
			voice: `Around the fire, seated in a circle, are the Elders.`
		},

		{
			voice: `Their faces are weathered like canyon stone. Their eyes are calm. Patient.`
		},

		{
			voice: `Turn your head gently to the left. Observing them.`,
			text: 'Look left',
			behavior: {
				suggestions: [{ type: 'head:left' }]
			}
		},

		{
			voice: `Some are very old. Others are younger, but carry themselves with the same stillness. They have seen empires rise and fall like tides. They have watched seasons turn a thousand times. They are not impressed by noise.`,
			text: ''
		},

		{
			voice: `Turn gently to the right. Meeting more eyes.`,
			text: 'Look right',
			behavior: {
				suggestions: [{ type: 'head:right' }]
			}
		},

		{
			voice: `Some are Warriors, their scars visible even in firelight. They have known conflict but their hands rest easy now. They are still when stillness serves, and ready when readiness matters.`,
			text: ''
		},

		{
			voice: `You do not know their names. But you know their blood. It moves through you at this very moment. In your veins. In your bones. In the way you stand.`,
			text: ''
		},

		{
			voice: `They do not judge you. They do not measure you. They do not instruct or correct. They simply recognize.`,
			text: ''
		},

		{
			voice: `Whatever arises here is welcome. If emotion surfaces, let it move through. If stillness comes, let that be enough. There is no correct way to sit at this fire.`,
			text: ''
		},

		{
			voice: `And in that recognition, something in your chest loosens. A knot you didn't know you were carrying. The need to be more. Or less. Or different. It dissolves in the firelight.`,
			text: ''
		},

		{
			voice: `One of the Elders gestures toward an empty place by the fire. Not commanding, but offering. The space has been waiting for you.`,
			text: ''
		},

		{
			voice: `You move to it and sit. Your posture settling naturally. Spine straight. Shoulders easy. Breath deep.`,
			text: 'Take your seat',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 20000 }]
			}
		},

		{
			voice: `As you settle, you become aware of a presence. Many presences. Thousands. Stretching back into the darkness beyond the firelight.`,
			text: ''
		},

		{
			voice: `These are your ancestors. Your lineage. Some share your blood. Others share your path. Teachers. Survivors. People whose names you'll never know, but whose strength still echoes in you.`,
			cooldown: 8000
		},

		{
			voice: `Every person who faced their own fires. Their own nights. They walked this same forest path.`
		},

		{
			voice: `They stand behind you now. At your back. Recognizing. Witnessing.`
		},

		// ============================================================
		// PHASE 7: THE TESTING - Pressure and Proof
		// ============================================================

		{
			voice: `The fire brightens for a moment. Some would lean back. Some would close their eyes. Some would turn away.`,
			text: ''
		},

		{
			voice: `You notice that you don't move. Your breath remains steady. Your body remains still. Not by trying. But by trusting.`,
			text: ''
		},

		{
			voice: `The heat is not your enemy. You have been tempered by older fires than this.`,
			text: ''
		},

		{
			voice: `The flames settle again. And in that moment, you understand something without words. Strength is not the absence of heat. It is presence within it.`,
			text: ''
		},

		// ============================================================
		// PHASE 8: THE EMBER - The Gift
		// ============================================================

		{
			voice: `One of the Elders rises. Slowly. Deliberately. They reach into the fire with bare hands.`,
			text: ''
		},

		{
			voice: `They lift out a single ember. It glows a deep orange. White hot at its core, but it does not burn.`,
			text: 'The ember'
		},

		{
			voice: `The Elder turns to you. They do not force it toward you. They do not command you to take it. They simply hold it forward. Offering.`,
			text: ''
		},

		{
			voice: `If it feels right, you lean forward slightly. The ember moves toward your chest. Hovering just above your heart.`,
			text: ''
		},

		{
			voice: `You feel warmth there. Not burning. Not overwhelming. Steady. Like the warmth of sun on skin after a long winter.`,
			text: ''
		},

		{
			voice: `The ember does not enter you. It reveals what was always there. A fire that has been burning quietly deep within you. Waiting to be discovered.`,
			text: '',
			cooldown: 7000
		},

		{
			voice: `Let this warmth register as familiar. As if you are remembering rather than learning. As if this steadiness has always lived in you.`
		},

		{
			voice: `The Elder returns the ember to the fire. But the warmth in your chest remains. It does not fade. It does not need the fire to sustain it. It is yours now.`,
			text: ''
		},

		// ============================================================
		// PHASE 9: THE RECOGNITION - Claiming the Seat
		// ============================================================

		{
			voice: `A warrior across the fire meets your eyes. Holds your gaze for a long moment. Then gently inclines their head once. Not with approval, or permission, but recognition. `,
			text: ''
		},

		{
			voice: `You are not a visitor here. You are one of them. This seat was never given to you. It was always yours. You are simply sitting in it now.`,
			text: '',
			cooldown: 8000
		},

		// ============================================================
		// PHASE 10: THE POST-HYPNOTIC EMBEDDING
		// ============================================================

		{
			voice: `Imagine now. Tomorrow. Or the next day. Something challenges you.`,
			text: ''
		},

		{
			voice: `A difficult conversation, or a challenging moment. Tension rises in your chest. Your jaw begins to tighten. Old reflexes activate.`,
			text: ''
		},

		{
			voice: `But in that moment. Before words form. Before action happens. You feel it - The warmth, the ember, the steadiness.`,
			text: ''
		},

		{
			voice: `Your breath deepens.`,
			text: ''
		},

		{
			voice: `Your shoulders lower.`,
			text: ''
		},

		{
			voice: `You act from a new place. A place of presence. A place of strength.`,
			text: ''
		},

		{
			voice: `This will not happen every time. But now, the pathway is set. The memory is there. And it will lead you where you want to go.`,
			text: ''
		},

		{
			voice: `All you need to do now is remember.`,
			text: '',
			cooldown: 8000
		},

		// ============================================================
		// PHASE 11: THE RETURN - Integration
		// ============================================================
		{
			voice: `You stand from the fire. Slowly. Carrying nothing that doesn't serve you. Leaving nothing that does.`,
			text: '',
			audio: {
				binaural: { hertz: 7 }
			}
		},

		{
			voice: `The Elders do not say goodbye. They simply hold your gaze. One by one. A silent acknowledgment that you will return. That you have always been welcome here. That this place is your home. This is inside of you.`,
			text: '',
			audio: {
				soundboard: [{ event: 'stop', id: 'fire' }]
			}
		},

		{
			voice: `The warmth in your chest remains steady. It does not depend on the fire. It does not depend on this place. It is yours now. Fully. Completely.`,
			text: ''
		},

		{
			voice: `You turn from the circle. The forest receives you again. But you walk differently now. Something has settled into your bones.`,
			text: ''
		},

		{
			voice: `And as you walk, time begins to return. Gently. Like water filling a vessel.`,
			text: ''
		},

		{
			voice: `One thousand years pass. The ember glows steady in your chest.`,
			text: '',
			audio: { binaural: { hertz: 8 } }
		},

		{
			voice: `Fifteen hundred years. Your breath remains deep and slow.`,
			text: ''
		},

		{
			voice: `Eighteen hundred years. You begin to feel the edges of the room around you.`,
			text: ''
		},

		{
			voice: `Nineteen hundred years. The chair beneath you becomes more solid. More present.`,
			text: '',
			audio: { binaural: { hertz: 10 } }
		},

		{
			voice: `Two thousand years. Almost home now.`,
			text: ''
		},

		{
			voice: `And as you approach the present moment, I'm going to count from one to ten. With each number, you'll return more fully. More comfortably. More completely.`,
			text: 'Returning'
		},

		{
			voice: `One. Beginning to return now. The forest growing distant. The fire becoming a memory you can access whenever you choose.`,
			text: '1',
			audio: {
				soundboard: [{ event: 'stop', id: 'wind' }]
			}
		},

		{
			voice: `Two. Awareness returning to your body. Your feet. Your hands. The weight of yourself in the chair.`,
			text: '2'
		},

		{
			voice: `Three. The sounds of this room becoming clearer. The hum of the world returning. Not jarring. Just present.`,
			text: '3',
			audio: { binaural: { hertz: 11 } }
		},

		{
			voice: `Four. The warmth in your chest remains. Steady. Available. A resource you carry forward.`,
			text: '4'
		},

		{
			voice: `Five. Halfway back now. Your mind beginning to organize itself. Thoughts returning like birds settling into branches.`,
			text: '5'
		},

		{
			voice: `Six. Feeling more alert. More present. The heaviness in your limbs beginning to lift.`,
			text: '6',
			audio: { binaural: { hertz: 12 } }
		},

		{
			voice: `Seven. Take a deeper breath now. Letting oxygen reach every part of you. Feeling your lungs expand fully.`,
			text: 'Breathe in'
		},

		{
			voice: `8. Almost fully present. You might notice your fingers wanting to move. Your jaw wanting to stretch. Let your body wake in whatever way feels natural.`,
			text: '8'
		},

		{
			voice: `9. The room is clear now. Solid. You are here. Grounded. The council remains available whenever you choose to return`,
			text: '9',
			audio: { binaural: { hertz: 14 } }
		},

		{
			voice: `Ten. Opening your eyes. Looking around the room. Noticing your surroundings. Take your time.`,
			text: '10',
			cooldown: 5000
		},

		{
			voice: `Welcome back.`,
			text: 'Welcome back',
			cooldown: 5000
		},

		{
			voice: `Whatever you experienced is yours to keep. Whatever you need to process will unfold in its own time.`,
			text: ''
		},

		{
			voice: `Take a moment before you move. Let the experience settle.`,
			text: ''
		},

		{
			voice: `When you're ready, you might want to stretch your hands. Roll your shoulders. Feel your feet against the floor.`,
			text: '',
			cooldown: 5000
		},

		{
			voice: `Until next time.`,
			text: '',
			cooldown: 20000
		}
	]
}

export default councilOfFireLong
