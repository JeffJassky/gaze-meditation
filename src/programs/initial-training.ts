import type { Program } from '../types'
import { SpeechInstruction } from '../instructions/SpeechInstruction'
import { DirectionalGazeInstruction } from '../instructions/DirectionalGazeInstruction'
import { StillnessInstruction } from '../instructions/StillnessInstruction'
import { NoBlinkInstruction } from '../instructions/NoBlinkInstruction'
import { NodInstruction } from '../instructions/NodInstruction'
import { ReadInstruction } from '../instructions/ReadInstruction'
import { CloseEyesInstruction } from '../instructions/CloseEyesInstruction'
import { OpenEyesInstruction } from '../instructions/OpenEyesInstruction'
import { RelaxJawInstruction } from '../instructions/RelaxJawInstruction'

export const initialTrainingProgram: Program = {
	id: 'initial_training',
	title: 'Gaze Tutorial',
	description: 'Get started with Gaze in less than 5 minutes.',
	audio: { musicTrack: '/audio/music.mp3' },
	spiralBackground: '/img/spiral.png',
	instructions: [
		// 1. Eyes (Close/Open)
		new ReadInstruction({
			text: [
				'Welcome to the Gaze tutorial.',
				"First, let's practice closing your eyes.",
				'You will hear a chime ~ when it is time to open them.'
			],
			cooldown: 0
		}),
		new CloseEyesInstruction({
			cooldown: 0,
			text: 'Try closing your eyes.',
			duration: 3000 // Short hold,
		}),
		new OpenEyesInstruction({
			cooldown: 0,
			text: 'Open your eyes.'
		}),
		new ReadInstruction({
			cooldown: 0,
			text: ['Perfect.']
		}),

		// 2. Jaw Relaxation
		new RelaxJawInstruction({
			cooldown: 0,
			prompt: 'Relax your jaw completely ~ so your mouth gently falls open.',
			duration: 3000
		}),

		// 3. Stillness
		new ReadInstruction({
			cooldown: 0,
			text: [
				'Excellent.',
				'Notice how when the jaw relaxes, ~ your face follows.',
				'Now, find a comfortable position  ~ and prepare to be still.'
			]
		}),
		new StillnessInstruction({
			cooldown: 0,
			prompt: 'Keep the blue dot centered in the ring.',
			duration: 15000
		}),

		// 4. No Blink
		new ReadInstruction({
			cooldown: 0,
			text: ['Sometimes, you will be asked ~ to keep your eyes open.']
		}),
		new NoBlinkInstruction({
			cooldown: 0,
			prompt: 'Do not blink.',
			duration: 10000
		}),

		// 5. Gaze Direction
		new ReadInstruction({
			cooldown: 0,
			text: [
				"Sometimes, you'll be asked questons.",
				'You can answer by nodding ~ or shaking your head.'
			]
		}),
		new NodInstruction({
			cooldown: 0,
			prompt: 'Do you understand?',
			type: 'YES'
		}),
		new ReadInstruction({
			cooldown: 0,
			text: ['You may also be asked ~ to adjust your head and gaze.']
		}),
		new DirectionalGazeInstruction({
			cooldown: 0,
			prompt: 'For example, ~ lower your gaze and head gently now.',
			direction: 'DOWN'
		}),

		// 7. Verbal
		new ReadInstruction({
			cooldown: 0,
			text: [
				'Finally, your voice can be used ~ for verbal affirmations.',
				"We'll show you a phrase to affirm aloud."
			]
		}),
		new SpeechInstruction({
			cooldown: 0,
			prompt: 'Say "I am ready"',
			targetValue: 'I am ready',
			duration: 5000
		}),

		new ReadInstruction({
			cooldown: 0,
			text: ['Perfect.', 'You are ready to begin.']
		})
	]
}
