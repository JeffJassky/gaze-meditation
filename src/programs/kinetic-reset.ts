import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NodInstruction,
	NoBlinkInstruction,
	DirectionalGazeInstruction,
	RelaxJawInstruction
} from '../instructions'

export const somaticResetActive: Program = {
	id: 'prog_somatic_reset_kinetic',
	title: 'The Kinetic Reset',
	description: 'A rapid-fire, high-engagement journey to silence.',
	tags: ['alert', 'focus'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 12 } // Alpha (Alert Relaxation)
	},
	spiralBackground: 'img/spiral.png', // Faster visual to match pace
	instructions: [
		// --- Phase 1: The Engagement (Immediate Action) ---
		new ReadInstruction({
			text: [
				'We are going to move fast.',
				'Keep up with the screen.',
				'Do not overthink.',
				'Just react.'
			]
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look LEFT.',
			direction: 'LEFT',
			duration: 3000
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look RIGHT.',
			direction: 'RIGHT',
			duration: 3000
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look UP.',
			direction: 'UP',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'Center.',
			duration: 2000
		}),
		new NodInstruction({
			prompt: 'Are you focused? Nod YES.',
			nodsRequired: 1,
			type: 'YES'
		}),

		// --- Phase 2: The Eye Lock (Physiological Strain) ---
		new ReadInstruction({
			text: [
				'Focus on the very center.',
				'I am going to count down from 20.',
				'You will NOT blink.'
			]
		}),
		new NoBlinkInstruction({
			prompt: '20... 19... 18... Stare.',
			duration: 5000
		}),
		new ReadInstruction({
			text: ['15... 14... Eyes watering.', '10... 9... Burn is good.']
		}),
		new NoBlinkInstruction({
			prompt: '5... 4... 3... 2... 1...',
			duration: 5000
		}),
		new ReadInstruction({
			text: 'CLOSE.'
		}),
		new StillnessInstruction({
			prompt: 'Instant relief.',
			duration: 5000
		}),

		// --- Phase 3: The Rapid Fire Visualization (Overload) ---
		new ReadInstruction({
			text: [
				'Open eyes.',
				'I will show you words.',
				'Visualize the object instantly.',
				"Don't think. See it."
			]
		}),
		new ReadInstruction({ text: 'RED APPLE', duration: 2000 }),
		new ReadInstruction({ text: 'BLUE OCEAN', duration: 2000 }),
		new ReadInstruction({ text: 'LEMON', duration: 2000 }),
		new ReadInstruction({ text: 'SNOW', duration: 2000 }),
		new ReadInstruction({ text: 'NIGHT', duration: 2000 }),
		new ReadInstruction({ text: 'THE SUN', duration: 2000 }),

		new RelaxJawInstruction({
			prompt: 'DROP YOUR JAW.',
			duration: 5000
		}),

		// --- Phase 4: The Dissociation (The "Open-Eye" Trance) ---
		new ReadInstruction({
			text: [
				'Keep looking at the screen.',
				'But imagine your eyes are closed.',
				'Can you see the screen and imagine the dark at the same time?'
			]
		}),
		new NodInstruction({
			prompt: 'Try it. Nod if you can feel the confusion.',
			nodsRequired: 1,
			type: 'YES'
		}),
		new ReadInstruction({
			text: [
				'That confusion is the reset.',
				'Let your vision blur.',
				'Read these words without focusing.'
			]
		}),
		new ReadInstruction({
			text: ['The arms are heavy.', 'The screen is far away.', 'The jaw is loose.'],
			duration: 10000
		}),

		// --- Phase 5: The Physical Check (Active Somatics) ---
		new ReadInstruction({
			text: "Don't move your head."
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look at your left shoulder (Eyes only).',
			direction: 'LEFT',
			duration: 5000
		}),
		new ReadInstruction({
			text: 'Drop that shoulder.'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look at your right shoulder (Eyes only).',
			direction: 'RIGHT',
			duration: 5000
		}),
		new ReadInstruction({
			text: 'Drop that shoulder.'
		}),
		new ReadInstruction({
			text: 'Center.',
			duration: 2000
		}),
		new NodInstruction({
			prompt: 'Are your shoulders down? Nod.',
			nodsRequired: 1,
			type: 'YES'
		}),

		// --- Phase 6: The Quick Anchor ---
		new ReadInstruction({
			text: [
				'Take one deep breath.',
				'Hold it.',
				'Squeeze your fists tight.',
				'Tighter.',
				'Exhale and RELEASE.'
			]
		}),
		new StillnessInstruction({
			prompt: 'Total stillness. 10 seconds.',
			duration: 10000
		}),

		// --- Phase 7: The Exit ---
		new ReadInstruction({
			text: ['Sharp.', 'Alert.', 'Reset.']
		}),
		new NodInstruction({
			prompt: 'Ready to go? Nod.',
			nodsRequired: 1,
			type: 'YES'
		}),
		new ReadInstruction({
			text: 'Good work.'
		})
	]
}

export default somaticResetActive
