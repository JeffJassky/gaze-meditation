import { AudioSession } from './audioSession'

export async function playOneShot(
	session: AudioSession,
	path: string,
	bus: 'voice' | 'fx',
	volume = 1
) {
	const buffer = await session.loadBuffer(path)
	const ctx = session.ctx

	const source = ctx.createBufferSource()
	const gain = ctx.createGain()

	gain.gain.value = volume

	source.buffer = buffer
	source.connect(gain)
	gain.connect(session.buses[bus])

	source.start()
}
