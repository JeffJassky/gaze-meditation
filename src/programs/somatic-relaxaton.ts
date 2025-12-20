import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NodInstruction,
	BlinkInstruction,
	DirectionalGazeInstruction,
	RelaxJawInstruction,
	TypeInstruction,
	SpeechInstruction,
	OpenEyesInstruction,
	CloseEyesInstruction
} from '../instructions'

export const somaticResetFull: Program = {
	id: 'prog_somatic_reset_full',
	title: 'The Somatic Reset',
	description: 'A 20-minute, high-density flow for total physical release.',
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 6, volume: 0.5 }
	},
	// videoBackground: '/loop2.mov',
	spiralBackground: 'img/spiral.png',
	instructions: [
		// --- Block 1: The Mental "Handshake" (Pacing) ---
		new ReadInstruction({
			text: [
				'Welcome.',
				'This 20-minute flow will help you relax.',
				'It will help you release stress',
				'and relax your mind.'
			]
		}),
		new ReadInstruction({
			text: 'Before we begin'
		}),
		new ReadInstruction({
			text: 'Rest your eyes at the center of the screen.'
		}),
		new ReadInstruction({
			text: ['Prepare to be still.', 'Be still.']
		}),
		new StillnessInstruction({
			prompt: 'keep the blue dot centered in the ring.',
			duration: 15000
		}),
		new ReadInstruction({
			text: 'Notice the way your body feels against the chair.'
		}),
		new ReadInstruction({
			text: 'Notice the weight of your hands in your lap.'
		}),
		new ReadInstruction({
			text: 'Do you want to release the stress you’ve been carrying?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Excellent.'
		}),
		new ReadInstruction({
			text: 'Are you ready to let the screen guide your relaxation?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: "Then let's begin."
		}),

		// --- Block 2: The Physiological Capture (Induction) ---
		new ReadInstruction({
			text: 'Keep your eyes fixed on the center.'
		}),
		new BlinkInstruction({ prompt: "Don't Blink", duration: 30000 }),
		new ReadInstruction({
			text: 'Your eyes are starting to feel dry.'
		}),
		new ReadInstruction({
			text: 'That is the feeling of your brain shifting focus.'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Now... turn your head gently to the left.',
			direction: 'LEFT'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Now to the right',
			direction: 'RIGHT'
		}),
		new ReadInstruction({ text: 'Back to center.' }),
		new RelaxJawInstruction({ prompt: 'Relax your jaw' }),
		new ReadInstruction({
			text: 'Notice how the rest of your face follows the jaw.'
		}),
		new ReadInstruction({
			text: 'The tension is starting to fall away.'
		}),
		new TypeInstruction({
			prompt: 'Type "i am present"',
			targetPhrase: 'i am present'
		}),

		// --- Block 3: Establishing the "Stillness" (The Deepening) ---
		new ReadInstruction({
			text: 'True relaxation starts with stillness.'
		}),
		new StillnessInstruction({ prompt: 'Be still.', duration: 30000 }),
		new ReadInstruction({ text: 'Perfect.' }),
		new ReadInstruction({
			text: ['Eyes softening...', 'Now, relax that jaw again...']
		}),
		new RelaxJawInstruction({ prompt: 'as your eyes soften on the center', duration: 30000 }),
		new ReadInstruction({
			text: 'Look at the swirling light on the screen.'
		}),
		new ReadInstruction({
			text: 'Does it feel like you are sinking into the floor?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Speak these words out loud.'
		}),
		new SpeechInstruction({
			prompt: 'Say:',
			targetValue: 'Deeper and deeper',
			duration: 10000
		}),
		new ReadInstruction({
			text: 'Each time you say it, you are 10 times more relaxed.',
			duration: 5000
		}),
		new SpeechInstruction({
			prompt: 'Again, say:',
			targetValue: 'Deeper and deeper'
		}),
		new ReadInstruction({
			text: 'So relaxed.'
		}),
		new ReadInstruction({
			text: "Now in a moment, I'll ask you to close your eyes."
		}),
		new ReadInstruction({
			text: "Each time you hear the bell, you'll open your eyes."
		}),
		new CloseEyesInstruction({ text: 'Close your eyes.' }),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),
		new ReadInstruction({
			text: ['Good.', 'Each time the swirling light returns, you are 10 times more relaxed.']
		}),
		new CloseEyesInstruction({ text: 'Close those eyes again.' }),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),
		new ReadInstruction({
			text: ['Deeper and deeper.']
		}),
		new CloseEyesInstruction({ text: 'Close those eyes again.' }),
		new OpenEyesInstruction({ text: 'And open your eyes.' }),

		// --- Block 4: The Somatic Unlocking (Upper Body) ---
		new ReadInstruction({
			text: 'Think about your shoulders.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'They have been working so hard for you.',
			duration: 4000
		}),
		new ReadInstruction({
			text: 'Is it okay to let them rest now?',
			duration: 4000
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Breathe into the space between your shoulder blades.',
			duration: 5000
		}),
		new StillnessInstruction({ prompt: 'Stillness', duration: 20000 }),
		new ReadInstruction({
			text: 'Look left.',
			duration: 2000
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look Left',
			direction: 'LEFT',
			duration: 15000,
			leftSrc: '/assets/target_red.png',
			rightSrc: '/assets/ignore_blue.png'
		}),
		new ReadInstruction({
			text: 'Look right.',
			duration: 2000
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look Right',
			direction: 'RIGHT',
			duration: 15000,
			leftSrc: '/assets/ignore_blue.png',
			rightSrc: '/assets/target_red.png'
		}),
		new ReadInstruction({ text: 'Center.', duration: 2000 }),
		new RelaxJawInstruction({ prompt: 'Relax your jaw', duration: 40000 }),
		new ReadInstruction({
			text: 'As the jaw hangs, the shoulders drop.',
			duration: 4000
		}),
		new TypeInstruction({
			prompt: 'Type "releasing the weight"',
			targetPhrase: 'releasing the weight'
		}),
		new SpeechInstruction({
			prompt: 'Say "My shoulders are heavy"',
			targetValue: 'My shoulders are heavy',
			duration: 5000
		}),

		// --- Block 5: The Cognitive Bypass (Confusion/Engagement) ---
		new ReadInstruction({
			text: 'I am going to show you words.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'Type them as quickly or as slowly as you feel.',
			duration: 4000
		}),
		new TypeInstruction({
			prompt: 'Type phrase',
			targetPhrase: 'soft... quiet... heavy... drifting... floating'
		}),
		new ReadInstruction({
			text: 'Is your mind becoming quiet?',
			duration: 3000
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Do you hear anything other than the music?',
			duration: 4000
		}),
		new NodInstruction({ prompt: 'Shake No', nodsRequired: 1, type: 'NO' }),
		new ReadInstruction({
			text: 'Good. Just the music. Just the words.',
			duration: 4000
		}),
		new StillnessInstruction({ prompt: 'Deep Stillness', duration: 60000 }),
		new CloseEyesInstruction({ text: 'Close your eyes.' }),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),
		new CloseEyesInstruction({ text: 'And closed again.' }),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),

		// --- Block 6: The Total Dissolve (Full Body) ---
		new ReadInstruction({
			text: 'Feel the relaxation moving down your arms.',
			duration: 4000
		}),
		new ReadInstruction({
			text: 'Into your elbows.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'Into your wrists.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'Into your fingertips.',
			duration: 3000
		}),
		new ReadInstruction({
			text: 'Are your hands heavy?',
			duration: 3000
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new RelaxJawInstruction({ prompt: 'Relax your jaw', duration: 60000 }),
		new ReadInstruction({
			text: 'Your jaw is loose. Your neck is soft.',
			duration: 4000
		}),
		new ReadInstruction({ text: 'Look left.', duration: 2000 }),
		new DirectionalGazeInstruction({
			prompt: 'Look Left',
			direction: 'LEFT',
			duration: 5000,
			leftSrc: '/assets/target_red.png',
			rightSrc: '/assets/ignore_blue.png'
		}),
		new ReadInstruction({ text: 'Look right.', duration: 2000 }),
		new DirectionalGazeInstruction({
			prompt: 'Look Right',
			direction: 'RIGHT',
			duration: 5000,
			leftSrc: '/assets/ignore_blue.png',
			rightSrc: '/assets/target_red.png'
		}),
		new ReadInstruction({
			text: 'Close your eyes.'
		}),
		new StillnessInstruction({ prompt: 'Blind Stillness', duration: 30000 }),
		new ReadInstruction({
			text: 'Open your eyes.'
		}),
		new TypeInstruction({
			prompt: 'Type "i am completely relaxed"',
			targetPhrase: 'i am completely relaxed'
		}),

		// --- Block 7: Subconscious Anchoring ---
		new ReadInstruction({
			text: 'This feeling of peace belongs to you.'
		}),
		new ReadInstruction({
			text: 'Can you take this feeling with you into your day?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: 'Whenever you feel stress, you will remember this looseness.'
		}),
		new ReadInstruction({
			text: 'Do you agree to let go of unnecessary tension?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new SpeechInstruction({
			targetValue: 'I choose peace'
		}),
		new StillnessInstruction({ prompt: 'Absorb', duration: 40000 }),
		new RelaxJawInstruction({ prompt: 'Final Release', duration: 20000 }),

		// --- Block 8: The Re-Emergence (Wake Up) ---
		new ReadInstruction({
			text: 'It is almost time to return.'
		}),
		new ReadInstruction({
			text: 'Keep this feeling of physical ease.'
		}),
		new ReadInstruction({
			text: 'Ready to wake up?'
		}),
		new NodInstruction({ prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			text: ['5...', '4...', 'feeling energy returning to your limbs.']
		}),
		new ReadInstruction({
			text: ['3', '2...', 'taking a deep, refreshing breath.']
		}),
		new ReadInstruction({ prompt: '1', text: '1... Wide awake.', duration: 3000 }),
		new SpeechInstruction({
			targetValue: 'I am awake and refreshed'
		}),
		new ReadInstruction({
			text: 'Thank you for practicing.'
		})
	]
}

export default somaticResetFull
