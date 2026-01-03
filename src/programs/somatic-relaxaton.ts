import type { Session } from '../types'

export const somaticResetReadOnly: Session = {
	id: 'prog_somatic_reset_extended',
	title: 'The Somatic Reset (Extended)',
	description: 'A 20-minute guide to total physical and mental relaxation.',
	tags: ['Deep Rest'],
	audio: {
		musicTrack: '/audio/music.mp3',
		binaural: { hertz: 5 } // Mid-Theta for trance logic
	},
	spiralBackground: '/img/spiral.png',
	scenes: [
		// --- Phase 1: The Disconnect (Minutes 0-3) ---
		{
			text: [
				'Welcome.',
				'This is a space of silence.',
				'A space to stop doing.',
				'And start being.'
			]
		},
		{
			text: [
				'Take a minute to arrange your body.',
				'Uncross your legs.',
				'Let your hands find a home in your lap.'
			]
		},
		// Wait 15s for them to settle
		{
			text: 'Settle in.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 15000 }]
			}
		},
		{
			text: [
				'Look at the center of the screen.',
				'Do not stare hard. Stare softly.',
				'Imagine you are looking *through* the screen.'
			]
		},
		{
			text: 'Hold that soft gaze.'
		},
		// The long stare (45s)
		{
			text: 'Do not blink. Let the edges blur.',
			behavior: {
				suggestions: [{ type: 'eyes:no-blink', duration: 45000 }]
			}
		},
		{
			text: ['And blink.', 'Clear your eyes.', 'Notice how heavy your eyelids feel.']
		},

		// --- Phase 2: The Breathing Loop (Minutes 3-8) ---
		// LOGIC FIX: Read the pattern first, THEN close eyes.

		// Loop 1 Setup
		{
			text: [
				'We will sync your body to the screen.',
				'Read this pattern first:',
				'Inhale for 4 seconds.',
				'Exhale for 6 seconds.',
				'Do this 3 times.'
			]
		},
		{
			text: 'Ready? Close your eyes now.'
		},
		// The Action (60s) - Screen holds static while they breathe
		{
			text: 'Breathing... (In 4, Out 6)',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 60000 }]
			}
		},

		{
			text: ['Welcome back.'],
			behavior: {
				suggestions: [{ type: 'eyes:open' }]
			}
		},

		// Loop 2 Setup
		{
			text: [
				'Notice your shoulders dropping.',
				"Let's go deeper.",
				'New Pattern:',
				'Inhale 4... Hold 2... Exhale 8.'
			]
		},
		{
			text: 'Close your eyes. Do this 5 times.'
		},
		// The Action (90s)
		{
			text: 'Breathing... (In 4, Hold 2, Out 8)',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 90000 }]
			}
		},

		// Loop 3 Setup
		{
			text: [
				'Deeper still.',
				'One last time.',
				'The deepest loop.',
				'Simply count 10 slow, natural breaths.'
			]
		},
		{
			text: 'Close your eyes now.'
		},
		// The Action (120s)
		{
			text: 'Counting 10 breaths...',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 120000 }]
			}
		},
		{
			text: ['Your eyes are open.'],
			behavior: {
				suggestions: [{ type: 'eyes:open' }]
			}
		},

		// --- Phase 3: The Semantic Boredom (Minutes 8-12) ---

		{
			text: ['Your eyes are open.'],
			behavior: {
				suggestions: [{ type: 'eyes:open' }]
			}
		},
		{
			text: [
				'Your eyes are open.',
				'But your mind is drifting.',
				'Look at the words below.',
				"Don't read them. Just look at the shapes."
			]
		},
		// Each word holds screen for 30s
		{
			text: 'D  R  I  F  T  I  N  G',
			behavior: { suggestions: [{ type: 'head:still', duration: 30000 }] }
		},
		{
			text: 'S  I  N  K  I  N  G',
			behavior: { suggestions: [{ type: 'head:still', duration: 30000 }] }
		},
		{
			text: 'S  I  L  E  N  C  E',
			behavior: { suggestions: [{ type: 'head:still', duration: 30000 }] }
		},
		{
			text: 'S  P  A  C  E',
			behavior: { suggestions: [{ type: 'head:still', duration: 30000 }] }
		},

		{
			text: ['Notice the white space around the words.', 'The nothingness.']
		},
		{
			text: 'Rest your mind in that white space.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 60000 }]
			}
		},

		// --- Phase 4: The Granular Body Scan (Minutes 12-16) ---
		// Using StillnessInstruction to hold the prompt while they "feel" it

		{ text: 'Bring your attention to your feet.' },
		{
			text: 'Feel the warmth in your toes.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 20000 }]
			}
		},

		{ text: 'Move the attention up to your knees.' },
		{
			text: 'Legs are heavy wood. Solid.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 20000 }]
			}
		},

		{ text: 'Now to your hips and lower back.' },
		{
			text: 'Unwinding the spine.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 30000 }]
			}
		},

		{ text: 'Now the shoulders.' },
		{
			text: 'Like a heavy, warm blanket.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 20000 }]
			}
		},

		{ text: 'Finally, the face.' },
		{
			text: 'Smooth forehead. Loose jaw.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 60000 }]
			}
		},

		// --- Phase 5: The Anchor & Integration (Minutes 16-18) ---
		{
			text: [
				'Stay in this heavy state.',
				'Lift your right hand slowly.',
				'Press your thumb against your forefinger.'
			]
		},
		{
			text: 'Squeeze and Memorize this feeling.',
			behavior: {
				suggestions: [{ type: 'head:still', duration: 15000 }]
			}
		},
		{
			text: [
				'The calm is stored in that squeeze.',
				'Release the fingers.',
				'Release the hand.'
			]
		},

		// --- Phase 6: The Return (Minutes 18-20) ---
		{
			text: [
				'Slowly, we begin the return.',
				'1... Taking a deep breath.',
				'2... Wiggling your toes and fingers.',
				'3... Stretching your arms.',
				'4... Energy rising up the spine.',
				'5... Eyes clear.'
			]
		},
		{
			text: ['You are fully awake.', 'You are fully reset.', 'Have a wonderful day.']
		}
	]
}

export default somaticResetReadOnly
