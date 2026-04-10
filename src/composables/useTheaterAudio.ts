import { computed, ref, type ShallowRef } from 'vue'
import { audioSession } from '../audio'
import { playOneShot } from '../audio/oneShot'
import type { Session } from '../api/sessions'
import type { Scene } from '@/core/Scene'

/**
 * All audio concerns for the Theater: music, binaural, soundboard, FX.
 *
 * Owns: audioSession, playOneShot.
 * Does NOT own scene progression or device lifecycle.
 */
export function useTheaterAudio(
	activeSession: ShallowRef<Session | null>,
	sessionScenes: ShallowRef<Scene[]>,
) {
	const activeFxStops = ref<Set<(fade?: number) => void>>(new Set())
	const activeSoundboardStops = ref(new Map<string, (fade?: number) => void>())
	const soundboardErrors = ref<Set<string>>(new Set())
	const activeSoundboardIds = computed(() =>
		Array.from(activeSoundboardStops.value.keys()),
	)

	// --- Helpers ---------------------------------------------------------------

	function getSoundboardSample(id: string) {
		return activeSession.value?.audio?.soundboard?.find(s => s.id === id)
	}

	function isLoopingSample(id: string) {
		return getSoundboardSample(id)?.loop === true
	}

	// --- Public API ------------------------------------------------------------

	/** Set up the audio context, music looper, binaural and preload soundboard. */
	async function setup(session: Session) {
		await audioSession.setup()

		if (session.audio?.musicTrack && session.audio.musicTrack !== 'none') {
			try {
				await audioSession.musicLooper.start({
					track: session.audio.musicTrack,
					volume: 0.8,
				})
			} catch (e) {
				console.warn(`[TheaterAudio] Failed to start music track: ${session.audio.musicTrack}`, e)
			}
		}

		// Preload & validate soundboard samples.
		soundboardErrors.value.clear()
		if (session.audio?.soundboard) {
			await Promise.allSettled(
				session.audio.soundboard.map(async sample => {
					try {
						await audioSession.loadBuffer(sample.path)
					} catch (e) {
						console.error(`[TheaterAudio] Failed to load soundboard sample: ${sample.id}`, e)
						soundboardErrors.value.add(sample.id)
					}
				}),
			)
		}

		const bConfig = session.audio?.binaural
		audioSession.binaural.start({
			carrierFreq: 100,
			beatFreq: bConfig?.hertz ?? 6,
			volume: bConfig?.volume ?? 0.5,
		})
	}

	/** Update binaural settings for a scene-level override. */
	function applySceneBinaural(scene: Scene) {
		const b = scene.config.audio?.binaural
		if (!b) return
		if (audioSession.binaural.isActive) {
			if (b.hertz !== undefined) audioSession.binaural.setBeatFrequency(b.hertz)
			if (b.volume !== undefined) audioSession.binaural.setVolume(b.volume)
		}
	}

	/**
	 * NLE-style soundboard state reconciliation.
	 *
	 * Given the target scene index, compute the expected set of active loops,
	 * stop anything that shouldn't be playing, start anything that's missing,
	 * and fire one-shots for the current scene.
	 */
	function reconcileSoundboard(
		targetIndex: number,
		currentScene: Scene | undefined,
		isSequential: boolean,
	) {
		const expectedLoops = getExpectedLoopState(targetIndex)
		const currentActiveIDs = Array.from(activeSoundboardStops.value.keys())

		// 1. Stop sounds that shouldn't be playing.
		for (const id of currentActiveIDs) {
			const isLoop = isLoopingSample(id)
			if (isLoop && !expectedLoops.has(id)) {
				const stop = activeSoundboardStops.value.get(id)
				stop?.(getSoundboardSample(id)?.fadeOutDuration ?? 0.5)
				activeSoundboardStops.value.delete(id)
			} else if (!isLoop && !isSequential) {
				const stop = activeSoundboardStops.value.get(id)
				stop?.(0.5)
				activeSoundboardStops.value.delete(id)
			}
		}

		// 2. Start expected loops that aren't playing.
		for (const id of expectedLoops) {
			if (!activeSoundboardStops.value.has(id)) {
				startSample(id)
			}
		}

		// 3. Trigger one-shots for this specific scene.
		if (currentScene?.config.audio?.soundboard) {
			for (const evt of currentScene.config.audio.soundboard) {
				if (isLoopingSample(evt.id)) continue
				if (evt.event === 'start') {
					startSample(evt.id)
				} else if (evt.event === 'stop') {
					const stop = activeSoundboardStops.value.get(evt.id)
					stop?.(0.5)
					activeSoundboardStops.value.delete(evt.id)
				}
			}
		}
	}

	/** Play a scene-level FX one-shot. */
	function playSceneFx(scene: Scene) {
		const fx = scene.config.audio?.fx
		if (!fx) return
		playOneShot(audioSession, fx.path, 'fx', fx.volume ?? 1, fx.loop ?? false)
			.then(control => {
				activeFxStops.value.add(control.stop)
				control.promise.then(() => activeFxStops.value.delete(control.stop))
			})
			.catch(e => console.warn('[TheaterAudio] Failed to play FX', e))
	}

	/** Toggle a soundboard sample on/off (used by transport control). */
	function toggleSoundboardSample(id: string) {
		if (soundboardErrors.value.has(id)) return

		if (activeSoundboardStops.value.has(id)) {
			const stop = activeSoundboardStops.value.get(id)
			stop?.(getSoundboardSample(id)?.fadeOutDuration ?? 0.5)
			activeSoundboardStops.value.delete(id)
		} else {
			startSample(id)
		}
	}

	/** Switch music/binaural when transitioning to a new session. */
	async function switchSession(session: Session) {
		if (session.audio?.musicTrack && session.audio.musicTrack !== 'none') {
			try {
				await audioSession.musicLooper.start({
					track: session.audio.musicTrack,
					volume: 0.8,
				})
			} catch (e) {
				console.warn('[TheaterAudio] Failed to update music track', e)
			}
		} else {
			audioSession.musicLooper.stop(2)
		}

		const bConfig = session.audio?.binaural
		if (bConfig) {
			if (audioSession.binaural.isActive) {
				audioSession.binaural.setBeatFrequency(bConfig.hertz ?? 6)
				audioSession.binaural.setVolume(bConfig.volume ?? 0.5)
			} else {
				audioSession.binaural.start({
					carrierFreq: 100,
					beatFreq: bConfig.hertz ?? 6,
					volume: bConfig.volume ?? 0.5,
				})
			}
		}
	}

	/** Fade-out everything for session finish. */
	function fadeOutAll(fadeDuration: number = 3) {
		audioSession.binaural.stop(fadeDuration)
		audioSession.musicLooper.stop(fadeDuration)
		activeFxStops.value.forEach(stop => stop(fadeDuration))
		activeSoundboardStops.value.forEach(stop => stop(fadeDuration))
	}

	/** Hard-stop everything (cleanup / unmount). */
	function stopAll(fadeDuration: number = 0.5) {
		audioSession.binaural.stop(fadeDuration)
		audioSession.musicLooper.stop(fadeDuration)
		activeFxStops.value.forEach(stop => stop(fadeDuration))
		activeFxStops.value.clear()
		activeSoundboardStops.value.forEach(stop => stop(fadeDuration))
		activeSoundboardStops.value.clear()
	}

	function setMasterVolume(volume: number) {
		audioSession.setMasterVolume(volume)
	}

	// --- Private helpers -------------------------------------------------------

	function getExpectedLoopState(targetIndex: number): Set<string> {
		const activeLoops = new Set<string>()
		for (let i = 0; i <= targetIndex; i++) {
			const scene = sessionScenes.value[i]
			if (scene?.config.audio?.soundboard) {
				for (const evt of scene.config.audio.soundboard) {
					if (!isLoopingSample(evt.id)) continue
					if (evt.event === 'start') activeLoops.add(evt.id)
					else if (evt.event === 'stop') activeLoops.delete(evt.id)
				}
			}
		}
		return activeLoops
	}

	function startSample(id: string) {
		const sample = getSoundboardSample(id)
		if (!sample) return
		playOneShot(
			audioSession,
			sample.path,
			'fx',
			sample.volume ?? 1,
			sample.loop ?? false,
			sample.fadeInDuration ?? 0,
		)
			.then(control => {
				activeSoundboardStops.value.set(id, control.stop)
				control.promise.then(() => {
					if (activeSoundboardStops.value.get(id) === control.stop) {
						activeSoundboardStops.value.delete(id)
					}
				})
			})
			.catch(e => console.warn(`[TheaterAudio] Failed to start ${id}`, e))
	}

	return {
		// Reactive state (read by template)
		activeSoundboardIds,
		soundboardErrors,

		// Methods
		setup,
		applySceneBinaural,
		reconcileSoundboard,
		playSceneFx,
		toggleSoundboardSample,
		switchSession,
		fadeOutAll,
		stopAll,
		setMasterVolume,
	}
}
