export abstract class Device extends EventTarget {
	id: string // IE camera, microphone, etc
	name: string // human readable version IE: Camera, Microphone

	constructor(id: string, name: string) {
		super()
		this.id = id
		this.name = name
	}

	// Determines if there are even devices available on this machine
	abstract isAvailable(): Promise<boolean>

	// Checks if access to the device is granted
	abstract isAccessGranted(): Promise<boolean>

	// Requests access to the device
	abstract requestAccess(): Promise<boolean>

	// Starts the device
	abstract start(): Promise<void>

	// Stops the device
	abstract stop(): Promise<void>
}