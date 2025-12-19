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
		musicTrack: '/audio/music.mp3',
		binaural: { hertz: 6, volume: 0.5 }
	},
	videoBackground: '/spiral.mp4',
	instructions: [
		// --- Block 1: The Mental "Handshake" (Pacing) ---
		new ReadInstruction({
			id: 'b1_1',
			text: [
				'Welcome.',
				'This 20-minute flow will help you releax.',
				'It will help you release stress',
				'and relax your mind.'
			]
		}),
		new ReadInstruction({
			id: 'b1_2',
			text: 'Before we begin'
		}),
		new ReadInstruction({
			id: 'b1_3',
			text: 'Rest your eyes at the center of the screen.'
		}),
		new ReadInstruction({
			id: 'b1_3',
			text: ['Prepare to be still.', 'Be still.']
		}),
		new StillnessInstruction({
			id: 'b1_4',
			prompt: 'keep the blue dot centered in the ring.',
			duration: 15000
		}),
		new ReadInstruction({
			id: 'b1_5',
			text: 'Notice the way your body feels against the chair.'
		}),
		new ReadInstruction({
			id: 'b1_6',
			text: 'Notice the weight of your hands in your lap.'
		}),
		new ReadInstruction({
			id: 'b1_7',
			text: 'Do you want to release the stress you’ve been carrying?'
		}),
		new NodInstruction({ id: 'b1_8', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b1_9',
			text: 'Excellent.'
		}),
		new ReadInstruction({
			id: 'b1_10',
			text: 'Are you ready to let the screen guide your relaxation?'
		}),
		new NodInstruction({ id: 'b1_11', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b1_12',
			text: "Then let's begin."
		}),

		// --- Block 2: The Physiological Capture (Induction) ---
		new ReadInstruction({
			id: 'b2_1',
			text: 'Keep your eyes fixed on the center.'
		}),
		new BlinkInstruction({ id: 'b2_2', prompt: "Don't Blink", duration: 30000 }),
		new ReadInstruction({
			id: 'b2_3',
			text: 'Your eyes are starting to feel dry.'
		}),
		new ReadInstruction({
			id: 'b2_4',
			text: 'That is the feeling of your brain shifting focus.'
		}),
		new DirectionalGazeInstruction({
			id: 'b2_6',
			prompt: 'Now... turn your head gently to the left.',
			direction: 'LEFT',
			duration: 10000,
			leftSrc: '/assets/target_red.png', // Placeholder
			rightSrc: '/assets/ignore_blue.png'
		}),
		new DirectionalGazeInstruction({
			id: 'b2_8',
			prompt: 'Now to the right',
			direction: 'RIGHT',
			duration: 10000,
			leftSrc: '/assets/ignore_blue.png',
			rightSrc: '/assets/target_red.png'
		}),
		new ReadInstruction({ id: 'b2_9', text: 'Back to center.' }),
		new ReadInstruction({
			id: 'b2_10',
			text: 'Close your eyes for three seconds.'
		}),
		new ReadInstruction({ id: 'b2_11', text: 'Open.', duration: 2000 }),
		new RelaxJawInstruction({ id: 'b2_12', prompt: 'Relax your jaw', duration: 20000 }),
		new ReadInstruction({
			id: 'b2_13',
			text: 'Notice how the rest of your face follows the jaw.'
		}),
		new ReadInstruction({
			id: 'b2_14',
			text: 'The tension is starting to leak out.'
		}),
		new TypeInstruction({
			id: 'b2_15',
			prompt: 'Type "i am present"',
			targetPhrase: 'i am present'
		}),

		// --- Block 3: Establishing the "Stillness" (The Deepening) ---
		new ReadInstruction({
			id: 'b3_1',
			text: 'True relaxation starts with total stillness.'
		}),
		new StillnessInstruction({ id: 'b3_2', prompt: 'Be Still', duration: 45000 }),
		new ReadInstruction({ id: 'b3_3', prompt: 'Good', text: 'Good.', duration: 2000 }),
		new ReadInstruction({
			id: 'b3_4',
			text: 'Now, let your jaw drop again.'
		}),
		new RelaxJawInstruction({ id: 'b3_5', prompt: 'Drop Jaw', duration: 30000 }),
		new ReadInstruction({
			id: 'b3_6',
			text: 'Look at the swirling light on the screen.'
		}),
		new ReadInstruction({
			id: 'b3_7',
			text: 'Does it feel like you are sinking into the floor?'
		}),
		new NodInstruction({ id: 'b3_8', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b3_9',
			text: 'Speak these words out loud.'
		}),
		new SpeechInstruction({
			id: 'b3_10',
			prompt: 'Say:',
			targetValue: 'Deeper and deeper',
			duration: 10000
		}),
		new ReadInstruction({
			id: 'b3_12',
			text: 'Each time you say it, you are 10 times more relaxed.',
			duration: 5000
		}),
		new SpeechInstruction({
			id: 'b3_10',
			prompt: 'Again, say:',
			targetValue: 'Deeper and deeper'
		}),
		new ReadInstruction({
			id: 'b3_12',
			text: 'So relaxed.'
		}),
		new ReadInstruction({
			id: 'b3_12',
			text: "Now in a moment, I'll ask you to close your eyes."
		}),
		new ReadInstruction({
			id: 'b3_12',
			text: "Each time you hear the bell, you'll open your eyes."
		}),
		new CloseEyesInstruction({ id: 'b3_11', text: 'Close your eyes.' }),
		new OpenEyesInstruction({ id: 'b3_11', text: 'Open your eyes.' }),
		new ReadInstruction({
			id: 'b3_12',
			text: ['Good.', 'Each time the swirling light returns, you are 10 times more relaxed.']
		}),
		new CloseEyesInstruction({ id: 'b3_11', text: 'Close those eyes again.' }),
		new OpenEyesInstruction({ id: 'b3_11', text: 'Open your eyes.' }),
		new ReadInstruction({
			id: 'b3_12',
			text: ['Deeper and deeper.']
		}),
		new CloseEyesInstruction({ id: 'b3_11', text: 'Close those eyes again.' }),
		new OpenEyesInstruction({ id: 'b3_11', text: 'And open your eyes.' }),

		// --- Block 4: The Somatic Unlocking (Upper Body) ---
		new ReadInstruction({
			id: 'b4_1',
			text: 'Think about your shoulders.',
			duration: 3000
		}),
		new ReadInstruction({
			id: 'b4_2',
			text: 'They have been working so hard for you.',
			duration: 4000
		}),
		new ReadInstruction({
			id: 'b4_3',
			text: 'Is it okay to let them rest now?',
			duration: 4000
		}),
		new NodInstruction({ id: 'b4_4', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b4_5',
			text: 'Breathe into the space between your shoulder blades.',
			duration: 5000
		}),
		new StillnessInstruction({ id: 'b4_6', prompt: 'Stillness', duration: 20000 }),
		new ReadInstruction({
			id: 'b4_7',
			text: 'Look left.',
			duration: 2000
		}),
		new DirectionalGazeInstruction({
			id: 'b4_8',
			prompt: 'Look Left',
			direction: 'LEFT',
			duration: 15000,
			leftSrc: '/assets/target_red.png',
			rightSrc: '/assets/ignore_blue.png'
		}),
		new ReadInstruction({
			id: 'b4_9',
			text: 'Look right.',
			duration: 2000
		}),
		new DirectionalGazeInstruction({
			id: 'b4_10',
			prompt: 'Look Right',
			direction: 'RIGHT',
			duration: 15000,
			leftSrc: '/assets/ignore_blue.png',
			rightSrc: '/assets/target_red.png'
		}),
		new ReadInstruction({ id: 'b4_11', text: 'Center.', duration: 2000 }),
		new RelaxJawInstruction({ id: 'b4_12', prompt: 'Relax your jaw', duration: 40000 }),
		new ReadInstruction({
			id: 'b4_13',
			text: 'As the jaw hangs, the shoulders drop.',
			duration: 4000
		}),
		new TypeInstruction({
			id: 'b4_14',
			prompt: 'Type "releasing the weight"',
			targetPhrase: 'releasing the weight'
		}),
		new SpeechInstruction({
			id: 'b4_15',
			prompt: 'Say "My shoulders are heavy"',
			targetValue: 'My shoulders are heavy',
			duration: 5000
		}),

		// --- Block 5: The Cognitive Bypass (Confusion/Engagement) ---
		new ReadInstruction({
			id: 'b5_1',
			text: 'I am going to show you words.',
			duration: 3000
		}),
		new ReadInstruction({
			id: 'b5_2',
			text: 'Type them as quickly or as slowly as you feel.',
			duration: 4000
		}),
		new TypeInstruction({
			id: 'b5_3',
			prompt: 'Type phrase',
			targetPhrase: 'soft... quiet... heavy... drifting... floating'
		}),
		new ReadInstruction({
			id: 'b5_4',
			text: 'Is your mind becoming quiet?',
			duration: 3000
		}),
		new NodInstruction({ id: 'b5_5', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b5_6',
			text: 'Do you hear anything other than the music?',
			duration: 4000
		}),
		new NodInstruction({ id: 'b5_7', prompt: 'Shake No', nodsRequired: 1, type: 'NO' }),
		new ReadInstruction({
			id: 'b5_8',
			text: 'Good. Just the music. Just the words.',
			duration: 4000
		}),
		new StillnessInstruction({ id: 'b5_9', prompt: 'Deep Stillness', duration: 60000 }),
		new CloseEyesInstruction({ id: 'b3_11', text: 'Close your eyes.' }),
		new OpenEyesInstruction({ id: 'b3_11', text: 'Open your eyes.' }),
		new CloseEyesInstruction({ id: 'b3_11', text: 'And closed again.' }),
		new OpenEyesInstruction({ id: 'b3_11', text: 'Open your eyes.' }),

		// --- Block 6: The Total Dissolve (Full Body) ---
		new ReadInstruction({
			id: 'b6_1',
			text: 'Feel the relaxation moving down your arms.',
			duration: 4000
		}),
		new ReadInstruction({
			id: 'b6_2',
			text: 'Into your elbows.',
			duration: 3000
		}),
		new ReadInstruction({
			id: 'b6_3',
			text: 'Into your wrists.',
			duration: 3000
		}),
		new ReadInstruction({
			id: 'b6_4',
			text: 'Into your fingertips.',
			duration: 3000
		}),
		new ReadInstruction({
			id: 'b6_5',
			text: 'Are your hands heavy?',
			duration: 3000
		}),
		new NodInstruction({ id: 'b6_6', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new RelaxJawInstruction({ id: 'b6_7', prompt: 'Relax your jaw', duration: 60000 }),
		new ReadInstruction({
			id: 'b6_8',
			text: 'Your jaw is loose. Your neck is soft.',
			duration: 4000
		}),
		new ReadInstruction({ id: 'b6_9', text: 'Look left.', duration: 2000 }),
		new DirectionalGazeInstruction({
			id: 'b6_10',
			prompt: 'Look Left',
			direction: 'LEFT',
			duration: 5000,
			leftSrc: '/assets/target_red.png',
			rightSrc: '/assets/ignore_blue.png'
		}),
		new ReadInstruction({ id: 'b6_11', text: 'Look right.', duration: 2000 }),
		new DirectionalGazeInstruction({
			id: 'b6_12',
			prompt: 'Look Right',
			direction: 'RIGHT',
			duration: 5000,
			leftSrc: '/assets/ignore_blue.png',
			rightSrc: '/assets/target_red.png'
		}),
		new ReadInstruction({
			id: 'b6_13',
			text: 'Close your eyes.'
		}),
		new StillnessInstruction({ id: 'b6_14', prompt: 'Blind Stillness', duration: 30000 }),
		new ReadInstruction({
			id: 'b6_15',
			text: 'Open your eyes.'
		}),
		new TypeInstruction({
			id: 'b6_16',
			prompt: 'Type "i am completely relaxed"',
			targetPhrase: 'i am completely relaxed'
		}),

		// --- Block 7: Subconscious Anchoring ---
		new ReadInstruction({
			id: 'b7_1',
			text: 'This feeling of peace belongs to you.'
		}),
		new ReadInstruction({
			id: 'b7_2',
			text: 'Can you take this feeling with you into your day?'
		}),
		new NodInstruction({ id: 'b7_3', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b7_4',
			text: 'Whenever you feel stress, you will remember this looseness.'
		}),
		new ReadInstruction({
			id: 'b7_5',
			text: 'Do you agree to let go of unnecessary tension?'
		}),
		new NodInstruction({ id: 'b7_6', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new SpeechInstruction({
			id: 'b7_7',
			targetValue: 'I choose peace'
		}),
		new StillnessInstruction({ id: 'b7_8', prompt: 'Absorb', duration: 40000 }),
		new RelaxJawInstruction({ id: 'b7_9', prompt: 'Final Release', duration: 20000 }),

		// --- Block 8: The Re-Emergence (Wake Up) ---
		new ReadInstruction({
			id: 'b8_1',
			text: 'It is almost time to return.'
		}),
		new ReadInstruction({
			id: 'b8_2',
			text: 'Keep this feeling of physical ease.'
		}),
		new ReadInstruction({
			id: 'b8_3',
			text: 'Ready to wake up?'
		}),
		new NodInstruction({ id: 'b8_4', prompt: 'Nod Yes', nodsRequired: 1, type: 'YES' }),
		new ReadInstruction({
			id: 'b8_5',
			text: ['5...', '4...', 'feeling energy returning to your limbs.']
		}),
		new ReadInstruction({
			id: 'b8_6',
			text: ['3', '2...', 'taking a deep, refreshing breath.']
		}),
		new ReadInstruction({ id: 'b8_7', prompt: '1', text: '1... Wide awake.', duration: 3000 }),
		new SpeechInstruction({
			id: 'b8_8',
			targetValue: 'I am awake and refreshed'
		}),
		new ReadInstruction({
			id: 'b8_9',
			text: 'Thank you for practicing.'
		})
	]
}

export default somaticResetFull
