import { AudioSession } from './audioSession'

export async function playOneShot(
	session: AudioSession,
	path: string,
	bus: 'voice' | 'fx',
	volume = 1,
	loop: boolean | number = false,
	fadeIn = 0
) {
	const buffer = await session.loadBuffer(path)
	const ctx = session.ctx

	const source = ctx.createBufferSource()
	const gain = ctx.createGain()
	
	const startTime = ctx.currentTime

	if (fadeIn > 0) {
		gain.gain.setValueAtTime(0, startTime)
		gain.gain.linearRampToValueAtTime(volume, startTime + fadeIn)
	} else {
		gain.gain.setValueAtTime(volume, startTime)
	}

	if (typeof loop === 'number') {
		source.loop = loop > 0
	} else {
		source.loop = loop
	}

	source.buffer = buffer
	source.connect(gain)
	gain.connect(session.buses[bus])

	source.start(startTime)

	const totalDuration = typeof loop === 'number' && loop > 0 
		? buffer.duration * (loop + 1) 
		: buffer.duration

	if (typeof loop === 'number' && loop > 0) {
		source.stop(startTime + totalDuration)
	}

	const promise = new Promise<void>(resolve => {
		source.onended = () => resolve()
	})

	return {
		stop: (fadeOut = 0.5) => {
			try {
				const now = ctx.currentTime
				gain.gain.cancelScheduledValues(now)
				gain.gain.setValueAtTime(gain.gain.value, now)
				gain.gain.linearRampToValueAtTime(0, now + fadeOut)
				source.stop(now + fadeOut)
			} catch (e) {
				// Ignore errors if already stopped
			}
		},
		gain, // Expose gain for real-time volume control if needed
		promise,
		duration: totalDuration
	}
}
