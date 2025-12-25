import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NodInstruction,
	NoBlinkInstruction,
	DirectionalGazeInstruction,
	RelaxJawInstruction,
	OpenEyesInstruction,
	CloseEyesInstruction
} from '../instructions'

export const councilOfFireLong: Program = {
	id: 'prog_council_fire',
	title: 'The Council of Fire',
	description:
		'A deep hypnotic journey of ancestral recognition, calm authority, and steadiness.',
	tags: ['confidence'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 12 }
	},
	spiralBackground: 'img/spiral.png',
	instructions: [
		// ============================================================
		// PHASE 1: THE UNTETHERING - Building the Yes-Set
		// ============================================================

		new ReadInstruction({
			voice: `Welcome. You are here now. You are breathing. Your heart is beating. These things are already true.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `This is a long journey. There is nowhere else you need to be. Time belongs to you here. Now.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Your body knows how to settle. It has done this ten thousand times before. Allow it to make small adjustments now.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Uncross your legs if they are crossed. Let your hands rest where they naturally fall. Notice how the body knows comfort without being told.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Choose a single point to rest your eyes upon.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Notice how attention gathers there. Not by force. But by invitation.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The edges of your vision begin to soften. Colors lose their urgency. The world doesn't disappear. It simply steps back. Awareness remains clear. Steady. Present.`,
			text: ''
		}),

		new StillnessInstruction({
			voice: `Allow your blinks to come slowly now. Heavy. Unhurried. Like waves returning to shore.`,
			prompt: 'Stillness',
			duration: 20000
		}),

		new ReadInstruction({
			voice: `Each time your eyelids close, they feel more comfortable staying closed. Each time they open, the effort seems less necessary.`,
			text: ''
		}),

		new CloseEyesInstruction({
			voice: `You may close them now and let them rest.`,
			text: 'Close your eyes'
		}),

		new ReadInstruction({
			voice: `Darkness is easy. The body knows how to be still. Nothing here requires effort.`,
			text: ''
		}),

		new OpenEyesInstruction({
			voice: `And when it feels natural, allow your eyes to open again.`,
			text: 'Open your eyes'
		}),

		new ReadInstruction({
			voice: `Good. You're doing well.`,
			text: ''
		}),

		// ============================================================
		// PHASE 2: THE DESCENT - Sensory Immersion
		// ============================================================

		new ReadInstruction({
			voice: `Now, imagine now that you are standing at the edge of a forest.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Not imagining hard. Just allowing the image to arrive.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `It's night time. The air against your skin is cold and clean. You can almost taste it. Sharp and ancient. Like water from deep stone.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Above you, stars are beginning to appear. So many you could never count them. They've been here for longer than cities have existed.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Beneath your feet, the earth is soft. Layers of fallen needles and moss. Your weight presses into it gently. The forest floor yields. And holds you.`,
			text: ''
		}),

		new DirectionalGazeInstruction({
			voice: `Let your gaze lower. As if looking down at this ground.`,
			prompt: 'Lower your gaze',
			direction: 'DOWN'
		}),

		new ReadInstruction({
			voice: `You take a step forward. Then another. The vast forest around you like a living cathedral.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `And with each step, time begins to loosen its grip. Not vanishing. Just becoming less important.`,
			text: ''
		}),

		// ============================================================
		// PHASE 3: THE TIME WALK - Embodied Regression
		// ============================================================

		new ReadInstruction({
			voice: `Walking deeper into these trees, you notice the sounds of the modern world fading. No engines. No electricity. No hurry.`,
			text: '',
			audio: { binaural: { hertz: 8 } }
		}),

		new ReadInstruction({
			voice: `The years begin to fall away. Not counting. Just releasing. Layer after layer. Decade after decade. `,
			text: ''
		}),

		new ReadInstruction({
			voice: `The trees grow older. The path grows quieter. Time softens into something that doesn't need a name.`,
			text: ''
		}),

		new RelaxJawInstruction({
			voice: `Your jaw softens. Your breath deepens without trying. Centuries fall away. Fading like fog.`,
			prompt: 'Soften your jaw',
			duration: 15000
		}),

		new ReadInstruction({
			voice: `You pass a tree so wide it would take five people to circle it. This tree was ancient before machines were imagined.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Millennia pass by. The silence becomes more complete. Not empty. But full of older sounds. Wind through branches. The shift of an animal. The fall of your feet on the ground.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `No stone roads. Only paths worn by footsteps over centuries.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The darkness is complete now. But your eyes have adjusted. You can see by starlight. By some inner compass.`,
			text: ''
		}),

		new StillnessInstruction({
			voice: `You walk in silence. Breath matching footsteps. Footsteps matching heartbeat.`,
			prompt: 'Stillness',
			duration: 25000
		}),

		new ReadInstruction({
			voice: `A thousand years ago. Two thousand. Time has no borders here.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You are simply a traveler. One of countless travelers who have walked this same ground. Their footsteps beneath yours.`,
			text: ''
		}),

		// ============================================================
		// PHASE 4: THE SUMMONING - Primal Rhythm
		// ============================================================

		new ReadInstruction({
			voice: `In the distance. So faint you're not sure if you're hearing it or feeling it. There is a drum.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Slow. Rhythmic. Like the pulse of the earth itself.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Your breath begins to sync with it. Not deliberately. But the way breath always finds rhythm with drums.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Each beat pulls you forward gently. Not commanding. Welcoming, like the drum is saying: Come this way.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `And as you walk, you begin to smell something. Woodsmoke. A sweet, resinous smoke of pine and oak.`,
			text: ''
		}),

		// ============================================================
		// PHASE 5: THE THRESHOLD - The Sacred Approach
		// ============================================================

		new ReadInstruction({
			voice: `Ahead, through the trees, you see light. A glow, the deep orange color of flame.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `It flickers between the trunks as you approach. Growing brighter with each step.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The faint sound of wood crackling reverberates off the tree trunks and forest canopy.`
		}),

		new ReadInstruction({
			voice: `The trees open into a clearing. Circular. Natural. As if the forest chose this place itself.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `At the center burns a fire. It does not flicker wildly. It burns Steady. As if it has been burning for centuries.`,
			text: 'The fire'
		}),

		new ReadInstruction({
			voice: `You stop at the edge of the light. Something in you knows. This circle does not accept what is carried heavily.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You become aware of a weight you've been carrying. `,
			text: ''
		}),

		new ReadInstruction({
			voice: `You don't need to name it. Your body knows what it is instinctively.`
		}),

		new ReadInstruction({
			voice: `The body also knows how to set things down.`
		}),

		new ReadInstruction({
			voice: `If it feels right, imagine setting this weight down. Like removing a heavy pack after a long journey.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You can always retrieve it later if you choose. But here. Now. It serves no purpose.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You reach back. One strap slides from your shoulder. Then the other.`
		}),

		new ReadInstruction({
			voice: `You gently set the weight down, as it settles on the ground behind you.`
		}),

		new ReadInstruction({
			voice: `Notice the release in your body. How your chest opens. How the breaths move more deeply, with less effort.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `This is how your body stands when it's allowed to fully rest.`,
			text: ''
		}),

		new NodInstruction({
			voice: `When you feel ready, step into the circle.`,
			prompt: 'Are you ready?',
			nodsRequired: 1,
			type: 'YES'
		}),

		// ============================================================
		// PHASE 6: THE COUNCIL - Recognition
		// ============================================================

		new ReadInstruction({
			voice: `The fire burns at the center. You can feel the warmth beginning to reach your face. Your chest. Your hands. Warm. Welcoming.`,
			text: '',
			audio: { binaural: { hertz: 5 } }
		}),

		new NoBlinkInstruction({
			voice: `Let your eyes rest on the flames. Watching them move. Ancient. Hypnotic. Alive.`,
			prompt: 'Watch the flames',
			duration: 15000
		}),

		new ReadInstruction({
			voice: `And as your eyes adjust to the firelight, you notice you are not alone.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Around the fire, seated in a circle, are the Elders.`
		}),

		new ReadInstruction({
			voice: `Their faces are weathered like canyon stone. Their eyes are calm. Patient.`
		}),

		new DirectionalGazeInstruction({
			voice: `Turn your head gently to the left. Observing them.`,
			prompt: 'Look left',
			direction: 'LEFT'
		}),

		new ReadInstruction({
			voice: `Some are very old. Others are younger, but carry themselves with the same stillness. They have seen empires rise and fall like tides. They have watched seasons turn a thousand times. They are not impressed by noise.`,
			text: ''
		}),

		new DirectionalGazeInstruction({
			voice: `Turn gently to the right. Meeting more eyes.`,
			prompt: 'Look right',
			direction: 'RIGHT'
		}),

		new ReadInstruction({
			voice: `Some are Warriors, their scars visible even in firelight. They have known conflict but their hands rest easy now. They are still when stillness serves, and ready when readiness matters.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You do not know their names. But you know their blood. It moves through you at this very moment. In your veins. In your bones. In the way you stand.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `They do not judge you. They do not measure you. They do not instruct or correct. They simply recognize.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Whatever arises here is welcome. If emotion surfaces, let it move through. If stillness comes, let that be enough. There is no correct way to sit at this fire.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `And in that recognition, something in your chest loosens. A knot you didn't know you were carrying. The need to be more. Or less. Or different. It dissolves in the firelight.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `One of the Elders gestures toward an empty place by the fire. Not commanding, but offering. The space has been waiting for you.`,
			text: ''
		}),

		new StillnessInstruction({
			voice: `You move to it and sit. Your posture settling naturally. Spine straight. Shoulders easy. Breath deep.`,
			prompt: 'Take your seat',
			duration: 20000
		}),

		new ReadInstruction({
			voice: `As you settle, you become aware of a presence. Many presences. Thousands. Stretching back into the darkness beyond the firelight.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `These are your ancestors. Your lineage. Some share your blood. Others share your path. Teachers. Survivors. People whose names you'll never know, but whose strength still echoes in you.`,
			cooldown: 8000
		}),

		new ReadInstruction({
			voice: `Every person who faced their own fires. Their own nights. They walked this same forest path.`
		}),

		new ReadInstruction({
			voice: `They stand behind you now. At your back. Recognizing. Witnessing.`
		}),

		// ============================================================
		// PHASE 7: THE TESTING - Pressure and Proof
		// ============================================================

		new ReadInstruction({
			voice: `The fire brightens for a moment. Some would lean back. Some would close their eyes. Some would turn away.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You notice that you don't move. Your breath remains steady. Your body remains still. Not by trying. But by trusting.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The heat is not your enemy. You have been tempered by older fires than this.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The flames settle again. And in that moment, you understand something without words. Strength is not the absence of heat. It is presence within it.`,
			text: ''
		}),

		// ============================================================
		// PHASE 8: THE EMBER - The Gift
		// ============================================================

		new ReadInstruction({
			voice: `One of the Elders rises. Slowly. Deliberately. They reach into the fire with bare hands.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `They lift out a single ember. It glows a deep orange. White hot at its core, but it does not burn.`,
			text: 'The ember'
		}),

		new ReadInstruction({
			voice: `The Elder turns to you. They do not force it toward you. They do not command you to take it. They simply hold it forward. Offering.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `If it feels right, you lean forward slightly. The ember moves toward your chest. Hovering just above your heart.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You feel warmth there. Not burning. Not overwhelming. Steady. Like the warmth of sun on skin after a long winter.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The ember does not enter you. It reveals what was always there. A fire that has been burning quietly deep within you. Waiting to be discovered.`,
			text: '',
			cooldown: 7000
		}),

		new ReadInstruction({
			voice: `Let this warmth register as familiar. As if you are remembering rather than learning. As if this steadiness has always lived in you.`
		}),

		new ReadInstruction({
			voice: `The Elder returns the ember to the fire. But the warmth in your chest remains. It does not fade. It does not need the fire to sustain it. It is yours now.`,
			text: ''
		}),

		// ============================================================
		// PHASE 9: THE RECOGNITION - Claiming the Seat
		// ============================================================

		new ReadInstruction({
			voice: `A warrior across the fire meets your eyes. Holds your gaze for a long moment. Then gently inclines their head once. Not with approval, or permission, but recognition. `,
			text: ''
		}),

		new ReadInstruction({
			voice: `You are not a visitor here. You are one of them. This seat was never given to you. It was always yours. You are simply sitting in it now.`,
			text: '',
			cooldown: 8000
		}),

		// ============================================================
		// PHASE 10: THE POST-HYPNOTIC EMBEDDING
		// ============================================================

		new ReadInstruction({
			voice: `Imagine now. Tomorrow. Or the next day. Something challenges you.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `A difficult conversation, or a challenging moment. Tension rises in your chest. Your jaw begins to tighten. Old reflexes activate.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `But in that moment. Before words form. Before action happens. You feel it - The warmth, the ember, the steadiness.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Your breath deepens.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Your shoulders lower.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You act from a new place. A place of presence. A place of strength.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `This will not happen every time. But now, the pathway is set. The memory is there. And it will lead you where you want to go.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `All you need to do now is remember.`,
			text: '',
			cooldown: 8000
		}),

		// ============================================================
		// PHASE 11: THE RETURN - Integration
		// ============================================================
		new ReadInstruction({
			voice: `You stand from the fire. Slowly. Carrying nothing that doesn't serve you. Leaving nothing that does.`,
			text: '',
			audio: { binaural: { hertz: 7 } }
		}),

		new ReadInstruction({
			voice: `The Elders do not say goodbye. They simply hold your gaze. One by one. A silent acknowledgment that you will return. That you have always been welcome here. That this place is your home. This is inside of you.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The warmth in your chest remains steady. It does not depend on the fire. It does not depend on this place. It is yours now. Fully. Completely.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You turn from the circle. The forest receives you again. But you walk differently now. Something has settled into your bones.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `And as you walk, time begins to return. Gently. Like water filling a vessel.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `One thousand years pass. The ember glows steady in your chest.`,
			text: '',
			audio: { binaural: { hertz: 8 } }
		}),

		new ReadInstruction({
			voice: `Fifteen hundred years. Your breath remains deep and slow.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Eighteen hundred years. You begin to feel the edges of the room around you.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Nineteen hundred years. The chair beneath you becomes more solid. More present.`,
			text: '',
			audio: { binaural: { hertz: 10 } }
		}),

		new ReadInstruction({
			voice: `Two thousand years. Almost home now.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `And as you approach the present moment, I'm going to count from one to ten. With each number, you'll return more fully. More comfortably. More completely.`,
			text: 'Returning'
		}),

		new ReadInstruction({
			voice: `One. Beginning to return now. The forest growing distant. The fire becoming a memory you can access whenever you choose.`,
			text: '1'
		}),

		new ReadInstruction({
			voice: `Two. Awareness returning to your body. Your feet. Your hands. The weight of yourself in the chair.`,
			text: '2'
		}),

		new ReadInstruction({
			voice: `Three. The sounds of this room becoming clearer. The hum of the world returning. Not jarring. Just present.`,
			text: '3',
			audio: { binaural: { hertz: 11 } }
		}),

		new ReadInstruction({
			voice: `Four. The warmth in your chest remains. Steady. Available. A resource you carry forward.`,
			text: '4'
		}),

		new ReadInstruction({
			voice: `Five. Halfway back now. Your mind beginning to organize itself. Thoughts returning like birds settling into branches.`,
			text: '5'
		}),

		new ReadInstruction({
			voice: `Six. Feeling more alert. More present. The heaviness in your limbs beginning to lift.`,
			text: '6',
			audio: { binaural: { hertz: 12 } }
		}),

		new ReadInstruction({
			voice: `Seven. Take a deeper breath now. Letting oxygen reach every part of you. Feeling your lungs expand fully.`,
			text: 'Breathe in'
		}),

		new ReadInstruction({
			voice: `Eight. Almost fully present. You might notice your fingers wanting to move. Your jaw wanting to stretch. Let your body wake in whatever way feels natural.`,
			text: '8'
		}),

		new ReadInstruction({
			voice: `Nine. The room is clear now. Solid. You are here. Grounded. The council remains available whenever you choose to return. But you are here now.`,
			text: '9',
			audio: { binaural: { hertz: 14 } }
		}),

		new ReadInstruction({
			voice: `Ten. Looking around the room. Noticing your surroundings. Take your time. There's no rush.`,
			text: '10'
		}),

		new ReadInstruction({
			voice: `Welcome back.`,
			text: 'Welcome back'
		}),

		new ReadInstruction({
			voice: `Whatever you experienced is yours to keep. Whatever you need to process will unfold in its own time.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Take a moment before you move. Let the experience settle.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `When you're ready, you might want to stretch your hands. Roll your shoulders. Feel your feet against the floor.`,
			text: '',
			cooldown: 5000
		}),

		new ReadInstruction({
			voice: `Until next time.`,
			text: '',
			cooldown: 20000
		})
	]
}

export default councilOfFireLong
