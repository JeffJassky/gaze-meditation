import type { Session } from '../types'

export const somaticResetActive: Session = {
	id: 'prog_somatic_reset_kinetic',
	title: 'The Kinetic Reset',
	description: 'A rapid-fire, high-engagement journey to silence.',
	tags: ['alert', 'focus'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 12 } // Alpha (Alert Relaxation)
	},
	spiralBackground: 'img/spiral.png', // Faster visual to match pace
	scenes: [
		// --- Phase 1: The Engagement (Immediate Action) ---
		{
			text: [
				'We are going to move fast.',
				'Keep up with the screen.',
				'Do not overthink.',
				'Just react.'
			]
		},
		{
			text: 'Look LEFT.',
            behavior: {
                suggestions: [{ type: 'head:left', duration: 3000 }]
            }
		},
		{
			text: 'Look RIGHT.',
            behavior: {
                suggestions: [{ type: 'head:right', duration: 3000 }]
            }
		},
		{
			text: 'Look UP.',
            behavior: {
                suggestions: [{ type: 'head:up', duration: 3000 }]
            }
		},
		{
			text: 'Center.',
			duration: 2000
		},
		{
			text: 'Are you focused? Nod YES.',
            behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},

		// --- Phase 2: The Eye Lock (Physiological Strain) ---
		{
			text: [
				'Focus on the very center.',
				'I am going to count down from 20.',
				'You will NOT blink.'
			]
		},
		{
			text: '20... 19... 18... Stare.',
            behavior: {
                suggestions: [{ type: 'eyes:no-blink', duration: 5000 }]
            }
		},
		{
			text: ['15... 14... Eyes watering.', '10... 9... Burn is good.']
		},
		{
			text: '5... 4... 3... 2... 1...',
            behavior: {
                suggestions: [{ type: 'eyes:no-blink', duration: 5000 }]
            }
		},
		{
			text: 'CLOSE.'
		},
		{
			text: 'Instant relief.',
            behavior: {
                suggestions: [{ type: 'head:still', duration: 5000 }]
            }
		},

		// --- Phase 3: The Rapid Fire Visualization (Overload) ---
		{
			text: [
				'Open eyes.',
				'I will show you words.',
				'Visualize the object instantly.',
				"Don't think. See it."
			]
		},
		{ text: 'RED APPLE', duration: 2000 },
		{ text: 'BLUE OCEAN', duration: 2000 },
		{ text: 'LEMON', duration: 2000 },
		{ text: 'SNOW', duration: 2000 },
		{ text: 'NIGHT', duration: 2000 },
		{ text: 'THE SUN', duration: 2000 },

		{
			text: 'DROP YOUR JAW.',
            behavior: {
                suggestions: [{ type: 'mouth:relax', duration: 5000 }]
            }
		},

		// --- Phase 4: The Dissociation (The "Open-Eye" Trance) ---
		{
			text: [
				'Keep looking at the screen.',
				'But imagine your eyes are closed.',
				'Can you see the screen and imagine the dark at the same time?'
			]
		},
		{
			text: 'Try it. Nod if you can feel the confusion.',
            behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},
		{
			text: [
				'That confusion is the reset.',
				'Let your vision blur.',
				'Read these words without focusing.'
			]
		},
		{
			text: ['The arms are heavy.', 'The screen is far away.', 'The jaw is loose.'],
			duration: 10000
		},

		// --- Phase 5: The Physical Check (Active Somatics) ---
		{
			text: "Don't move your head."
		},
		{
			text: 'Look at your left shoulder (Eyes only).',
            behavior: {
                suggestions: [{ type: 'head:left', duration: 5000 }]
            }
		},
		{
			text: 'Drop that shoulder.'
		},
		{
			text: 'Look at your right shoulder (Eyes only).',
            behavior: {
                suggestions: [{ type: 'head:right', duration: 5000 }]
            }
		},
		{
			text: 'Drop that shoulder.'
		},
		{
			text: 'Center.',
			duration: 2000
		},
		{
			text: 'Are your shoulders down? Nod.',
            behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},

		// --- Phase 6: The Quick Anchor ---
		{
			text: [
				'Take one deep breath.',
				'Hold it.',
				'Squeeze your fists tight.',
				'Tighter.',
				'Exhale and RELEASE.'
			]
		},
		{
			text: 'Total stillness. 10 seconds.',
            behavior: {
                suggestions: [{ type: 'head:still', duration: 10000 }]
            }
		},

		// --- Phase 7: The Exit ---
		{
			text: ['Sharp.', 'Alert.', 'Reset.']
		},
		{
			text: 'Ready to go? Nod.',
            behavior: {
                suggestions: [{ type: 'head:nod', options: { nodsRequired: 1 } }]
            }
		},
		{
			text: 'Good work.'
		}
	]
}

export default somaticResetActive