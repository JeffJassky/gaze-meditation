import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NoBlinkInstruction,
	OpenEyesInstruction
	// We only need visual instructions for a Read-Only script
} from '../instructions'

export const somaticResetReadOnly: Program = {
	id: 'prog_somatic_reset_extended',
	title: 'The Somatic Reset (Extended)',
	description: 'A 20-minute guide to total physical and mental relaxation.',
	tags: ['Deep Rest'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 5 } // Mid-Theta for trance logic
	},
	spiralBackground: 'img/spiral.png',
	instructions: [
		// --- Phase 1: The Disconnect (Minutes 0-3) ---
		new ReadInstruction({
			text: [
				'Welcome.',
				'This is a space of silence.',
				'A space to stop doing.',
				'And start being.'
			]
		}),
		new ReadInstruction({
			text: [
				'Take a minute to arrange your body.',
				'Uncross your legs.',
				'Let your hands find a home in your lap.'
			]
		}),
		// Wait 15s for them to settle
		new StillnessInstruction({
			prompt: 'Settle in.',
			duration: 15000
		}),
		new ReadInstruction({
			text: [
				'Look at the center of the screen.',
				'Do not stare hard. Stare softly.',
				'Imagine you are looking *through* the screen.'
			]
		}),
		new ReadInstruction({
			text: 'Hold that soft gaze.'
		}),
		// The long stare (45s)
		new NoBlinkInstruction({
			prompt: 'Do not blink. Let the edges blur.',
			duration: 45000
		}),
		new ReadInstruction({
			text: ['And blink.', 'Clear your eyes.', 'Notice how heavy your eyelids feel.']
		}),

		// --- Phase 2: The Breathing Loop (Minutes 3-8) ---
		// LOGIC FIX: Read the pattern first, THEN close eyes.

		// Loop 1 Setup
		new ReadInstruction({
			text: [
				'We will sync your body to the screen.',
				'Read this pattern first:',
				'Inhale for 4 seconds.',
				'Exhale for 6 seconds.',
				'Do this 3 times.'
			]
		}),
		new ReadInstruction({
			text: 'Ready? Close your eyes now.'
		}),
		// The Action (60s) - Screen holds static while they breathe
		new StillnessInstruction({
			prompt: 'Breathing... (In 4, Out 6)',
			duration: 60000
		}),

		new OpenEyesInstruction({
			text: ['Welcome back.']
		}),

		// Loop 2 Setup
		new ReadInstruction({
			text: [
				'Notice your shoulders dropping.',
				"Let's go deeper.",
				'New Pattern:',
				'Inhale 4... Hold 2... Exhale 8.'
			]
		}),
		new ReadInstruction({
			text: 'Close your eyes. Do this 5 times.'
		}),
		// The Action (90s)
		new StillnessInstruction({
			prompt: 'Breathing... (In 4, Hold 2, Out 8)',
			duration: 90000
		}),

		// Loop 3 Setup
		new ReadInstruction({
			text: [
				'Deeper still.',
				'One last time.',
				'The deepest loop.',
				'Simply count 10 slow, natural breaths.'
			]
		}),
		new ReadInstruction({
			text: 'Close your eyes now.'
		}),
		// The Action (120s)
		new StillnessInstruction({
			prompt: 'Counting 10 breaths...',
			duration: 120000
		}),
		new OpenEyesInstruction({
			text: ['Your eyes are open.']
		}),

		// --- Phase 3: The Semantic Boredom (Minutes 8-12) ---

		new OpenEyesInstruction({
			text: ['Your eyes are open.']
		}),
		new ReadInstruction({
			text: [
				'Your eyes are open.',
				'But your mind is drifting.',
				'Look at the words below.',
				"Don't read them. Just look at the shapes."
			]
		}),
		// Each word holds screen for 30s
		new StillnessInstruction({ prompt: 'D  R  I  F  T  I  N  G', duration: 30000 }),
		new StillnessInstruction({ prompt: 'S  I  N  K  I  N  G', duration: 30000 }),
		new StillnessInstruction({ prompt: 'S  I  L  E  N  C  E', duration: 30000 }),
		new StillnessInstruction({ prompt: 'S  P  A  C  E', duration: 30000 }),

		new ReadInstruction({
			text: ['Notice the white space around the words.', 'The nothingness.']
		}),
		new StillnessInstruction({
			prompt: 'Rest your mind in that white space.',
			duration: 60000
		}),

		// --- Phase 4: The Granular Body Scan (Minutes 12-16) ---
		// Using StillnessInstruction to hold the prompt while they "feel" it

		new ReadInstruction({ text: 'Bring your attention to your feet.' }),
		new StillnessInstruction({
			prompt: 'Feel the warmth in your toes.',
			duration: 20000
		}),

		new ReadInstruction({ text: 'Move the attention up to your knees.' }),
		new StillnessInstruction({
			prompt: 'Legs are heavy wood. Solid.',
			duration: 20000
		}),

		new ReadInstruction({ text: 'Now to your hips and lower back.' }),
		new StillnessInstruction({
			prompt: 'Unwinding the spine.',
			duration: 30000
		}),

		new ReadInstruction({ text: 'Now the shoulders.' }),
		new StillnessInstruction({
			prompt: 'Like a heavy, warm blanket.',
			duration: 20000
		}),

		new ReadInstruction({ text: 'Finally, the face.' }),
		new StillnessInstruction({
			prompt: 'Smooth forehead. Loose jaw.',
			duration: 60000
		}),

		// --- Phase 5: The Anchor & Integration (Minutes 16-18) ---
		new ReadInstruction({
			text: [
				'Stay in this heavy state.',
				'Lift your right hand slowly.',
				'Press your thumb against your forefinger.'
			]
		}),
		new StillnessInstruction({
			prompt: 'Squeeze and Memorize this feeling.',
			duration: 15000
		}),
		new ReadInstruction({
			text: [
				'The calm is stored in that squeeze.',
				'Release the fingers.',
				'Release the hand.'
			]
		}),

		// --- Phase 6: The Return (Minutes 18-20) ---
		new ReadInstruction({
			text: [
				'Slowly, we begin the return.',
				'1... Taking a deep breath.',
				'2... Wiggling your toes and fingers.',
				'3... Stretching your arms.',
				'4... Energy rising up the spine.',
				'5... Eyes clear.'
			]
		}),
		new ReadInstruction({
			text: ['You are fully awake.', 'You are fully reset.', 'Have a wonderful day.']
		})
	]
}

export default somaticResetReadOnly
