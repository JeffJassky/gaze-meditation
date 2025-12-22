import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NoBlinkInstruction,
	DirectionalGazeInstruction,
	RelaxJawInstruction,
	OpenEyesInstruction,
	CloseEyesInstruction
} from '../instructions'

export const theBlueDoor: Program = {
	id: 'prog_blue_door_v2',
	title: 'The Blue Door',
	description:
		'A somatic journey through the subconscious to a place of inner peace and beauty. Uses fractionation to install a permanent anchor for peace.',
	tags: ['peace', 'bliss'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 4 } // Deep Theta for vivid visualization
	},
	spiralBackground: 'img/spiral.png',
	instructions: [
		// --- Block 1: The Induction (The Heavy Gaze) ---
		new ReadInstruction({
			text: [
				'Welcome.',
				'This session is a journey inward.',
				'A journey through.',
				'Take a moment to shift your body.',
				'Adjust your shoulders. Unclench your hands.',
				'Find the position where you can remain completely still.'
			]
		}),
		new ReadInstruction({
			text: ['Focus on the very center of the screen.', 'Pick one point.', 'Lock onto it.']
		}),
		new NoBlinkInstruction({
			prompt: 'Do not look away.',
			duration: 15000
		}),
		new ReadInstruction({
			text: [
				'As you stare, allow your peripheral vision to soften.',
				'The edges of the room are fading.',
				'There is only the center.'
			]
		}),
		new ReadInstruction({
			text: [
				'You might notice your eyelids becoming heavy.',
				'Thick.',
				'Wanting to blink, but resisting.',
				'Hold the strain. Feel the heaviness double.'
			]
		}),
		new ReadInstruction({
			text: [
				'On the next breath... let them drop.',
				'You will hear a chime ~ when it is time to open them.'
			]
		}),
		new CloseEyesInstruction({ text: 'Close your eyes.' }),

		// --- Fractionation (The Deepener) ---
		new StillnessInstruction({
			prompt: 'Eyes closed, ~ drifting in the dark.',
			duration: 5000
		}),
		new OpenEyesInstruction({ text: 'Open your eyes — just a sliver.' }),
		new ReadInstruction({
			text: 'Verify the heaviness.'
		}),
		new StillnessInstruction({
			prompt: 'Shutting out the world.',
			duration: 10000
		}),

		// --- Block 2: The Descent (The Somatic Spiral) ---
		new ReadInstruction({
			text: [
				'In the light behind your eyes, ~ a scene begins to form.',
				'You are standing at the top ~ of a spiral staircase.',
				'Ancient, smooth stone.',
				'Cool to the touch.',
				'You are going to walk down.'
			]
		}),
		new ReadInstruction({ text: '10... ~ Taking the first step.' }),
		new RelaxJawInstruction({
			prompt: 'Feel the stone underfoot. ~ Let your jaw loosen.',
			duration: 8000
		}),
		new ReadInstruction({ text: '9... ~ Letting go of the tension ~ in the neck.' }),
		new DirectionalGazeInstruction({
			prompt: 'Tilt your chin slightly toward your chest.',
			direction: 'DOWN'
		}),
		new ReadInstruction({
			text: [
				'8... ~Deeper down into the dim, quiet light.',
				'The air is cool here.',
				'7... ~ Circling down, around and around.',
				'Leaving the surface world far above you.'
			]
		}),
		new ReadInstruction({
			text: [
				'6... ~ Breathing matches your steps.',
				'5... ~ Halfway there.',
				'Nothing to do. Nowhere to be.',
				'4... ~ Every muscle in your back unspooling.'
			]
		}),
		new ReadInstruction({
			text: [
				'3... ~ Almost at the bottom.',
				'2... Drifting.',
				'1... ~ Step off the last step.'
			]
		}),
		new StillnessInstruction({
			prompt: 'Both feet on solid ground. ~ Total stillness.',
			duration: 10000
		}),

		// --- Block 3: The Discovery (The Threshold) ---
		new ReadInstruction({
			text: [
				'In front of you, ~ emerging from the shadows, is a door.',
				'It is heavy. It is solid.',
				'Notice the color.',
				'It is a vivid, electric Blue.',
				'It hums with a quiet energy.'
			]
		}),
		new ReadInstruction({
			text: [
				'See the polished brass handle.',
				'Reach out your hand in the darkness.',
				'Feel the cold metal against your warm palm.',
				'Grip the handle.'
			]
		}),
		new ReadInstruction({
			text: [
				'On the count of three, you push it open.',
				'1... ~ Tension building in the wrist.',
				'2... ~  Ready to let the light in.',
				'3. Push it open.'
			]
		}),

		// --- Block 4: The Overwhelm (Sensory Loading) ---
		new ReadInstruction({
			text: [
				'You are no longer in the dark.',
				'You are standing in an endless field.',
				'Bathed in warm, golden sunlight.'
			]
		}),
		new ReadInstruction({
			text: [
				'Flowers. Millions of them.',
				'Reds. Golds. Violets.',
				'The colors are so bright they seem to vibrate.'
			]
		}),
		new ReadInstruction({
			text: [
				'The air is warm on your skin.',
				'Take a deep breath in through your nose.',
				'Smell the jasmine. Smell the earth.',
				'Let it fill your lungs.'
			]
		}),

		// --- Block 5: The Immersion (Deepening) ---
		new ReadInstruction({
			text: ['Walk into the field.', 'Find a spot right in the center.', 'And just... stop.']
		}),
		new ReadInstruction({
			text: [
				'Look up at the sky. Infinite blue.',
				'Feel the sun warming your face.',
				'Only color. Only light. Only peace.'
			]
		}),
		new StillnessInstruction({
			prompt: 'Simply exist here.',
			duration: 25000
		}),

		// --- Block 6: The Integration (The Somatic Anchor) ---
		new ReadInstruction({
			text: [
				'Notice where you feel this ~ peace in your body.',
				'Is it a warmth in your chest?',
				'A looseness in your shoulders?',
				'Focus on that physical sensation.'
			]
		}),
		new ReadInstruction({
			text: [
				'Understand this:',
				'You did not travel to get here.',
				'This field is inside of you.',
				'You created this beauty.'
			]
		}),
		new ReadInstruction({
			text: [
				'From now on, ~ whenever you need this peace...',
				'You do not need the staircase.',
				'You only need to close your eyes...',
				'Visualize the Blue Door...',
				'And take one deep breath.',
				'The feeling will rush back in.'
			]
		}),

		// --- Block 7: The Return ---
		new ReadInstruction({
			text: [
				'It is time to head back.',
				'Bringing the sunlight with you.',
				'1... ~ Feeling the surface beneath you again.',
				'2... ~ Wiggling fingers and toes.',
				'3... ~ Taking a deep, life-affirming breath.',
				'4... ~ Head clearing, feeling rested and alert.'
			]
		}),
		new OpenEyesInstruction({ text: '5... Open your eyes.' }),
		new ReadInstruction({
			text: 'Wide awake. Welcome back.'
		})
	]
}

export default theBlueDoor
