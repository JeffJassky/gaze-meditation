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

export const theBlueDoor: Program = {
	id: 'prog_blue_door_journey',
	title: 'The Blue Door',
	description: 'A deep narrative journey through the subconscious to a place of inner beauty.',
	tags: ['bliss'],
	audio: {
		musicTrack: 'audio/music.mp3', // Suggested track name
		binaural: { hertz: 4 } // Theta waves for deep imagery
	},
	spiralBackground: 'img/spiral.png',
	instructions: [
		// --- Block 1: The Fixation (Induction) ---
		new ReadInstruction({
			text: [
				'Welcome.',
				'This session is a journey.',
				'A journey inward.',
				'And a journey through.',
				'Adjust your body. Find a comfortable position.'
			]
		}),
		new NodInstruction({ prompt: 'Are you comfortable?', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Focus on the very center of the screen.'
		}),
		new StillnessInstruction({
			prompt: 'Find stillness.',
			duration: 15000
		}),
		new ReadInstruction({
			text: ['As you stare', 'allow your peripheral vision to blur.']
		}),
		new NoBlinkInstruction({ prompt: "Don't Blink", duration: 25000 }),
		new ReadInstruction({
			text: ['Your eyelids are becoming heavy.']
		}),
		new ReadInstruction({
			text: 'Let them drop.'
		}),
		new CloseEyesInstruction({ text: 'Close your eyes.' }),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),

		// --- Block 2: The Descent (The Spiral Staircase) ---
		new ReadInstruction({
			text: [
				"In your mind's eye, I want you to imagine...",
				"you're standing at the top of a staircase.",
				'A long, spiral staircase.',
				'It is made of ancient stone.',
				'You are going to walk down.'
			]
		}),
		new ReadInstruction({
			text: '10... taking the first step.'
		}),
		new RelaxJawInstruction({ prompt: 'Relax your jaw as you step down', duration: 10000 }),
		new ReadInstruction({
			text: ['9', 'feeling the cool stone under your feet.']
		}),
		new DirectionalGazeInstruction({
			prompt: 'Tilt your head slightly downward',
			direction: 'DOWN'
		}),
		new ReadInstruction({
			text: [
				'8',
				'deeper down into the dim light.',
				'7',
				'circling down, around and around.',
				'6',
				'feeling safer and deeper with every step.',
				'5',
				'4',
				'Halfway there.',
				'3',
				' almost at the bottom.',
				'2',
				'seeing the floor approaching.',
				'1',
				'Step off the last step.'
			],
			cooldown: 0
		}),
		new StillnessInstruction({ prompt: 'Standing at the bottom.', duration: 20000 }),

		// --- Block 3: The Discovery (The Blue Door) ---
		new ReadInstruction({
			text: 'In front of you, there is a door.'
		}),
		new ReadInstruction({
			text: 'It is heavy. It is solid.'
		}),
		new ReadInstruction({
			text: 'Notice the color.'
		}),
		new ReadInstruction({
			text: ['It is a vivid, electric Blue.', 'With a brass handle.']
		}),
		new NodInstruction({
			prompt: 'Can you see the blue door?',
			nodsRequired: 1,
			type: 'YES'
		}),
		new ReadInstruction({
			text: 'Reach out your hand in the darkness.'
		}),
		new ReadInstruction({
			text: 'Feel the coldness of the handle.',
			duration: 4000
		}),
		new ReadInstruction({
			text: 'On the count of three, you will open it.'
		}),
		new ReadInstruction({
			text: 'And everything will change.'
		}),
		new ReadInstruction({ text: '1...' }),
		new ReadInstruction({ text: '2...' }),
		new ReadInstruction({ text: '3. Push it open.' }),

		// --- Block 4: The Overwhelm (The Flower Field) ---
		new ReadInstruction({
			text: 'You are no longer in the dark.'
		}),
		new ReadInstruction({
			text: 'You are standing in an endless field.'
		}),
		new ReadInstruction({
			text: 'Flowers. Millions of them.'
		}),
		new ReadInstruction({
			text: 'Reds. Golds. Violets.'
		}),
		new ReadInstruction({
			text: 'Too beautiful for words.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'The smell of jasmine fills the warm air.'
		}),
		new ReadInstruction({
			text: 'Feel the sun on your face.',
			duration: 4000
		}),
		new ReadInstruction({
			text: 'Feel this beauty.'
		}),
		new ReadInstruction({
			text: 'The colors are vibrating.'
		}),
		// --- Block 5: The Deep Appreciation (Immersion) ---
		new ReadInstruction({
			text: ['Soak it in.', 'Just watch the flowers.', 'Only color. Only light.']
		}),
		new StillnessInstruction({
			prompt: 'Be still. Remember this feeling.',
			duration: 20000
		}),

		// --- Block 6: The Anchor (Integration) ---
		new ReadInstruction({
			text: [
				'Now read carefully.',
				'This field is not a place you visited.',
				'This field is inside of you',
				'You created this beauty.',
				'It is always available.',
				'Whenever you need to access it...',
				'All you need to do...',
				'is to open the blue door.',
				'And this feeling will be waiting.'
			]
		}),

		// --- Block 7: The Return (Wake Up) ---
		new ReadInstruction({
			text: [
				'It is time to step back through the door.',
				'1',
				'Bringing the sunlight with you.',
				'2',
				'The scent of flowers still in your nose.',
				'3',
				'Taking a deep, life-affirming breath.',
				'4',
				'Eyes ready to clear.',
				'5',
				'Wide awake.'
			]
		}),
		new ReadInstruction({
			text: ['Welcome back.', 'Thank you for this journey 🌸.']
		})
	]
}

export default theBlueDoor
