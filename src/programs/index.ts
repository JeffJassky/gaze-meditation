import somaticResetFull from './somatic-relaxaton'
import theBlueDoor from './the-blue-door'
import councilOfFireLong from './council-of-fire'
import somaticResetActive from './kinetic-reset'
import { heldWithoutRope } from './held-without-rope'
import { initialTrainingSession } from './tutorial'
import { type Session, FormFieldType } from '../types'

export { initialTrainingSession }

export const TEST_SESSIONS: Session[] = [
	{
		id: 'test_close_eyes',
		title: 'Close Eyes (Test)',
		description: 'Scene that waits for you to close your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Please close your eyes now. ~ The scene will complete when you do.',
				behavior: {
					suggestions: [{ type: 'eyes:close' }]
				}
			}
		]
	},
	{
		id: 'test_open_eyes',
		title: 'Open Eyes (Test)',
		description: 'Scene that waits for you to open your eyes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Open your eyes.',
				behavior: {
					suggestions: [{ type: 'eyes:open' }]
				}
			}
		]
	},
	{
		id: 'test_relax_jaw',
		title: 'Relax Jaw',
		description: 'Relax your jaw and let your mouth fall open.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Open your mouth and relax your jaw',
				behavior: {
					suggestions: [{ type: 'mouth:relax', duration: 5000 }]
				}
			}
		]
	},
	{
		id: 'test_blink_scene',
		title: 'Dont Blink',
		description: "Stare at the screen. Don't you dare blink.",
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Do not blink',
				behavior: {
					suggestions: [{ type: 'eyes:no-blink', duration: 5000 }]
				}
			}
		]
	},
	{
		id: 'test_directional_gaze_scene',
		title: 'Direct Your Gaze',
		description: 'Gaze at one thing - and not the other.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Gently turn your head to the left.',
				behavior: {
					suggestions: [{ type: 'head:left' }]
				}
			},
			{
				text: 'Gently turn your head to the right.',
				behavior: {
					suggestions: [{ type: 'head:right' }]
				}
			},
			{
				text: 'Gently upward.',
				behavior: {
					suggestions: [{ type: 'head:up' }]
				}
			},
			{
				text: 'Down.',
				behavior: {
					suggestions: [{ type: 'head:down', duration: 10000 }]
				}
			}
		]
	},

	{
		id: 'test_read_scene',
		title: 'Read',
		description: 'Simply read what is shown.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'It lasts 3 seconds, then fades out',
				duration: 3000,
				fadeInDuration: 1000,
				fadeOutDuration: 1000
			},
			{
				text: 'lasts 1 second, then fades out over 5 seconds',
				duration: 1000,
				fadeOutDuration: 5000
			}
		]
	},
	{
		id: 'test_speech_scene',
		title: 'Verbal Affirmation',
		description: 'Speak what you see.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Read this aloud',
				behavior: {
					suggestions: [
						{
							type: 'speech:speak',
							options: { targetValue: 'I am reading this.', duration: 3000 }
						}
					]
				}
			}
		]
	},
	{
		id: 'test_stillness_scene',
		title: 'Stay Still',
		description: 'Stay very... very... still.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'keep the blue dot centered in the ring.',
				behavior: {
					suggestions: [{ type: 'head:still', duration: 20000 }]
				}
			}
		]
	},
	{
		id: 'test_type_scene',
		title: 'Type',
		description: 'Type the words you see them.',
		audio: { musicTrack: 'silence.mp4' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Type "test"',
				behavior: { suggestions: [{ type: 'type', options: { targetPhrase: 'test' } }] }
			}
		]
	},
	{
		id: 'test_form_scene',
		title: 'Fill out a Form',
		description: 'Answer questons in a form.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Please enter your name',
				behavior: {
					suggestions: [{ type: 'form:submit' }]
				},
				question: 'What is your name?',
				fields: [{ label: 'Name', name: 'name', type: FormFieldType.TEXT, required: true }],
				autoContinue: true
			} as any // Cast to any because FormSceneConfig extends SceneConfig
		]
	},
	{
		id: 'test_head_nod',
		title: 'Head Nod',
		description: 'Nod your head yes.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Nod your head.',
				behavior: {
					suggestions: [{ type: 'head:nod' }]
				}
			}
		]
	},
	{
		id: 'test_head_shake',
		title: 'Head Shake',
		description: 'Shake your head no.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Shake your head.',
				behavior: {
					suggestions: [{ type: 'head:shake' }]
				}
			}
		]
	},
	{
		id: 'test_tongue_out',
		title: 'Tongue Out',
		description: 'Stick your tongue out.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Stick your tongue out.',
				behavior: {
					suggestions: [{ type: 'tongue:out', duration: 3000 }]
				}
			}
		]
	},
	{
		id: 'test_motion_move',
		title: 'Motion Move',
		description: 'Move the device to continue.',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Move the device.',
				behavior: {
					suggestions: [{ type: 'motion:move' }]
				},
				duration: 10000
			}
		]
	},
	{
		id: 'test_motion_impact_progress',
		title: 'Motion Impact (Progress)',
		description: 'Impact the device 3 times (Progress Ring).',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Tap the device 3 times.',
				behavior: {
					suggestions: [
						{ type: 'motion:impact', options: { impacts: 3, display: 'progress' } }
					]
				}
			}
		]
	},
	{
		id: 'test_motion_impact_dots',
		title: 'Motion Impact (Dots)',
		description: 'Impact the device 5 times (Dots).',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Tap the device 5 times.',
				behavior: {
					suggestions: [{ type: 'motion:impact', options: { impacts: 5, display: 'dots' } }]
				}
			}
		]
	},
	{
		id: 'test_motion_impact_none',
		title: 'Motion Impact (None)',
		description: 'Impact the device once (No Visuals).',
		audio: { musicTrack: '/audio/music.mp3' },
		spiralBackground: '/img/spiral.png',
		scenes: [
			{
				text: 'Tap the device once.',
				behavior: {
					suggestions: [{ type: 'motion:impact', options: { impacts: 1, display: 'none' } }]
				}
			}
		]
	}
].map(session => ({
	...session,
	skipIntro: true
}))

export const ALL_SESSIONS: Session[] = [
	somaticResetFull,
	councilOfFireLong,
	theBlueDoor,
	somaticResetActive,
	heldWithoutRope,
	initialTrainingSession,
	...TEST_SESSIONS
]

export const getSessionById = (id: string): Session | undefined => {
	return ALL_SESSIONS.find(s => s.id === id)
}
