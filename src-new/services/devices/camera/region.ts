import { Camera } from './camera'
import type { Face } from '@tensorflow-models/face-landmarks-detection'

// Represents a region of the camera device
// This internally tracks the state of that particular region
// and emits the relevant events

export abstract class CameraRegion extends EventTarget {
	id: string // IE: face, mouth, eyes, head, etc
	name: string
	protected camera: Camera

	constructor(camera: Camera, regionId: string, regionName: string) {
		super()
		this.camera = camera
		this.id = regionId
		this.name = regionName
	}

	// Called by the Camera device when a new face frame is processed
	abstract update(face: Face, timestamp: number): void
}