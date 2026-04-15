import { computed, ref, type ShallowRef } from 'vue'
import { ButtplugClient, ButtplugClientDevice } from 'buttplug'
import type { Session } from '../api/sessions'
import type { Scene } from '@/core/Scene'
import type { HapticPattern, SessionHaptics } from '@shared/types'
import { getHapticPreset } from '@shared/constants/haptics'

// ---------------------------------------------------------------------------
// Types (client-only, not shared)
// ---------------------------------------------------------------------------

export type HapticConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface HapticDeviceInfo {
	name: string
	index: number
	canVibrate: boolean
	canRotate: boolean
	canLinear: boolean
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

const CONNECT_TIMEOUT = 10000

/**
 * All haptic/toy concerns for the Theater.
 *
 * Uses buttplug-wasm to run the Buttplug server embedded in the browser
 * via WebAssembly + Web Bluetooth. No desktop app (Intiface) required.
 *
 * Owns: Buttplug client connection, pattern playback, NLE reconciliation.
 * Does NOT own scene progression or other device lifecycle.
 */
export function useTheaterHaptics(
	_activeSession: ShallowRef<Session | null>,
	sessionScenes: ShallowRef<Scene[]>,
) {
	const connectionStatus = ref<HapticConnectionStatus>('disconnected')
	const connectedDevices = ref<HapticDeviceInfo[]>([])
	const activePatternStops = ref(new Map<string, () => void>())
	const activePatternIds = computed(() =>
		Array.from(activePatternStops.value.keys()),
	)
	const isAvailable = computed(() => connectionStatus.value === 'connected' && connectedDevices.value.length > 0)

	let client: ButtplugClient | null = null
	let sessionHaptics: SessionHaptics | undefined
	let sceneIntensityMultiplier = 1

	// --- Helpers ---------------------------------------------------------------

	/** Resolve a pattern by preset key. Falls back to session patterns for legacy data. */
	function getPattern(id: string): HapticPattern | undefined {
		const preset = getHapticPreset(id)
		if (preset) {
			const { key, category, description, ...pattern } = preset
			return { ...pattern, id: key }
		}
		return sessionHaptics?.patterns?.find(p => p.id === id)
	}

	function isLoopingPattern(id: string): boolean {
		return getPattern(id)?.loop === true
	}

	function deviceInfoFrom(device: ButtplugClientDevice): HapticDeviceInfo {
		return {
			name: device.displayName ?? device.name,
			index: device.index,
			canVibrate: (device.vibrateAttributes?.length ?? 0) > 0,
			canRotate: (device.rotateAttributes?.length ?? 0) > 0,
			canLinear: (device.linearAttributes?.length ?? 0) > 0,
		}
	}

	/** Get array of devices from the client. */
	function getDevices(): ButtplugClientDevice[] {
		if (!client?.connected) return []
		return client.devices
	}

	function getMasterIntensity(): number {
		return sessionHaptics?.masterIntensity ?? 1
	}

	/** Send an intensity value to all connected devices for a given pattern. */
	async function sendToDevices(pattern: HapticPattern, intensity: number) {
		if (!client?.connected) return
		const effectiveIntensity = Math.max(0, Math.min(1, intensity * sceneIntensityMultiplier * getMasterIntensity()))
		if (effectiveIntensity <= 0) return

		const features = pattern.features ?? ['vibrate']

		for (const device of getDevices()) {
			for (const feature of features) {
				try {
					if (feature === 'vibrate' && (device.vibrateAttributes?.length ?? 0) > 0) {
						await device.vibrate(effectiveIntensity)
					} else if (feature === 'rotate' && (device.rotateAttributes?.length ?? 0) > 0) {
						await device.rotate(effectiveIntensity, true)
					} else if (feature === 'linear' && (device.linearAttributes?.length ?? 0) > 0) {
						await device.linear(effectiveIntensity, 500)
					} else if ((device.vibrateAttributes?.length ?? 0) > 0) {
						// Fallback: vibrate for unsupported features
						await device.vibrate(effectiveIntensity)
					}
				} catch (e) {
					console.warn(`[TheaterHaptics] Failed to send to device ${device.name}`, e)
				}
			}
		}
	}

	/** Stop output on all connected devices. */
	async function stopDevices() {
		for (const device of getDevices()) {
			try { await device.stop() } catch { /* ignore */ }
		}
	}

	// --- Pattern playback engine -----------------------------------------------

	/**
	 * Start a haptic pattern. Returns a stop function.
	 *
	 * For static intensity: sends the value once, optionally with rampUp.
	 * For curves: runs a rAF loop interpolating between curve points.
	 * For loops: repeats until stop is called.
	 */
	function startPattern(pattern: HapticPattern): () => void {
		let stopped = false
		let rafId: number | null = null
		let timeoutId: ReturnType<typeof setTimeout> | null = null
		const startTime = performance.now()

		function stop() {
			stopped = true
			if (rafId !== null) cancelAnimationFrame(rafId)
			if (timeoutId !== null) clearTimeout(timeoutId)

			if (pattern.rampDown && pattern.rampDown > 0) {
				const rampStart = performance.now()
				const rampLoop = () => {
					const elapsed = performance.now() - rampStart
					const t = Math.min(1, elapsed / pattern.rampDown!)
					const intensity = pattern.intensity * (1 - t)
					sendToDevices(pattern, intensity)
					if (t < 1) requestAnimationFrame(rampLoop)
					else stopDevices()
				}
				requestAnimationFrame(rampLoop)
			} else {
				stopDevices()
			}
		}

		if (pattern.curve && pattern.curve.length > 0) {
			const curve = pattern.curve
			const duration = pattern.duration ?? curve[curve.length - 1]!.time
			const tick = () => {
				if (stopped) return
				let elapsed = performance.now() - startTime
				if (pattern.loop && duration > 0) elapsed = elapsed % duration

				let intensity = curve[0]!.intensity
				for (let i = 1; i < curve.length; i++) {
					const prev = curve[i - 1]!
					const cur = curve[i]!
					if (elapsed <= cur.time) {
						const segT = (elapsed - prev.time) / (cur.time - prev.time)
						intensity = prev.intensity + (cur.intensity - prev.intensity) * segT
						break
					}
					intensity = cur.intensity
				}

				sendToDevices(pattern, intensity)
				rafId = requestAnimationFrame(tick)
			}

			if (!pattern.loop && duration > 0) {
				timeoutId = setTimeout(stop, duration)
			}
			rafId = requestAnimationFrame(tick)
		} else {
			if (pattern.rampUp && pattern.rampUp > 0) {
				const rampLoop = () => {
					if (stopped) return
					const elapsed = performance.now() - startTime
					const t = Math.min(1, elapsed / pattern.rampUp!)
					sendToDevices(pattern, pattern.intensity * t)
					if (t < 1) rafId = requestAnimationFrame(rampLoop)
				}
				rafId = requestAnimationFrame(rampLoop)
			} else {
				sendToDevices(pattern, pattern.intensity)
			}

			if (!pattern.loop && pattern.duration && pattern.duration > 0) {
				timeoutId = setTimeout(stop, pattern.duration)
			}
		}

		return stop
	}

	// --- Connection lifecycle --------------------------------------------------

	async function connect(): Promise<boolean> {
		if (client?.connected) return true
		connectionStatus.value = 'connecting'

		try {
			client = new ButtplugClient('ncrs-theater')

			client.addListener('deviceadded', (device: ButtplugClientDevice) => {
				connectedDevices.value = [...connectedDevices.value, deviceInfoFrom(device)]
				console.log(`[TheaterHaptics] Device added: ${device.name}`)
			})
			client.addListener('deviceremoved', (device: ButtplugClientDevice) => {
				connectedDevices.value = connectedDevices.value.filter(d => d.index !== device.index)
				console.log(`[TheaterHaptics] Device removed: ${device.name}`)
			})
			client.addListener('disconnect', () => {
				connectionStatus.value = 'disconnected'
				connectedDevices.value = []
				console.log('[TheaterHaptics] Disconnected')
			})

			// Dynamic import of the WASM connector — only loaded when needed
			const { ButtplugWasmClientConnector } = await import('buttplug-wasm/dist/buttplug-wasm.mjs')
			const connector = new ButtplugWasmClientConnector() as any

			await Promise.race([
				client.connect(connector),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT),
				),
			])

			connectionStatus.value = 'connected'
			console.log('[TheaterHaptics] Connected via Web Bluetooth (WASM embedded server)')

			// Start scanning — this triggers the browser's Web Bluetooth device picker
			// Must be called within a user gesture context (handled by permission gate)
			await client.startScanning()

			return true
		} catch (e) {
			console.warn('[TheaterHaptics] Failed to connect:', e)
			connectionStatus.value = 'error'
			client = null
			return false
		}
	}

	function disconnect() {
		stopAll()
		if (client?.connected) {
			client.disconnect()
		}
		client = null
		connectionStatus.value = 'disconnected'
		connectedDevices.value = []
	}

	// --- Public API (mirroring useTheaterAudio pattern) -------------------------

	function setup(session: Session) {
		sessionHaptics = session.haptics
		sceneIntensityMultiplier = 1
	}

	function switchSession(session: Session) {
		stopAllPatterns()
		sessionHaptics = session.haptics
		sceneIntensityMultiplier = 1
	}

	function applySceneOverride(scene: Scene) {
		const override = scene?.config?.haptics?.intensityOverride
		sceneIntensityMultiplier = override ?? 1

		if (!isAvailable.value) return
		for (const [id] of activePatternStops.value) {
			const pattern = getPattern(id)
			if (pattern && !pattern.curve) {
				sendToDevices(pattern, pattern.intensity)
			}
		}
	}

	function reconcileHaptics(
		targetIndex: number,
		currentScene: Scene | undefined,
		_isSequential: boolean,
	) {
		const expectedLoops = getExpectedLoopState(targetIndex)
		const currentActiveIDs = Array.from(activePatternStops.value.keys())

		for (const id of currentActiveIDs) {
			if (isLoopingPattern(id) && !expectedLoops.has(id)) {
				const stop = activePatternStops.value.get(id)
				stop?.()
				activePatternStops.value.delete(id)
			}
		}

		for (const id of expectedLoops) {
			if (!activePatternStops.value.has(id) && isAvailable.value) {
				const pattern = getPattern(id)
				if (pattern) {
					const stop = startPattern(pattern)
					activePatternStops.value.set(id, stop)
				}
			}
		}

		if (currentScene?.config?.haptics?.events && isAvailable.value) {
			for (const evt of currentScene.config.haptics.events) {
				if (isLoopingPattern(evt.id)) continue
				if (evt.event === 'start') {
					const pattern = getPattern(evt.id)
					if (pattern) {
						const stop = startPattern(pattern)
						activePatternStops.value.set(evt.id, stop)
					}
				} else if (evt.event === 'stop') {
					const stop = activePatternStops.value.get(evt.id)
					stop?.()
					activePatternStops.value.delete(evt.id)
				}
			}
		}
	}

	function fireBehaviorResponse(success: boolean) {
		if (!isAvailable.value || !sessionHaptics) return

		const response = success
			? sessionHaptics.onBehaviorSuccess
			: sessionHaptics.onBehaviorFail
		if (!response) return

		const basePattern = getPattern(response.patternId)
		if (!basePattern) return

		const pattern: HapticPattern = {
			...basePattern,
			loop: false,
			intensity: response.intensity ?? basePattern.intensity,
			duration: response.duration ?? basePattern.duration ?? 500,
		}

		const stop = startPattern(pattern)
		setTimeout(() => stop(), pattern.duration!)
	}

	function fadeOutAll(fadeDurationSec: number = 3) {
		for (const [, stop] of activePatternStops.value) stop()
		activePatternStops.value.clear()

		if (!isAvailable.value) return
		const startTime = performance.now()
		const fadeDurationMs = fadeDurationSec * 1000
		const fade = () => {
			const elapsed = performance.now() - startTime
			const t = Math.min(1, elapsed / fadeDurationMs)
			const intensity = 1 - t
			for (const device of getDevices()) {
				try {
					if ((device.vibrateAttributes?.length ?? 0) > 0) {
						device.vibrate(intensity * getMasterIntensity() * sceneIntensityMultiplier)
					}
				} catch { /* ignore */ }
			}
			if (t < 1) requestAnimationFrame(fade)
			else stopDevices()
		}
		requestAnimationFrame(fade)
	}

	function stopAllPatterns() {
		for (const [, stop] of activePatternStops.value) stop()
		activePatternStops.value.clear()
	}

	function stopAll() {
		stopAllPatterns()
		stopDevices()
	}

	// --- Private helpers -------------------------------------------------------

	function getExpectedLoopState(targetIndex: number): Set<string> {
		const activeLoops = new Set<string>()
		for (let i = 0; i <= targetIndex; i++) {
			const scene = sessionScenes.value[i]
			if (scene?.config?.haptics?.events) {
				for (const evt of scene.config.haptics.events) {
					if (!isLoopingPattern(evt.id)) continue
					if (evt.event === 'start') activeLoops.add(evt.id)
					else if (evt.event === 'stop') activeLoops.delete(evt.id)
				}
			}
		}
		return activeLoops
	}

	return {
		connectionStatus,
		connectedDevices,
		activePatternIds,
		isAvailable,

		connect,
		disconnect,

		setup,
		switchSession,

		applySceneOverride,
		reconcileHaptics,

		fireBehaviorResponse,

		fadeOutAll,
		stopAll,
	}
}
