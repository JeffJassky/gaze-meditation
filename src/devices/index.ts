import { Camera } from './camera/camera'
import { Microphone } from './microphone/microphone'
import { Accelerometer } from './accelerometer/accelerometer'
import { BreathRegion } from './camera/regions/breath'
import { EyesRegion } from './camera/regions/eyes'
import { HeadRegion } from './camera/regions/head'
import { MouthRegion } from './camera/regions/mouth'
import type { DeviceContext } from '@/behaviors/DeviceContext'

// Singleton Instances
export const camera = new Camera()
export const microphone = new Microphone()
export const accelerometer = new Accelerometer()

// Register Regions
export const breathRegion = new BreathRegion(camera)
export const eyesRegion = new EyesRegion(camera)
export const headRegion = new HeadRegion(camera)
export const mouthRegion = new MouthRegion(camera)

camera.registerRegion(breathRegion)
camera.registerRegion(eyesRegion)
camera.registerRegion(headRegion)
camera.registerRegion(mouthRegion)

/** Default DeviceContext backed by the module-level singletons. */
export const defaultDeviceContext: DeviceContext = {
	camera,
	microphone,
	accelerometer,
	headRegion,
	eyesRegion,
	mouthRegion,
}
