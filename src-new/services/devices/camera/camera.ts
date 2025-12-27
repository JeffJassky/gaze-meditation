import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-backend-webgl'
import { Device } from '../device'
import { CameraRegion } from './region'

export class Camera extends Device {
	private video: HTMLVideoElement | null = null
	private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null
	private rafId: number | null = null
	private regions: CameraRegion[] = []
	private _isStopping = false

	// Raw data for regions to access if needed (though they get it in update)
	public videoWidth = 640
	public videoHeight = 480

	constructor() {
		super('camera', 'Camera')
	}

	public registerRegion(region: CameraRegion) {
		this.regions.push(region)
	}

	async isAvailable(): Promise<boolean> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices()
			return devices.some(d => d.kind === 'videoinput')
		} catch (e) {
			return false
		}
	}

	async isAccessGranted(): Promise<boolean> {
		// No direct way to check without requesting, but we can assume false if unsure
		// or try to enumerate labels (if labels are present, permission is granted)
		try {
			const devices = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = devices.filter(d => d.kind === 'videoinput')
			return videoDevices.some(d => d.label.length > 0)
		} catch {
			return false
		}
	}

	async requestAccess(): Promise<boolean> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true })
			stream.getTracks().forEach(t => t.stop())
			return true
		} catch {
			return false
		}
	}

	async start(): Promise<void> {
		this._isStopping = false
		if (this.video) return // Already running

		// 1. Setup Video
		this.video = document.createElement('video')
		this.video.style.opacity = '0'
		this.video.style.pointerEvents = 'none'
		this.video.style.position = 'fixed'
		this.video.style.top = '0'
		this.video.style.left = '0'
		this.video.style.zIndex = '99999'
		this.video.width = this.videoWidth
		this.video.height = this.videoHeight
		this.video.autoplay = true
		this.video.playsInline = true
		document.body.appendChild(this.video)

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: this.videoWidth,
					height: this.videoHeight,
					facingMode: 'user'
				}
			})

			if (this._isStopping) {
				stream.getTracks().forEach(t => t.stop())
				this.cleanup()
				return
			}

			this.video.srcObject = stream
			await new Promise(resolve => {
				if (this.video) this.video.onloadeddata = resolve
				else resolve(true)
			})
			await this.video.play()
		} catch (e) {
			console.error('Camera start failed:', e)
			this.cleanup()
			throw e
		}

		// 2. Load Model
		if (!this.detector) {
			const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
			const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
				runtime: 'tfjs',
				refineLandmarks: true, // We need iris for gaze if possible, though user logic used head pose mostly
				maxFaces: 1
			}
			this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig)
		}

		if (this._isStopping) {
			this.cleanup()
			return
		}

		// 3. Start Loop
		this.loop()
		this.dispatchEvent(new Event('start'))
	}

	async stop(): Promise<void> {
		this._isStopping = true
		if (this.rafId) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
		
		if (this.video && this.video.srcObject) {
			const stream = this.video.srcObject as MediaStream
			stream.getTracks().forEach(t => t.stop())
		}
		
		this.cleanup()
		this.dispatchEvent(new Event('stop'))
	}

	private cleanup() {
		if (this.video && this.video.parentNode) {
			this.video.parentNode.removeChild(this.video)
		}
		this.video = null
		// We can keep the detector instance to avoid reloading the model if we restart
		// or null it if we want to save memory. For now, keep it.
	}

	private loop() {
		const frame = async () => {
			if (this._isStopping) return

			if (this.detector && this.video && this.video.readyState === 4) {
				try {
					const faces = await this.detector.estimateFaces(this.video)
					const timestamp = Date.now()
					
					if (faces.length > 0) {
						const face = faces[0]
						// Notify regions
						this.regions.forEach(region => region.update(face, timestamp))
					}
				} catch (e) {
					console.error('Detection error:', e)
				}
			}

			this.rafId = requestAnimationFrame(frame)
		}
		frame()
	}
}
