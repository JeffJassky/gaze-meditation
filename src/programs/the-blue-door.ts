import type { Program } from '../types'
import {
	ReadInstruction,
	StillnessInstruction,
	NoBlinkInstruction,
	RelaxJawInstruction,
	OpenEyesInstruction,
	CloseEyesInstruction
} from '../instructions'

export const theBlueDoor: Program = {
	id: 'prog_blue_door',
	title: 'The Blue Door',
	description:
		'A journey to a place of inner peace and beauty. Uses fractionation and installs a permanent anchor for peace.',
	tags: ['peace', 'bliss'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 12 }
	},
	spiralBackground: 'img/spiral.png',
	instructions: [
		// ============================================================
		// SECTION 1: WELCOME / SETTLING
		// ============================================================

		new ReadInstruction({
			voice: `Welcome. This session is a journey inward. A journey to a place that already exists inside you.`,
			text: 'Welcome',
			audio: { binaural: { hertz: 12 } }
		}),

		new ReadInstruction({
			voice: `Whatever brought you here, you're here now. Sitting, or maybe lying down. However it is, there's a surface beneath you. Something gently supporting you.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You're already breathing. Your heart is beating. These things are already true.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `As you relax, you might notice your body is holding tension somewhere... Maybe your shoulders... Maybe your jaw... Somewhere behind the eyes.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Or maybe, you're already relaxed... Either way, you're already settling... Already here... Nothing to do yet.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `The air has a temperature... The room has sounds — or maybe silence... These things are just here.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `You showed up... That's the only thing that matters... Everything else can wait.`,
			audio: { binaural: { hertz: 11 } }
		}),

		// ============================================================
		// SECTION 2: FIXATION / EYE FATIGUE
		// ============================================================

		new ReadInstruction({
			voice: `Now... let your eyes find the center of the screen... Find a point and allow your eyes to gently rest there.`
		}),

		new ReadInstruction({
			voice: `Just gently rest your gaze there... Let attention gather without force.`
		}),

		new ReadInstruction({
			voice: `As you watch, you might find your peripheral vision softens... The edges becoming less important.`,
			audio: { binaural: { hertz: 10 } }
		}),

		new NoBlinkInstruction({
			voice: `Keep your eyes open... Soft but steady... Notice what begins to happen.`,
			prompt: 'Hold your gaze',
			duration: 15000,
			audio: { binaural: { hertz: 10 } }
		}),

		new ReadInstruction({
			voice: `You might notice your eyelids becoming heavy... A gentle weight gathering.`
		}),

		new ReadInstruction({
			voice: `That heaviness is your body calming... Just notice the relaxation building.`
		}),

		// ============================================================
		// SECTION 3: FIRST CLOSURE
		// ============================================================

		new StillnessInstruction({
			voice: `Allow your blinks to come slowly now... Heavy... Unhurried... Like waves returning to shore.`,
			prompt: 'Stillness',
			duration: 20000
		}),

		new ReadInstruction({
			voice: `In a moment, I'll ask you to allow your eyes to close. Before that, take a gentle breath in through your nose.`,
			text: 'Breathe in'
		}),

		new CloseEyesInstruction({
			voice: `And as you exhale, allow your eyelids to gently drop... Settling closed like a warm blanket... allowing natural breath to return.`,
			text: 'Breathe out',
			duration: 5000,
			audio: { binaural: { hertz: 9 } }
		}),

		new ReadInstruction({
			voice: `Good. Softly... relaxing... Eyes closed... The light on the screen still present... But it's losing importance...`
		}),

		// ============================================================
		// SECTION 4: FRACTIONATION
		// ============================================================

		new ReadInstruction({
			voice: `Each time your eyelids close, they feel more comfortable... Each time they open, they close more easily.`,
			text: ''
		}),

		new ReadInstruction({
			voice: `Nothing here requires effort.. The body knows how to be still...`,
			text: ''
		}),

		new OpenEyesInstruction({
			voice: `And when it feels natural, allow your eyes to open again.`,
			text: 'Open your eyes'
		}),

		new ReadInstruction({
			voice: `Good... You're doing well.`,
			text: ''
		}),

		new OpenEyesInstruction({
			voice: `Open your eyes again... Feeling softer than before... Maybe more relaxed.`,
			text: 'Open your eyes',
			audio: { binaural: { hertz: 10 } }
		}),

		new CloseEyesInstruction({
			voice: `Let them close again... Relaxing deeper...`,
			text: 'Close your eyes',
			duration: 5000,
			audio: { binaural: { hertz: 8 } }
		}),

		new OpenEyesInstruction({
			voice: `Perfect... One more time... Open your eyes gently... Just enough to allow the light to come through.`,
			text: 'Open your eyes',
			audio: { binaural: { hertz: 9 } }
		}),

		new ReadInstruction({
			voice: `In a moment, you can rest them closed, and keep them closed for the rest of the session.`
		}),

		new CloseEyesInstruction({
			voice: `Let them close now... Feeling deeper... more restful...`,
			text: 'Close your eyes',
			duration: 5000,
			audio: { binaural: { hertz: 7 } }
		}),

		// ============================================================
		// SECTION 5: FINAL CLOSURE
		// ============================================================

		new ReadInstruction({
			voice: `The room is still there, somewhere... Just becoming more distant... Less important... as you notice your awareness gently turning inward.`,
			audio: { binaural: { hertz: 6 } }
		}),
		new ReadInstruction({
			voice: `Good... Everything that matters is already happening. Just as it should.`,
			cooldown: 5000
		}),

		// ============================================================
		// SECTION 6: STAIRCASE APPEARS
		// ============================================================

		new ReadInstruction({
			voice: `In the darkness behind your eyes, something begins to take shape... Not forced... Just arriving.... You find yourself standing near the top of a beautiful staircase.`
		}),

		new ReadInstruction({
			voice: `Carved from smooth stone. The stone feels cool beneath your feet.`
		}),

		new ReadInstruction({
			voice: `Looking downward, you can see the slight curve of each step. A soft, dim light that gently invites you to step toward it...`
		}),

		new ReadInstruction({
			voice: `You can't see the bottom just yet... But you know it's there. And you know it's safe.`
		}),

		// ============================================================
		// SECTION 7: DESCENT (10 to 1)
		// ============================================================

		new ReadInstruction({
			voice: `With each step, you'll go deeper... More relaxed. More still. More assured.`
		}),

		new ReadInstruction({
			voice: `Ten... Taking the first step... Feeling the cool stone beneath your foot as the weight your body gently supports it.`,
			text: 'Ten'
		}),

		new RelaxJawInstruction({
			voice: `Nine... Allowing tension to leave your jaw... Letting space between your teeth... The muscles of your face softening.`,
			prompt: 'Soften your jaw',
			duration: 8000,
			audio: { binaural: { hertz: 6 } }
		}),

		new ReadInstruction({
			voice: `Eight... Deeper... The air is cooler here... The light, dimmer... Becoming more silent.`,
			text: 'Eight'
		}),

		new ReadInstruction({
			voice: `Seven... Your shoulders dropping... Tension you didn't know you were holding begins to release.`,
			text: 'Seven'
		}),

		new StillnessInstruction({
			voice: `Six... Leaving the surface world far above you... The air is still and quiet... The room is still...`,
			prompt: '',
			duration: 8000,
			audio: { binaural: { hertz: 5 } }
		}),

		new ReadInstruction({
			voice: `Five... Halfway there... Your breathing slow and even... Nothing to do... Nowhere to be.`,
			text: 'Five'
		}),

		new ReadInstruction({
			voice: `Four... Every muscle in your back unspooling... Softening... Letting go.`,
			text: 'Four'
		}),

		new ReadInstruction({
			voice: `Three... Almost at the bottom now... The light below is soft... Warm... Inviting.`,
			text: 'Three'
		}),

		new ReadInstruction({
			voice: `Two... One more step... Your body is heavy and relaxed... Your mind is quiet and clear.`,
			text: 'Two'
		}),

		new ReadInstruction({
			voice: `One... Stepping off the last step.`,
			text: 'One'
		}),

		// ============================================================
		// SECTION 8: BOTTOM OF STAIRS
		// ============================================================

		new ReadInstruction({
			voice: `Both feet on solid ground... Complete stillness. Complete quiet.`,
			audio: { binaural: { hertz: 4 } }
		}),

		new ReadInstruction({
			voice: `Take a moment here... The world above is very far away now.`
		}),

		new ReadInstruction({
			voice: `The air is different here... Quieter... More still.`,
			cooldown: 5000
		}),

		new ReadInstruction({
			voice: `And ahead of you... in the dim light... something appears.`
		}),

		// ============================================================
		// SECTION 9: THE DOOR APPEARS
		// ============================================================

		new ReadInstruction({
			voice: `Faintly lit, you see it... A door.`
		}),

		new ReadInstruction({
			voice: `It's a heavy, solid door. The kind of door that has been there for a very long time.`
		}),

		new ReadInstruction({
			voice: `Notice the color: A vivid, electric blue. Deeper than the sky... Richer than any blue you've seen before.`
		}),

		new ReadInstruction({
			voice: `The blue door seems to hum with a quiet energy... Not loud... just present... As if it's been waiting for you.`
		}),

		new ReadInstruction({
			voice: `See the ornate handle... Polished brass, worn smooth by countless hands... It catches the dim light, invites you to touch.`
		}),

		// ============================================================
		// SECTION 10: THRESHOLD MOMENT
		// ============================================================

		new ReadInstruction({
			voice: `Reach out your hand... and wrap your fingers gently around the handle... Feeling the transfer of heat as the handle cools your skin, and your skin warms the handle.`
		}),

		new ReadInstruction({
			voice: `You know there's something on the other side... Not the details... But the feeling... A wonderful feeling you've always known.`
		}),

		new ReadInstruction({
			voice: `On the count of three, the blue door can be opened.`
		}),

		new ReadInstruction({
			voice: `You gently take a breath in, knowing that once you open this door, things will feel different.`
		}),

		new ReadInstruction({
			voice: `One... Tension slowly builds in your wrist as your hand gently begins to turn.`
		}),

		new ReadInstruction({
			voice: `Two... The delicate brass knob feels heavy, with a reassuring weight.`
		}),

		new ReadInstruction({
			voice: `Three... The latch clicks open... as you push open the blue door.`
		}),

		// ============================================================
		// SECTION 11: FIRST IMPRESSION (FIELD)
		// ============================================================

		new ReadInstruction({
			voice: `Light floods in. Warm. Golden. Overwhelming.`,
			audio: { binaural: { hertz: 5 } }
		}),

		new ReadInstruction({
			voice: `You step through the doorway and the darkness vanishes.`
		}),

		new ReadInstruction({
			voice: `You are standing in an open field... Endless... Bathed in sunlight.`
		}),

		new ReadInstruction({
			voice: `The light is warm and rich. The color of late afternoon. The color of honey.`
		}),

		new ReadInstruction({
			voice: `The door behind you is still there. You can feel it. But you don't need to look back. Everything you need is ahead.`
		}),

		new ReadInstruction({
			voice: `For a moment, you just stand here. Letting your eyes adjust. Letting the warmth radiate into your skin.`
		}),

		// ============================================================
		// SECTION 12: WALKING INTO FIELD
		// ============================================================

		new ReadInstruction({
			voice: `You take a step forward... And another.`
		}),

		new ReadInstruction({
			voice: `Across the entire field, flowers surround you. Millions of them. A meadow stretching in every direction as far as you can see.`
		}),

		new ReadInstruction({
			voice: `Reds. Golds. Violets. Whites. The colors are so vivid they seem to vibrate.`
		}),

		new ReadInstruction({
			voice: `Gently stepping, the petals brush against your legs as you walk. Soft. Delicate. Alive.`
		}),
		new ReadInstruction({
			voice: `A gentle breeze sweeps through the field and across your skin. The grass is soft and cool.`
		}),
		new ReadInstruction({
			voice: `Breathe in through your nose. The air is thick with fragrance. Jasmine. Lavender. Something sweeter underneath.`
		}),
		new ReadInstruction({
			voice: `Keep walking. Deeper into the field. Toward the center.`
		}),

		// ============================================================
		// SECTION 13: FINDING THE CENTER
		// ============================================================

		new ReadInstruction({
			voice: `Ahead, you see a clearing. A small meadow within the meadow.`
		}),

		new ReadInstruction({
			voice: `Tall grasses. Soft and green. Swaying gently.`
		}),

		new ReadInstruction({
			voice: `This is the place... The place you were walking to. You know it without being told.`
		}),

		new ReadInstruction({
			voice: `Step into the clearing. Feel the grass beneath your feet... Stand here for a moment.`
		}),

		// ============================================================
		// SECTION 14: THE MEADOW EXPANDS
		// ============================================================

		new ReadInstruction({
			voice: `The sun, warm on your face... On your shoulders... On your arms... Not hot... Just warm... Perfectly warm.`
		}),

		new ReadInstruction({
			voice: `The breeze moves through... Gentle. It carries the scent of flowers... It cools your skin just enough.`
		}),

		new ReadInstruction({
			voice: `As you look upward... The sky feels infinite... A blue so deep it has no end.`
		}),

		new ReadInstruction({
			voice: `A few clouds drift slowly... White, and soft... In no hurry... Just exactly as they are.`
		}),

		new ReadInstruction({
			voice: `The sound of birdsong from far off... A melody with no beginning and no end.`
		}),

		new ReadInstruction({
			voice: `The grass shines as the breeze moves through it... A soft sound... The sound.. of peace.`
		}),

		// ============================================================
		// SECTION 15: LYING DOWN / STILLNESS
		// ============================================================

		new ReadInstruction({
			voice: `If it feels right, let yourself lie down... The grass here will hold you.`,
			cooldown: 5000
		}),

		new ReadInstruction({
			voice: `Feel your back meet the earth... The ground is soft... Supportive... It takes your weight completely.`
		}),

		new ReadInstruction({
			voice: `Your arms resting at your sides... Your legs are easy...`
		}),

		new ReadInstruction({
			voice: `Let yourself dissolve into this... Just for a moment... No thoughts required... No action needed... Just existing... Just being held.`,
			audio: { binaural: { hertz: 4 } },
			cooldown: 10000
		}),

		new ReadInstruction({
			voice: `This is peace... Your peace.`
		}),

		// ============================================================
		// SECTION 16: GRATITUDE / BEAUTY
		// ============================================================

		new ReadInstruction({
			voice: `As you lie here, you may notice a feeling arise.`
		}),

		new ReadInstruction({
			voice: `It might feel like warmth. It might feel like softness. It might feel like your heart opening just slightly.`
		}),

		new ReadInstruction({
			voice: `This is gratitude. Not for anything specific. Just gratitude. For this moment. For this place. For being alive to feel it.`
		}),

		new ReadInstruction({
			voice: `Let it expand. You don't have to name it. You don't have to do anything. Just let it be.`
		}),

		// ============================================================
		// SECTION 17: SOMATIC ANCHOR
		// ============================================================

		new ReadInstruction({
			voice: `Now. Notice where you feel this in your body.`
		}),

		new ReadInstruction({
			voice: `Is it a warmth in your chest? A softness in your belly? A looseness in your shoulders?`
		}),

		new ReadInstruction({
			voice: `Find the physical sensation. The place in your body where peace lives right now.`
		}),

		new ReadInstruction({
			voice: `Focus on that sensation. Let it grow. Let it become more vivid. More real.`
		}),

		new ReadInstruction({
			voice: `This is your body remembering, and accessing what peace feels like... It's always known.`
		}),

		new ReadInstruction({
			voice: `Understand this: The beauty around you is not separate from you. This beauty is within you.`,
			cooldown: 10000
		}),

		new ReadInstruction({
			voice: `You did not travel to get here... It has been within you... It's always been with you. And now... all you have to do is remember.`,
			cooldown: 10000
		}),

		// ============================================================
		// SECTION 18: ANCHOR INSTALLATION
		// ============================================================

		new ReadInstruction({
			voice: `From now on, whenever you need this peace, you don't need the staircase... and you don't need a long journey.`
		}),

		new ReadInstruction({
			voice: `You only need to close your eyes... and visualize... the Blue Door.`
		}),

		new ReadInstruction({
			voice: `That vivid, electric blue... The brass handle... The hum of quiet energy.`
		}),

		new ReadInstruction({
			voice: `Simply take a breath, and the blue door will open. The feeling will rush back in. Not slowly, but immediately.`
		}),

		new ReadInstruction({
			voice: `Because this place is always here... The door is always unlocked... And it is always yours.`
		}),

		new ReadInstruction({
			voice: `Let's practice once. Right now. Even though you're already here.`
		}),

		new ReadInstruction({
			voice: `See the Blue Door in your mind. See its color.`
		}),

		new ReadInstruction({
			voice: `Take one deep breath... and open it.`,
			cooldown: 5000
		}),

		new ReadInstruction({
			voice: `Perfect... Feel the peace deepen... Even more... `
		}),

		new ReadInstruction({
			voice: `This is the anchor. This is the key.`,
			cooldown: 3000
		}),

		// ============================================================
		// SECTION 19: SAYING GOODBYE (FOR NOW)
		// ============================================================

		new ReadInstruction({
			voice: `It's almost time to return. But this place isn't going anywhere.`
		}),

		new ReadInstruction({
			voice: `The field will be here. The meadow will be here. The sun will be warm whenever you come back.`
		}),

		new ReadInstruction({
			voice: `This is not goodbye. This is just stepping out for a while.`
		}),

		new ReadInstruction({
			voice: `Slowly, gently, let yourself sit up in the grass. Feel your body gather itself.`
		}),

		// ============================================================
		// SECTION 20: RETURN JOURNEY
		// ============================================================

		new ReadInstruction({
			voice: `Standing... Feeling your feet in the cool grass one more time.`,
			audio: { binaural: { hertz: 6 } }
		}),

		new ReadInstruction({
			voice: `Turn back toward the way you came... Across the meadow...`
		}),

		new ReadInstruction({
			voice: `You can see the door in the distance. Still open. The stairwell beyond it.`
		}),

		new ReadInstruction({
			voice: `You walk toward it. Gently, slowly, through the flowers. Carrying the warmth with you.`
		}),

		new ReadInstruction({
			voice: `Step through the doorway. Feel the cool air of the stairwell on your skin.`
		}),

		new ReadInstruction({
			voice: `The door closes gently behind you. Not locked. Never locked. Just closed for now.`
		}),

		// ============================================================
		// SECTION 21: ASCENDING (1 to 10)
		// ============================================================

		new ReadInstruction({
			voice: `The staircase, inviting you upward... With each step, returning more fully. With each number, becoming more alert.`
		}),

		new ReadInstruction({
			voice: `One... Taking a step upward... The peace still warm in your chest.`,
			text: '1'
		}),

		new ReadInstruction({
			voice: `Two... Beginning to return... Awareness returning to your body.`,
			text: '2'
		}),

		new ReadInstruction({
			voice: `Three... The sounds of the room becoming clearer... The world returning gently.`,
			text: '3'
		}),

		new ReadInstruction({
			voice: `Four... Awareness returning to your feet. Your hands. The weight on whatever supports you.`,
			text: '4'
		}),

		new ReadInstruction({
			voice: `Five... Halfway back. Your mind beginning to organize... Thoughts softly returning.`,
			text: '5',
			audio: { binaural: { hertz: 10 } }
		}),

		new ReadInstruction({
			voice: `Six... Feeling more alert. More present. The heaviness lifting from your limbs.`,
			text: '6'
		}),

		new ReadInstruction({
			voice: `Seven... Take a deeper breath... Letting oxygen reach every part of you.`,
			text: '7'
		}),

		new ReadInstruction({
			voice: `Eight... Almost there... You might notice your fingers wanting to move... Your body wanting to stretch.`,
			text: '8'
		}),

		new ReadInstruction({
			voice: `Nine... The room is clear now. Solid... You are here.`,
			text: '9'
		}),

		new ReadInstruction({
			voice: `Ten.`,
			text: '10'
		}),

		// ============================================================
		// SECTION 22: FINAL AWAKENING
		// ============================================================

		new OpenEyesInstruction({
			voice: `Open your eyes now... Slowly... Gently...`,
			text: 'Open your eyes',
			audio: { binaural: { hertz: 12 } }
		}),

		new ReadInstruction({
			voice: `Take your time... There's no rush.`
		}),

		new ReadInstruction({
			voice: `Look around the room... Notice where you are... Feel how you feel.`
		}),

		new ReadInstruction({
			voice: `Welcome back.`,
			text: 'Welcome back'
		}),

		new ReadInstruction({
			voice: `The peace you found is still there... The door is still there... Whenever you need it, it's one breath away.`
		}),

		new ReadInstruction({
			voice: `Take a moment before you move... Stretch if you want to... Feel your feet on the floor.`,
			cooldown: 5000
		}),

		new ReadInstruction({
			voice: `Until next time.`,
			cooldown: 15000
		})
	]
}

export default theBlueDoor
