import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NodInstruction,
	NoBlinkInstruction,
	DirectionalGazeInstruction,
	RelaxJawInstruction,
	SpeechInstruction,
	OpenEyesInstruction,
	CloseEyesInstruction
} from '../instructions'

export const councilOfFireLong: Program = {
	id: 'prog_council_fire_long',
	title: 'The Council of Fire',
	description: 'Connect with deep ancestral wisedom, power and guidance.',
	tags: ['confidence'],
	audio: {
		musicTrack: 'audio/shamanic_deep_drums.mp3',
		binaural: { hertz: 12 }
	},
	spiralBackground: 'img/ember_darkness.png', // A dark background with slow, rising orange sparks
	instructions: [
		// ============================================================
		// PHASE 1: THE UN-TETHERING (Disconnecting from the Modern)
		// ============================================================
		new ReadInstruction({
			text: [
				'Welcome.',
				'This is a long journey.',
				'There is nowhere else you need to be.',
				'There is nothing else you need to do.'
			]
		}),
		new ReadInstruction({
			text: 'Adjust your body now for comfort.'
		}),
		new ReadInstruction({
			text: 'Uncross your legs. Rest your hands.'
		}),
		new NodInstruction({
			prompt: 'Are you ready to leave this time?',
			nodsRequired: 1,
			type: 'YES'
		}),

		// --- The Visual Fixation ---
		new ReadInstruction({
			text: 'Fix your eyes on the center of the darkness.'
		}),
		new ReadInstruction({
			text: 'Imagine the room around you is fading to grey.',
			audio: {
				binaural: { hertz: 8 } // Low Theta/Delta boundary for deep trance
			}
		}),
		new StillnessInstruction({
			prompt: 'Watch the grey static.',
			duration: 20000
		}),
		new ReadInstruction({
			text: 'The emails. The texts. The noise.'
		}),
		new ReadInstruction({
			text: 'It is all dissolving.'
		}),
		new NoBlinkInstruction({ prompt: 'Blink heavy, slow blinks', duration: 30000 }),
		new ReadInstruction({
			text: 'Your eyelids are heavy curtains.'
		}),
		new ReadInstruction({
			text: 'Close them for a moment and rest.'
		}),
		new CloseEyesInstruction({ text: 'Close eyes.' }),
		new StillnessInstruction({ prompt: 'Disconnecting...', duration: 15000 }),
		new OpenEyesInstruction({ text: 'Open eyes.' }),

		// ============================================================
		// PHASE 2: THE PRIMAL RHYTHM (The Regression)
		// ============================================================
		new ReadInstruction({
			text: 'You are now standing at the edge of a forest.'
		}),
		new ReadInstruction({
			text: 'It is night. The air is cold and clean.'
		}),
		new ReadInstruction({
			text: 'We are going to walk backwards through time.'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look down at your feet.',
			direction: 'DOWN'
		}),
		new ReadInstruction({
			text: '2020... fading away.'
		}),
		new ReadInstruction({
			text: '2000... fading away.'
		}),
		new RelaxJawInstruction({ prompt: 'Jaw loose, breathing deep', duration: 15000 }),
		new ReadInstruction({
			text: '1900... The world is getting quieter.'
		}),
		new ReadInstruction({
			text: '1800... The trees are getting larger.'
		}),
		new ReadInstruction({
			text: '1500... No electricity. Only fire.'
		}),
		new StillnessInstruction({ prompt: 'Walk in the silence.', duration: 25000 }),
		new ReadInstruction({
			text: '1000 years ago.'
		}),
		new ReadInstruction({
			text: 'You are simply a traveler.'
		}),
		new ReadInstruction({
			text: 'Do you hear the drum?'
		}),
		new NodInstruction({
			prompt: 'Listen to the audio. Do you hear it?',
			nodsRequired: 1,
			type: 'YES'
		}),
		new ReadInstruction({
			text: 'Sync your breathing to that beat.'
		}),
		new StillnessInstruction({
			prompt: 'Breathe... Beat... Breathe... Beat...',
			duration: 30000
		}),

		// ============================================================
		// PHASE 3: THE THRESHOLD (The Permission)
		// ============================================================
		new ReadInstruction({
			text: 'Up ahead, through the trees.',
			audio: {
				binaural: { hertz: 5.5 } // Low Theta/Delta boundary for deep trance
			}
		}),
		new ReadInstruction({
			text: 'An orange glow.'
		}),
		new ReadInstruction({
			text: 'You walk towards the warmth.'
		}),
		new ReadInstruction({
			text: 'But you stop at the edge of the light.'
		}),
		new ReadInstruction({
			text: 'You cannot bring your modern worries into this circle.'
		}),
		new ReadInstruction({
			text: 'They are too heavy.'
		}),
		new ReadInstruction({
			text: 'Visualize taking off a heavy backpack.'
		}),
		new ReadInstruction({
			text: 'Drop it on the ground outside the light.'
		}),
		new RelaxJawInstruction({
			prompt: 'Feel your shoulders rise and lighten',
			duration: 10000
		}),
		new ReadInstruction({
			text: 'Leave it there. You can pick it up later if you want.'
		}),
		new ReadInstruction({
			text: "(You won't want to.)"
		}),
		new NodInstruction({ prompt: 'Are you ready to enter?', nodsRequired: 1, type: 'YES' }),

		// ============================================================
		// PHASE 4: THE COUNCIL (The Deep Communion)
		// ============================================================
		new ReadInstruction({
			text: 'Step into the clearing.'
		}),
		new ReadInstruction({
			text: 'The fire is roaring. It warms your face.'
		}),
		new NoBlinkInstruction({ prompt: 'Stare at the fire (Screen)', duration: 20000 }),
		new ReadInstruction({
			text: 'Look around the fire.'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look Left to the Elders.',
			direction: 'LEFT'
		}),
		new DirectionalGazeInstruction({
			prompt: 'Look Right to the Warriors.',
			direction: 'RIGHT'
		}),
		new ReadInstruction({
			text: 'You do not know their names.'
		}),
		new ReadInstruction({
			text: 'But you know their blood.'
		}),
		new ReadInstruction({
			text: 'It flows in your veins right now.'
		}),
		new ReadInstruction({
			text: 'Sit down in the empty spot waiting for you.'
		}),
		new StillnessInstruction({ prompt: 'Sitting in the Council.', duration: 20000 }),

		// --- The "Backing" Visualization ---
		new ReadInstruction({
			text: 'Close your eyes to feel them better.',
			audio: {
				binaural: { hertz: 3.5 } // Low Theta/Delta boundary for deep trance
			}
		}),
		new CloseEyesInstruction({ text: 'Close eyes.' }),
		new ReadInstruction({
			text: 'Imagine thousands of them standing behind you.' // Note: Spoken by internal voice since eyes are closed
		}),
		// Note: Since eyes are closed, we rely on the user holding the state.
		// We will open eyes shortly to give the next instruction.
		new StillnessInstruction({
			prompt: 'Feel the wall of protection behind your back.',
			duration: 30000
		}),
		new OpenEyesInstruction({ text: 'Open your eyes.' }),

		// --- The Ritual of the Ember ---
		new ReadInstruction({
			text: 'An Elder approaches the fire.'
		}),
		new ReadInstruction({
			text: 'They reach in and pull out a burning coal.'
		}),
		new ReadInstruction({
			text: 'It glows with golden power.'
		}),
		new ReadInstruction({
			text: 'This is the Spark of Survival.'
		}),
		new ReadInstruction({
			text: 'They place it gently into your chest.'
		}),
		new ReadInstruction({
			text: 'It does not burn. It strengthens.'
		}),
		new CloseEyesInstruction({ text: 'Close eyes and feel the heat enter your heart.' }),
		new StillnessInstruction({ prompt: 'Absorbing the Ember...', duration: 60000 }), // Long deepener
		new OpenEyesInstruction({ text: 'Open your eyes.' }),

		// ============================================================
		// PHASE 5: THE INTEGRATION (The Return)
		// ============================================================
		new ReadInstruction({
			text: 'The fire is inside you now.'
		}),
		new ReadInstruction({
			text: 'You are the Carrier of the Flame.'
		}),
		new ReadInstruction({
			text: 'Look at the fire on the screen one last time.'
		}),
		new SpeechInstruction({
			prompt: 'Whisper to the Council:',
			targetValue: 'I will not forget',
			duration: 10000
		}),
		new ReadInstruction({
			text: 'Stand up.'
		}),
		new ReadInstruction({
			text: 'Turn away from the clearing.'
		}),
		new ReadInstruction({
			text: 'Walk back into the forest.'
		}),
		new ReadInstruction({
			text: 'Moving faster now.',
			audio: {
				binaural: { hertz: 12 } // Low Theta/Delta boundary for deep trance
			}
		}),
		new ReadInstruction({
			text: '1000 AD... 1500 AD...'
		}),
		new ReadInstruction({
			text: '1800... 1900...'
		}),
		new ReadInstruction({
			text: 'Feeling the chair beneath you again.'
		}),
		new ReadInstruction({
			text: '2000... 2020...'
		}),
		new ReadInstruction({
			text: 'Today.'
		}),
		new ReadInstruction({
			text: 'Take a deep breath.'
		}),
		new RelaxJawInstruction({ prompt: 'Exhale the old air', duration: 5000 }),
		new ReadInstruction({
			text: 'When you are ready...'
		}),
		new ReadInstruction({
			text: 'Wake up. Powerful. Ancient. New.'
		}),
		new NodInstruction({ prompt: 'Are you back?', nodsRequired: 1, type: 'YES' })
	]
}

export default councilOfFireLong
