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
	id: 'prog_council_fire_long',
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
		// PHASE 1: THE UN-TETHERING
		// ============================================================

		new ReadInstruction({
			text: [
				'Welcome.',
				'This is a long journey.',
				'There is nowhere else you need to be.',
				'There is nothing you need to force.'
			],
			cooldown: 3000
		}),

		new ReadInstruction({
			text: 'Take a moment to adjust your body for comfort.',
			cooldown: 2000
		}),

		new ReadInstruction({
			text: ['Uncross your legs if needed.', 'Let your hands rest easily.'],
			cooldown: 2000
		}),

		new ReadInstruction({
			text: 'Fix your eyes on a single point in front of you.'
		}),

		new ReadInstruction({
			text: [
				'Notice how naturally attention gathers…',
				'when it isn’t being pulled elsewhere.'
			],
			audio: { binaural: { hertz: 10 } },
			cooldown: 4000
		}),

		new ReadInstruction({
			text: [
				'The space around you ~ begins to fade toward grey.',
				'Not disappearing.',
				'Just losing importance.',
				'The world softens into quiet static.',
				'awareness remains clear and steady.'
			],
			audio: { binaural: { hertz: 8 } },
			cooldown: 5000
		}),

		new StillnessInstruction({
			prompt: 'Blink slowly now. Heavy, unhurried blinks.',
			duration: 20000
		}),

		new ReadInstruction({
			text: ['Your eyelids feel comfortable…']
		}),

		new CloseEyesInstruction({
			text: 'You may close your eyes for a moment and rest.'
		}),

		new ReadInstruction({
			text: 'Relax, keeping your eyes closed.',
			cooldown: 3000
		}),

		new OpenEyesInstruction({
			text: 'And when it feels natural… open your eyes again.'
		}),

		// ============================================================
		// PHASE 2: THE PRIMAL RHYTHM
		// ============================================================

		new ReadInstruction({
			text: 'You are standing at the edge of a forest.',
			audio: { binaural: { hertz: 10 } },
			cooldown: 3000
		}),

		new ReadInstruction({
			text: [
				'It is night.',
				'The air is cold and clean.',
				'It feels light against your skin.'
			],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['Time loosens here.', 'Not by effort…', 'but by irrelevance.'],
			cooldown: 4000
		}),

		new DirectionalGazeInstruction({
			prompt: 'Let your head tilt slightly downward.',
			direction: 'DOWN'
		}),

		new ReadInstruction({
			text: ['Walkng through the forest ~ time winds backwards.'],
			cooldown: 4000
		}),

		new ReadInstruction({ text: '2020… fading away.', cooldown: 2000 }),
		new ReadInstruction({ text: '2000… growing quieter.', cooldown: 2000 }),

		new RelaxJawInstruction({
			prompt: 'Jaw loosens. Breath deepens.',
			duration: 15000
		}),

		new ReadInstruction({ text: '1900… softer.', cooldown: 2000 }),
		new ReadInstruction({ text: '1800… fewer edges.', cooldown: 2000 }),
		new ReadInstruction({
			text: ['1500…', 'No electricity.', 'Only fire.'],
			cooldown: 3000
		}),

		new StillnessInstruction({
			prompt: 'You walk in silence.',
			duration: 25000
		}),

		new ReadInstruction({
			text: ['A thousand years ago.', 'You are simply a traveler.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['In the distance, you hear a drum.', 'Slow.', 'Rhythmic.'],
			cooldown: 5000
		}),

		new ReadInstruction({
			text: [
				'Your breath begins to sync with it…',
				'as if your body remembers something older than thought.'
			],
			cooldown: 6000
		}),

		// ============================================================
		// PHASE 3: THE THRESHOLD
		// ============================================================

		new ReadInstruction({
			text: ['Ahead, through the trees, ~ there is warmth.', 'An orange glow.'],
			audio: { binaural: { hertz: 5.5 } },
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['As you approach, ~ it grows into a circle of firelight.', 'A clearing.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: [
				'You stop at the edge ~ of the light.',
				'This circle does not accept ~ what is carried heavily.'
			],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: [
				'If it feels right,',
				'imagine setting down ~ what you’ve been carrying.',
				'Like setting down a heavy backpack.',
				'You can always pick it up later.'
			],
			cooldown: 5000
		}),

		new ReadInstruction({
			text: ['You remove one strap.', 'Then the other'],
			duration: 10000
		}),

		new ReadInstruction({
			text: ['Notice how your body stands', 'when nothing needs proving.'],
			cooldown: 4000
		}),

		new NodInstruction({
			prompt: 'When you are ready, ~ step into the circle.',
			nodsRequired: 1,
			type: 'YES'
		}),

		// ============================================================
		// PHASE 4: THE COUNCIL
		// ============================================================

		new ReadInstruction({
			text: 'The fire burns at the center.',
			audio: { binaural: { hertz: 4 } },
			cooldown: 3000
		}),

		new NoBlinkInstruction({
			prompt: 'Its warmth reaches your face.',
			duration: 15000
		}),

		new ReadInstruction({
			text: 'Around it sit the Elders.',
			cooldown: 3000
		}),

		new ReadInstruction({
			text: ['Their eyes are calm.', 'They have seen centuries pass ~ like seasons.'],
			cooldown: 4000
		}),

		new DirectionalGazeInstruction({
			prompt: 'Turn your head gently left ~ toward the Elders.',
			direction: 'LEFT'
		}),

		new DirectionalGazeInstruction({
			prompt: 'Now gently right — toward the Warriors.',
			direction: 'RIGHT'
		}),

		new ReadInstruction({
			text: ['Still.', 'Grounded.', 'Present.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: [
				'You do not know their names.',
				'But you know their blood.',
				'It moves through you now.'
			],
			cooldown: 5000
		}),

		new ReadInstruction({
			text: ['They do not judge.', 'They do not instruct.', 'They recognize.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['You notice an empty place by the fire.', 'Already waiting.'],
			cooldown: 3000
		}),

		new StillnessInstruction({
			prompt: 'You sit. Your posture settles naturally.',
			duration: 20000
		}),

		new ReadInstruction({
			text: ['Behind you…', 'thousands more.', 'Generations standing quietly at your back.'],
			cooldown: 5000
		}),

		// --- PRESSURE MOMENT ---

		new ReadInstruction({
			text: ['The fire suddenly flares.', 'Heat rises.']
		}),

		new ReadInstruction({
			text: ['Some would shift away.', 'You notice… you do not.']
		}),

		// --- THE EMBER ---

		new ReadInstruction({
			text: ['An Elder stands.', 'They draw a glowing ember from the fire.']
		}),

		new ReadInstruction({
			text: ['It is not forced toward you.', 'It is offered.']
		}),

		new ReadInstruction({
			text: ['If it feels right, you lean in.', 'The warmth settles near your chest.']
		}),

		new ReadInstruction({
			text: ['Not burning.', 'Not overwhelming.', 'Steady.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: [
				'Later — when you are challenged —',
				'this same warmth steadies your breath',
				'before words form.'
			]
		}),

		new StillnessInstruction({
			prompt: 'Let this steadiness register as familiar.',
			duration: 25000
		}),

		// ============================================================
		// PHASE 5: RETURN & INTEGRATION
		// ============================================================

		new ReadInstruction({
			text: 'The Elder returns to their place.'
		}),

		new ReadInstruction({
			text: ['A Warrior meets your eyes', 'and inclines their head once.'],
			cooldown: 3000
		}),

		new ReadInstruction({
			text: ['Not approval.', 'Recognition.'],
			cooldown: 3000
		}),

		new ReadInstruction({
			text: ['You stand from the fire.', 'The circle remains behind you.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['You walk back into the forest.', 'Time begins to return.'],
			audio: { binaural: { hertz: 10 } },
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['1900…', '2000…', '2020…'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['You feel the chair beneath you.', 'The room around you.'],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: 'Take a deep breath in.',
			cooldown: 2000
		}),

		new ReadInstruction({
			text: 'And let it go.',
			cooldown: 3000
		}),

		new ReadInstruction({
			text: [
				'When you are ready, return fully awake.',
				'Carrying less noise.',
				'Standing with more weight.'
			],
			cooldown: 4000
		}),

		new ReadInstruction({
			text: ['Nothing dramatic changes.', 'Something essential already has.']
		})
	]
}

export default councilOfFireLong
