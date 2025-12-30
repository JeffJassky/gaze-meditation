import { Camera } from './devices/camera/camera'
import { Microphone } from './devices/microphone/microphone'
import { BreathRegion } from './devices/camera/regions/breath'
import { EyesRegion } from './devices/camera/regions/eyes'
import { HeadRegion } from './devices/camera/regions/head'
import { MouthRegion } from './devices/camera/regions/mouth'

// Singleton Instances
export const camera = new Camera()
export const microphone = new Microphone()

// Register Regions
export const breathRegion = new BreathRegion(camera)
export const eyesRegion = new EyesRegion(camera)
export const headRegion = new HeadRegion(camera)
export const mouthRegion = new MouthRegion(camera)

camera.registerRegion(breathRegion)
camera.registerRegion(eyesRegion)
camera.registerRegion(headRegion)
camera.registerRegion(mouthRegion)
