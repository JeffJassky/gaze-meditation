/**
 * Abstraction over the hardware devices and camera regions that behaviors
 * need at runtime.
 *
 * Scene injects a concrete DeviceContext into each Behavior instance before
 * calling `start()`. This decouples behaviors from the module-level
 * singletons in `@/devices`, making them testable and swappable.
 */

/** Minimal interface for a device that can be started (camera, accelerometer). */
export interface StartableDevice extends EventTarget {
	start(): Promise<void>
}

export interface DeviceContext {
	camera: StartableDevice
	microphone: EventTarget
	accelerometer: StartableDevice
	headRegion: EventTarget
	eyesRegion: EventTarget
	mouthRegion: EventTarget
}
