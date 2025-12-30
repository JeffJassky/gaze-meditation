import type { Session } from '../types'

export const theBlueDoor: Session = {
	id: 'prog_blue_door',
	title: 'The Blue Door',
	description:
		'A journey to a place of inner peace and beauty. Installs a permanent anchor for peace.',
	tags: ['peace', 'beauty'],
	audio: {
		musicTrack: 'audio/music.mp3',
		binaural: { hertz: 12 }
	},
	spiralBackground: 'img/spiral.png',
	scenes: [
		// ============================================================
		// SECTION 1: WELCOME / SETTLING
		// ============================================================

		{
			voice: `Welcome. This session is a journey inward. A journey to a place that already exists inside you.`,
			text: 'Welcome',
			audio: { binaural: { hertz: 12 } }
		},

		{
			voice: `Whatever brought you here, you're here now. Sitting, or maybe lying down. However it is, there's a surface beneath you. Something gently supporting you.`,
			text: ''
		},

		{
			voice: `You're already breathing. Your heart is beating. These things are already true.`,
			text: ''
		},

		{
			voice: `As you relax, you might notice your body is holding tension somewhere... Maybe your shoulders... Maybe your jaw... Somewhere behind the eyes.`,
			text: ''
		},

		{
			voice: `Or maybe, you're already relaxed... Either way, you're already settling... Already here... Nothing to do yet.`,
			text: ''
		},

		{
			voice: `The air has a temperature... The room has sounds — or maybe silence... These things are just here.`,
			text: ''
		},

		{
			voice: `You showed up... That's the only thing that matters... Everything else can wait.`,
			audio: { binaural: { hertz: 11 } }
		},

		// ============================================================
		// SECTION 2: FIXATION / EYE FATIGUE
		// ============================================================

		{
			voice: `Now... let your eyes find the center of the screen... Find a point and allow your eyes to gently rest there.`
		},

		{
			voice: `Just gently rest your gaze there... Let attention gather without force.`
		},

		{
			voice: `As you watch, you might find your peripheral vision softens... The edges becoming less important.`,
			audio: { binaural: { hertz: 10 } }
		},

		{
			voice: `Keep your eyes open... Soft but steady... Notice what begins to happen.`,
			text: 'Hold your gaze',
            behavior: {
                suggestions: [{ type: 'eyes:no-blink', duration: 15000 }]
            },
			audio: { binaural: { hertz: 10 } }
		},

		{
			voice: `You might notice your eyelids becoming heavy... A gentle weight gathering.`
		},

		{
			voice: `That heaviness is your body calming... Just notice the relaxation building.`
		},

		// ============================================================
		// SECTION 3: FIRST CLOSURE
		// ============================================================

		{
			voice: `Allow your blinks to come slowly now... Heavy... Unhurried... Like waves returning to shore.`,
			text: 'Stillness',
            behavior: {
                suggestions: [{ type: 'head:still', duration: 20000 }]
            }
		},

		{
			voice: `In a moment, I'll ask you to allow your eyes to close. Before that, take a gentle breath in through your nose.`,
			text: 'Breathe in'
		},

		{
			voice: `And as you exhale, allow your eyelids to gently drop... Settling closed like a warm blanket... allowing natural breath to return.`,
			text: 'Breathe out',
            behavior: {
                suggestions: [{ type: 'eyes:close', duration: 5000 }]
            },
			audio: { binaural: { hertz: 9 } }
		},

		{
			voice: `Good. Softly... relaxing... Eyes closed... The light on the screen still present... But it's losing importance...`
		},

		// ============================================================
		// SECTION 4: FRACTIONATION
		// ============================================================

		{
			voice: `Each time your eyelids close, they feel more comfortable... Each time they open, they close more easily.`,
			text: ''
		},

		{
			voice: `Nothing here requires effort.. The body knows how to be still...`,
			text: ''
		},

		{
			voice: `And when it feels natural, allow your eyes to open again.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            }
		},

		{
			voice: `Good... You're doing well.`,
			text: ''
		},

		{
			voice: `Open your eyes again... Feeling softer than before... Maybe more relaxed.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            },
			audio: { binaural: { hertz: 10 } }
		},

		{
			voice: `Let them close again... Relaxing deeper...`,
			text: 'Close your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:close', duration: 5000 }]
            },
			audio: { binaural: { hertz: 8 } }
		},

		{
			voice: `Perfect... One more time... Open your eyes gently... Just enough to allow the light to come through.`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            },
			audio: { binaural: { hertz: 9 } }
		},

		{
			voice: `In a moment, you can rest them closed, and keep them closed for the rest of the session.`
		},

		{
			voice: `Let them close now... Feeling deeper... more restful...`,
			text: 'Close your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:close', duration: 5000 }]
            },
			audio: { binaural: { hertz: 7 } }
		},

		// ============================================================
		// SECTION 5: FINAL CLOSURE
		// ============================================================

		{
			voice: `The room is still there, somewhere... Just becoming more distant... Less important... as you notice your awareness gently turning inward.`,
			audio: { binaural: { hertz: 6 } }
		},
		{
			voice: `Good... Everything that matters is already happening. Just as it should.`,
			cooldown: 5000
		},

		// ============================================================
		// SECTION 6: STAIRCASE APPEARS
		// ============================================================

		{
			voice: `In the darkness behind your eyes, something begins to take shape... Not forced... Just arriving.... You find yourself standing near the top of a beautiful staircase.`
		},

		{
			voice: `Carved from smooth stone. The stone feels cool beneath your feet.`
		},

		{
			voice: `Looking downward, you can see the slight curve of each step. A soft, dim light that gently invites you to step toward it...`
		},

		{
			voice: `You can't see the bottom just yet... But you know it's there. And you know it's safe.`
		},

		// ============================================================
		// SECTION 7: DESCENT (10 to 1)
		// ============================================================

		{
			voice: `With each step, you'll go deeper... More relaxed. More still. More assured.`
		},

		{
			voice: `Ten... Taking the first step... Feeling the cool stone beneath your foot as the weight your body gently supports it.`,
			text: 'Ten'
		},

		{
			voice: `Nine... Allowing tension to leave your jaw... Letting space between your teeth... The muscles of your face softening.`,
			text: 'Soften your jaw',
            behavior: {
                suggestions: [{ type: 'mouth:relax', duration: 8000 }]
            },
			audio: { binaural: { hertz: 6 } }
		},

		{
			voice: `Eight... Deeper... The air is cooler here... The light, dimmer... Becoming more silent.`,
			text: 'Eight'
		},

		{
			voice: `Seven... Your shoulders dropping... Tension you didn't know you were holding begins to release.`,
			text: 'Seven'
		},

		{
			voice: `Six... Leaving the surface world far above you... The air is still and quiet... The room is still...`,
			text: 'Stillness',
            behavior: {
                suggestions: [{ type: 'head:still', duration: 8000 }]
            },
			audio: { binaural: { hertz: 5 } }
		},

		{
			voice: `Five... Halfway there... Your breathing slow and even... Nothing to do... Nowhere to be.`,
			text: 'Five'
		},

		{
			voice: `Four... Every muscle in your back unspooling... Softening... Letting go.`,
			text: 'Four'
		},

		{
			voice: `Three... Almost at the bottom now... The light below is soft... Warm... Inviting.`,
			text: 'Three'
		},

		{
			voice: `Two... One more step... Your body is heavy and relaxed... Your mind is quiet and clear.`,
			text: 'Two'
		},

		{
			voice: `One... Stepping off the last step.`,
			text: 'One'
		},

		// ============================================================
		// SECTION 8: BOTTOM OF STAIRS
		// ============================================================

		{
			voice: `Both feet on solid ground... Complete stillness. Complete quiet.`,
			audio: { binaural: { hertz: 4 } }
		},

		{
			voice: `Take a moment here... The world above is very far away now.`
		},

		{
			voice: `The air is different here... Quieter... More still.`,
			cooldown: 5000
		},

		{
			voice: `And ahead of you... in the dim light... something appears.`
		},

		// ============================================================
		// SECTION 9: THE DOOR APPEARS
		// ============================================================

		{
			voice: `Faint lit, you see it... A door.`
		},

		{
			voice: `It's a heavy, solid door. The kind of door that has been there for a very long time.`
		},

		{
			voice: `Notice the color: A vivid, electric blue. Deeper than the sky... Richer than any blue you've seen before.`
		},

		{
			voice: `The blue door seems to hum with a quiet energy... Not loud... just present... As if it's been waiting for you.`
		},

		{
			voice: `See the ornate handle... Polished brass, worn smooth by countless hands... It catches the dim light, invites you to touch.`
		},

		// ============================================================
		// SECTION 10: THRESHOLD MOMENT
		// ============================================================

		{
			voice: `Reach out your hand... and wrap your fingers gently around the handle... Feeling the transfer of heat as the handle cools your skin, and your skin warms the handle.`
		},

		{
			voice: `You know there's something on the other side... Not the details... But the feeling... A wonderful feeling you've always known.`
		},

		{
			voice: `On the count of three, the blue door can be opened.`
		},

		{
			voice: `You gently take a breath in, knowing that once you open this door, things will feel different.`
		},

		{
			voice: `One... Tension slowly builds in your wrist as your hand gently begins to turn.`
		},

		{
			voice: `Two... The delicate brass knob feels heavy, with a reassuring weight.`
		},

		{
			voice: `Three... The latch clicks open... as you push open the blue door.`
		},

		// ============================================================
		// SECTION 11: FIRST IMPRESSION (FIELD)
		// ============================================================

		{
			voice: `Light floods in. Warm. Golden. Overwhelming.`,
			audio: { binaural: { hertz: 5 } }
		},

		{
			voice: `You step through the doorway and the darkness vanishes.`
		},

		{
			voice: `You are standing in an open field... Endless... Bathed in sunlight.`
		},

		{
			voice: `The light is warm and rich. The color of late afternoon. The color of honey.`
		},

		{
			voice: `The door behind you is still there. You can feel it. But you don't need to look back. Everything you need is ahead.`
		},

		{
			voice: `For a moment, you just stand here. Letting your eyes adjust. Letting the warmth radiate into your skin.`
		},

		// ============================================================
		// SECTION 12: WALKING INTO FIELD
		// ============================================================

		{
			voice: `You take a step forward... And another.`
		},

		{
			voice: `Across the entire field, flowers surround you. Millions of them. A meadow stretching in every direction as far as you can see.`
		},

		{
			voice: `Reds. Golds. Violets. Whites. The colors are so vivid they seem to vibrate.`
		},

		{
			voice: `Gently stepping, the petals brush against your legs as you walk. Soft. Delicate. Alive.`
		},
		{
			voice: `A gentle breeze sweeps through the field and across your skin. The grass is soft and cool.`
		},
		{
			voice: `Breathe in through your nose. The air is thick with fragrance. Jasmine. Lavender. Something sweeter underneath.`
		},
		{
			voice: `Keep walking. Deeper into the field. Toward the center.`
		},

		// ============================================================
		// SECTION 13: FINDING THE CENTER
		// ============================================================

		{
			voice: `Ahead, you see a clearing. A small meadow within the meadow.`
		},

		{
			voice: `Tall grasses. Soft and green. Swaying gently.`
		},

		{
			voice: `This is the place... The place you were walking to. You know it without being told.`
		},

		{
			voice: `Step into the clearing. Feel the grass beneath your feet... Stand here for a moment.`
		},

		// ============================================================
		// SECTION 14: THE MEADOW EXPANDS
		// ============================================================

		{
			voice: `The sun, warm on your face... On your shoulders... On your arms... Not hot... Just warm... Perfectly warm.`
		},

		{
			voice: `The breeze moves through... Gentle. It carries the scent of flowers... It cools your skin just enough.`
		},

		{
			voice: `As you look upward... The sky feels infinite... A blue so deep it has no end.`
		},

		{
			voice: `A few clouds drift slowly... White, and soft... In no hurry... Just exactly as they are.`
		},

		{
			voice: `The sound of birdsong from far off... A melody with no beginning and no end.`
		},

		{
			voice: `The grass shines as the breeze moves through it... A soft sound... The sound.. of peace.`
		},

		// ============================================================
		// SECTION 15: LYING DOWN / STILLNESS
		// ============================================================

		{
			voice: `If it feels right, let yourself lie down... The grass here will hold you.`,
			cooldown: 5000
		},

		{
			voice: `Feel your back meet the earth... The ground is soft... Supportive... It takes your weight completely.`
		},

		{
			voice: `Your arms resting at your sides... Your legs are easy...`
		},

		{
			voice: `Let yourself dissolve into this... Just for a moment... No thoughts required... No action needed... Just existing... Just being held.`,
			audio: { binaural: { hertz: 4 } },
			cooldown: 10000
		},

		{
			voice: `This is peace... Your peace.`
		},

		// ============================================================
		// SECTION 16: GRATITUDE / BEAUTY
		// ============================================================

		{
			voice: `As you lie here, you may notice a feeling arise.`
		},

		{
			voice: `It might feel like warmth. It might feel like softness. It might feel like your heart opening just slightly.`
		},

		{
			voice: `This is gratitude. Not for anything specific. Just gratitude. For this moment. For this place. For being alive to feel it.`
		},

		{
			voice: `Let it expand. You don't have to name it. You don't have to do anything. Just let it be.`
		},

		// ============================================================
		// SECTION 17: SOMATIC ANCHOR
		// ============================================================

		{
			voice: `Now. Notice where you feel this in your body.`
		},

		{
			voice: `Is it a warmth in your chest? A softness in your belly? A looseness in your shoulders?`
		},

		{
			voice: `Find the physical sensation. The place in your body where peace lives right now.`
		},

		{
			voice: `Focus on that sensation. Let it grow. Let it become more vivid. More real.`
		},

		{
			voice: `This is your body remembering, and accessing what peace feels like... It's always known.`
		},

		{
			voice: `Understand this: The beauty around you is not separate from you. This beauty is within you.`,
			cooldown: 10000
		},

		{
			voice: `You did not travel to get here... It has been within you... It's always been with you. And now... all you have to do is remember.`,
			cooldown: 10000
		},

		// ============================================================
		// SECTION 18: ANCHOR INSTALLATION
		// ============================================================

		{
			voice: `From now on, whenever you need this peace, you don't need the staircase... and you don't need a long journey.`
		},

		{
			voice: `You only need to close your eyes... and visualize... the Blue Door.`
		},

		{
			voice: `That vivid, electric blue... The brass handle... The hum of quiet energy.`
		},

		{
			voice: `Simply take a breath, and the blue door will open. The feeling will rush back in. Not slowly, but immediately.`
		},

		{
			voice: `Because this place is always here... The door is always unlocked... And it is always yours.`
		},

		{
			voice: `Let's practice once. Right now. Even though you're already here.`
		},

		{
			voice: `See the Blue Door in your mind. See its color.`
		},

		{
			voice: `Take one deep breath... and open it.`,
			cooldown: 5000
		},

		{
			voice: `Perfect... Feel the peace deepen... Even more... `
		},

		{
			voice: `This is the anchor. This is the key.`,
			cooldown: 3000
		},

		// ============================================================
		// SECTION 19: SAYING GOODBYE (FOR NOW)
		// ============================================================

		{
			voice: `It's almost time to return. But this place isn't going anywhere.`
		},

		{
			voice: `The field will be here. The meadow will be here. The sun will be warm whenever you come back.`
		},

		{
			voice: `This is not goodbye. This is just stepping out for a while.`
		},

		{
			voice: `Slowly, gently, let yourself sit up in the grass. Feel your body gather itself.`
		},

		// ============================================================
		// SECTION 20: RETURN JOURNEY
		// ============================================================

		{
			voice: `Standing... Feeling your feet in the cool grass one more time.`,
			audio: { binaural: { hertz: 6 } }
		},

		{
			voice: `Turn back toward the way you came... Across the meadow...`
		},

		{
			voice: `You can see the door in the distance. Still open. The stairwell beyond it.`
		},

		{
			voice: `You walk toward it. Gently, slowly, through the flowers. Carrying the warmth with you.`
		},

		{
			voice: `Step through the doorway. Feel the cool air of the stairwell on your skin.`
		},

		{
			voice: `The door closes gently behind you. Not locked. Never locked. Just closed for now.`
		},

		// ============================================================
		// SECTION 21: ASCENDING (1 to 10)
		// ============================================================

		{
			voice: `The staircase, inviting you upward... With each step, returning more fully. With each number, becoming more alert.`
		},

		{
			voice: `One... Taking a step upward... The peace still warm in your chest.`,
			text: '1'
		},

		{
			voice: `Two... Beginning to return... Awareness returning to your body.`,
			text: '2'
		},

		{
			voice: `Three... The sounds of the room becoming clearer... The world returning gently.`,
			text: '3'
		},

		{
			voice: `Four... Awareness returning to your feet. Your hands. The weight on whatever supports you.`,
			text: '4'
		},

		{
			voice: `Five... Halfway back. Your mind beginning to organize... Thoughts softly returning.`,
			text: '5',
			audio: { binaural: { hertz: 10 } }
		},

		{
			voice: `Six... Feeling more alert. More present. The heaviness lifting from your limbs.`,
			text: '6'
		},

		{
			voice: `Seven... Take a deeper breath... Letting oxygen reach every part of you.`,
			text: '7'
		},

		{
			voice: `Eight... Almost there... You might notice your fingers wanting to move... Your body wanting to stretch.`,
			text: '8'
		},

		{
			voice: `Nine... The room is clear now. Solid... You are here.`,
			text: '9'
		},

		{
			voice: `Ten.`,
			text: '10'
		},

		// ============================================================
		// SECTION 22: FINAL AWAKENING
		// ============================================================

		{
			voice: `Open your eyes now... Slowly... Gently...`,
			text: 'Open your eyes',
            behavior: {
                suggestions: [{ type: 'eyes:open' }]
            },
			audio: { binaural: { hertz: 12 } }
		},

		{
			voice: `Take your time... There's no rush.`
		},

		{
			voice: `Look around the room... Notice where you are... Feel how you feel.`
		},

		{
			voice: `Welcome back.`,
			text: 'Welcome back'
		},

		{
			voice: `The peace you found is still there... The door is still there... Whenever you need it, it's one breath away.`
		},

		{
			voice: `Take a moment before you move... Stretch if you want to... Feel your feet on the floor.`,
			cooldown: 5000
		},

		{
			voice: `Until next time.`,
			cooldown: 15000
		}
	]
}

export default theBlueDoor