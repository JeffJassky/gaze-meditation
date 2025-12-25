import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-backend-webgl'
import { reactive } from 'vue'

export interface Point {
	x: number
	y: number
}

export interface CalibrationData {
	minX: number // Eye looking Left (Iris at outer corner)
	maxX: number // Eye looking Right (Iris at inner corner)
	minY: number // Eye looking Up
	maxY: number // Eye looking Down
}

class FaceMeshService {
	private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null
	private video: HTMLVideoElement | null = null
	private rafId: number | null = null

	public isReady = false
	private debugCanvas: HTMLCanvasElement | null = null

	// Calibration: We track the "Normalized Iris Position" ranges
	// 0 = Center, -1 = Left/Up, 1 = Right/Down (approximately)
	private calibration = reactive<CalibrationData>({
		minX: -0.2,
		maxX: 0.2,
		minY: -0.1,
		maxY: 0.3
	})

	public debugData = reactive({
		headYaw: 0,

		headPitch: 0,
		headX: 0,
		headY: 0,
		headRoll: 0, // Neck tilt (radians)
		faceScale: 0, // Inter-Ocular Distance (approx Z-depth proxy)
		
		browRaise: 0, // 0-1 normalized brow height

		gazeX: 0,

		gazeY: 0,

		blinkDetected: false,
		eyeOpenness: 1.0, // 0 = closed, 1 = open
		eyeOpennessNormalized: 1.0, // 0 = closed (0.15 EAR), 1 = open (0.35 EAR)
		mouthOpenness: 0
	})

	private eyeOpennessMax = 0.35 // Represents fully open for normalization
	private eyeOpennessMin = 0.15 // Represents fully closed for normalization
	private normalizedBlinkThreshold = 0.2 // Normalized threshold for blink detection (0-1 scale)
	private blinkDetectionStartTime: number | null = null
	private blinkSmoothingDuration = 100 // ms, eye must be below threshold for this duration to count as a blink
	private _isStopping = false // Flag to handle race conditions

	async init(videoElement?: HTMLVideoElement) {
		this._isStopping = false // Reset stopping flag

		if (this.isReady) {
			if (!this.rafId) this.startLoop()
			return
		}

		if (videoElement) {
			this.video = videoElement
		} else {
			// Setup hidden video
			const v = document.createElement('video')
			this.video = v // Assign immediately

			// display: none causes issues with some detectors/browsers. Use opacity 0.

			this.video.style.opacity = '0'

			this.video.style.pointerEvents = 'none'

			this.video.style.position = 'fixed'

			this.video.style.top = '0'

			this.video.style.left = '0'

			this.video.style.zIndex = '99999'

			// Explicit dimensions are helpful for TFJS

			this.video.width = 640

			this.video.height = 480

			this.video.style.width = '640px'

			this.video.style.height = '480px'

			this.video.autoplay = true

			this.video.playsInline = true

			document.body.appendChild(this.video)

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { width: 640, height: 480, facingMode: 'user' }
				})

				// Check if stopped while waiting
				if (this._isStopping) {
					console.warn('FaceMesh init aborted: Service was stopped during GUM.')
					stream.getTracks().forEach(t => t.stop())
					if (this.video && this.video.parentNode)
						this.video.parentNode.removeChild(this.video)
					this.video = null
					return
				}

				if (this.video) {
					this.video.srcObject = stream
				} else {
					// Should not happen if _isStopping check passed, but safety first
					stream.getTracks().forEach(t => t.stop())
					return
				}

				// Log real settings

				const track = stream.getVideoTracks()[0]

				if (track) {
					console.log('Camera Settings:', track.getSettings())
				}

				// Wait for video to load

				await new Promise(resolve => {
					if (this.video) {
						this.video.onloadeddata = resolve
					} else {
						resolve(true)
					}
				})
			} catch (e) {
				console.error('Camera Access Error:', e)
				if (this.video && this.video.parentNode) {
					this.video.parentNode.removeChild(this.video)
				}
				this.video = null
				return
			}
		}

		// Check if stopped again
		if (this._isStopping) return

		// Load Model

		const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh

		const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
			runtime: 'tfjs',

			refineLandmarks: false, // Iris not needed for Head Pose

			maxFaces: 1
		}

		this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig)

		if (this._isStopping) {
			// Clean up if stopped during model load
			this.stop() // Re-run stop to clean up
			return
		}

		this.isReady = true

		console.log('FaceMesh Model Loaded (Head Pose Mode)')

		// Ensure video is playing

		if (this.video && this.video.paused) {
			try {
				await this.video.play()

				console.log('Video started playing')
			} catch (e) {
				console.error('Video play failed:', e)
			}
		}

		this.startLoop()
	}

	private startLoop() {
		let frameCount = 0

		const loop = async () => {
			frameCount++

			if (this.detector && this.video) {
				if (this.video.readyState === 4) {
					if (this.video.videoWidth === 0) {
						if (frameCount % 60 === 0) console.warn('Video has 0 width, cannot detect')
					} else {
						try {
							const faces = await this.detector.estimateFaces(this.video)

							if (faces.length > 0) {
								this.processFace(faces[0])

								// if (frameCount % 60 === 0)
								// 	console.log(
								// 		`Face detected (Yaw: ${this.debugData.headYaw.toFixed(3)})`
								// 	)
							} else {
								// if (frameCount % 60 === 0) console.log('No faces detected')
							}
						} catch (e) {
							console.error('Detection Error:', e)
						}
					}
				} else {
					if (frameCount % 60 === 0)
						console.log('Video not ready, state:', this.video.readyState)
				}
			}

			this.rafId = requestAnimationFrame(loop)
		}

		loop()
	}

	private processFace(face: faceLandmarksDetection.Face) {
		const keypoints = face.keypoints

		// Landmarks for Head Pose / Orientation

		// 1: Nose Tip

		// 168: Mid-Eye (Glabella) / or average of eyes

		// 33: Left Eye Outer

		// 263: Right Eye Outer

		const nose = keypoints[1]

		const midEye = keypoints[168]

		const leftOuter = keypoints[33]

		const rightOuter = keypoints[263]

		if (!nose || !midEye || !leftOuter || !rightOuter) return

		// Inter-Ocular Distance (IOD) for Scale Normalization

		const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)

		if (iod === 0) return

		// Calculate Relative Nose Position (Head Gaze Metrics)

		// Yaw: Horizontal offset of nose from center, normalized by face width

		// Inverted (-1) to match screen direction (Looking Left -> Cursor Left)

		const headYaw = (-1 * (nose.x - midEye.x)) / iod

		// Pitch: Vertical offset of nose from center

		// Looking Up -> Nose moves Up (negative Y usually, depending on coord system)

		// Looking Down -> Nose moves Down (positive Y)

		const headPitch = (nose.y - midEye.y) / iod
		
		// Roll: Angle between eyes
		// Right is 263, Left is 33. 
		// Calculate angle of the line connecting them.
		const dY = rightOuter.y - leftOuter.y
		const dX = rightOuter.x - leftOuter.x
		const headRoll = Math.atan2(dY, dX)

		this.debugData.headYaw = headYaw
		this.debugData.headPitch = headPitch
		this.debugData.headRoll = headRoll
		this.debugData.faceScale = iod // Store raw IOD as scale proxy

		// Position (Normalized to Video Dimensions 0-1)
		// 640x480 is hardcoded in init()
		this.debugData.headX = nose.x / 640
		this.debugData.headY = nose.y / 480

		// Map to Screen using Calibration

		const screenX = this.mapToScreen(
			headYaw,
			this.calibration.minX,
			this.calibration.maxX,
			window.innerWidth
		)

		const screenY = this.mapToScreen(
			headPitch,
			this.calibration.minY,
			this.calibration.maxY,
			window.innerHeight
		)

		this.debugData.gazeX = screenX

		this.debugData.gazeY = screenY
		
		// Brow Tension (Distance between brow and eye)
		const leftBrow = keypoints[66]
		const rightBrow = keypoints[296]
		const leftEyeTop = keypoints[159]
		const rightEyeTop = keypoints[386]
		
		if (leftBrow && rightBrow && leftEyeTop && rightEyeTop) {
			const lDist = this.getDistance(leftBrow, leftEyeTop)
			const rDist = this.getDistance(rightBrow, rightEyeTop)
			const avgDist = (lDist + rDist) / 2
			// Normalize by IOD. Typical relaxed range is ~0.2 to 0.3 IOD.
			// Raised is > 0.35, Furrowed/Low is < 0.15
			this.debugData.browRaise = avgDist / iod
		}

		// Calculate Mouth Openness (Use Inner Landmarks for strict gating)
		const upperLipInner = keypoints[13]
		const lowerLipInner = keypoints[14]
		const mouthLeft = keypoints[61]
		const mouthRight = keypoints[291]

		if (upperLipInner && lowerLipInner && mouthLeft && mouthRight) {
			const mouthV = this.getDistance(upperLipInner, lowerLipInner)
			const mouthH = this.getDistance(mouthLeft, mouthRight)
			if (mouthH > 0) {
				this.debugData.mouthOpenness = mouthV / mouthH
			}
		}

		this.updateBlinkStatus(keypoints)
	}

	private updateBlinkStatus(keypoints: faceLandmarksDetection.Keypoint[]) {
		// Left Eye
		const leftV = this.getDistance(keypoints[159], keypoints[145])
		const leftH = this.getDistance(keypoints[33], keypoints[133])
		const leftEAR = leftV / leftH

		// Right Eye
		const rightV = this.getDistance(keypoints[386], keypoints[374])
		const rightH = this.getDistance(keypoints[263], keypoints[362])
		const rightEAR = rightV / rightH

		const avgEAR = (leftEAR + rightEAR) / 2

		this.debugData.eyeOpenness = avgEAR

		// Normalize eye openness to a 0-1 scale
		this.debugData.eyeOpennessNormalized = Math.max(
			0,
			Math.min(
				1,
				(avgEAR - this.eyeOpennessMin) / (this.eyeOpennessMax - this.eyeOpennessMin)
			)
		)

		// DEBUGGING LOGS
		// if (Date.now() % 500 < 50) {
		// 	// Log every ~0.5 seconds
		// 	console.log(
		// 		`EAR: ${avgEAR.toFixed(3)}, ` +
		// 			`NormEAR: ${this.debugData.eyeOpennessNormalized.toFixed(3)}, ` +
		// 			`BlinkDetected: ${this.debugData.blinkDetected}`
		// 	)
		// }
		// END DEBUGGING LOGS

		// Use normalized eye openness for blink detection
		if (this.debugData.eyeOpennessNormalized < this.normalizedBlinkThreshold) {
			if (this.blinkDetectionStartTime === null) {
				this.blinkDetectionStartTime = Date.now()
			} else if (Date.now() - this.blinkDetectionStartTime >= this.blinkSmoothingDuration) {
				this.debugData.blinkDetected = true
			} else {
				this.debugData.blinkDetected = false // Not yet smoothed
			}
		} else {
			this.blinkDetectionStartTime = null
			this.debugData.blinkDetected = false
		}
	}

	public setNormalizedBlinkThreshold(value: number) {
		console.log(
			`Updating Normalized Blink Threshold: ${this.normalizedBlinkThreshold} -> ${value}`
		)
		this.normalizedBlinkThreshold = value
	}

	public setEyeOpennessMin(value: number) {
		console.log(`Updating Eye Openness Min: ${this.eyeOpennessMin} -> ${value}`)
		this.eyeOpennessMin = value
	}

	public setEyeOpennessMax(value: number) {
		console.log(`Updating Eye Openness Max: ${this.eyeOpennessMax} -> ${value}`)
		this.eyeOpennessMax = value
	}

	public getCalibration() {
		return {
			normalizedBlinkThreshold: this.normalizedBlinkThreshold,
			eyeOpennessMin: this.eyeOpennessMin,
			eyeOpennessMax: this.eyeOpennessMax,

			gazeMinX: this.calibration.minX,

			gazeMaxX: this.calibration.maxX,

			gazeMinY: this.calibration.minY,

			gazeMaxY: this.calibration.maxY
		}
	}

	public loadCalibration(data: any) {
		if (data.normalizedBlinkThreshold)
			this.normalizedBlinkThreshold = data.normalizedBlinkThreshold
		if (data.eyeOpennessMin) this.eyeOpennessMin = data.eyeOpennessMin
		if (data.eyeOpennessMax) this.eyeOpennessMax = data.eyeOpennessMax
		if (data.gazeMinX) this.calibration.minX = data.gazeMinX
		if (data.gazeMaxX) this.calibration.maxX = data.gazeMaxX
		if (data.gazeMinY) this.calibration.minY = data.gazeMinY
		if (data.gazeMaxY) this.calibration.maxY = data.gazeMaxY

		console.log('Loaded Calibration:', data)
	}

	private getDistance(p1: faceLandmarksDetection.Keypoint, p2: faceLandmarksDetection.Keypoint) {
		return Math.hypot(p1.x - p2.x, p1.y - p2.y)
	}

	private mapToScreen(val: number, min: number, max: number, range: number): number {
		// Normalize to 0-1 based on calibration range

		const norm = (val - min) / (max - min)

		// Clamp to screen bounds

		return Math.max(0, Math.min(range, norm * range))
	}

	private trainingPoints: Array<{
		rawX: number
		rawY: number
		screenX: number
		screenY: number
	}> = []

	public train(screenX: number, screenY: number) {
		// Guard against training on uninitialized data

		if (this.debugData.headYaw === 0 && this.debugData.headPitch === 0) {
			console.warn('Skipping training: Head pose data is 0 (uninitialized)')

			return
		}

		console.log('Training sample:', this.debugData.headYaw, screenX)

		// Store current raw data with target

		this.trainingPoints.push({
			rawX: this.debugData.headYaw,

			rawY: this.debugData.headPitch,

			screenX,

			screenY
		})

		this.recalibrate()
	}

	public clearCalibration() {
		this.trainingPoints = []

		// Reset to safe defaults for Head Pose

		// Yaw: -0.5 (Left) to 0.5 (Right) roughly

		// Pitch: -0.2 (Up) to 0.4 (Down) roughly (Shifted)

		this.calibration.minX = -0.5
		this.calibration.maxX = 0.5

		this.calibration.minY = -0.2
		this.calibration.maxY = 0.4
	}

	private recalibrate() {
		if (this.trainingPoints.length < 2) return

		// Simple Min/Max based on Screen X/Y

		const leftSamples = this.trainingPoints.filter(p => p.screenX < window.innerWidth / 3)

		const rightSamples = this.trainingPoints.filter(
			p => p.screenX > (window.innerWidth * 2) / 3
		)

		console.log(
			`Recalibrating: ${leftSamples.length} Left Samples, ${rightSamples.length} Right Samples`
		)

		if (leftSamples.length > 0 && rightSamples.length > 0) {
			let avgLeftX = leftSamples.reduce((sum, p) => sum + p.rawX, 0) / leftSamples.length

			let avgRightX = rightSamples.reduce((sum, p) => sum + p.rawX, 0) / rightSamples.length

			// Safety: Ensure minimum delta to prevent sensitivity explosion

			const minDelta = 0.1 // Minimum expected yaw difference

			if (avgRightX - avgLeftX < minDelta) {
				console.warn('Calibration range too small, widening...')

				const center = (avgRightX + avgLeftX) / 2

				avgLeftX = center - minDelta / 2

				avgRightX = center + minDelta / 2
			}

			this.calibration.minX = avgLeftX

			this.calibration.maxX = avgRightX
		}

		// Pitch Calibration: Explicit Top/Bottom Logic
		const topSamples = this.trainingPoints.filter(p => p.screenY < window.innerHeight / 3)
		const bottomSamples = this.trainingPoints.filter(
			p => p.screenY > (window.innerHeight * 2) / 3
		)

		if (topSamples.length > 0 && bottomSamples.length > 0) {
			let avgTopY = topSamples.reduce((sum, p) => sum + p.rawY, 0) / topSamples.length
			let avgBottomY =
				bottomSamples.reduce((sum, p) => sum + p.rawY, 0) / bottomSamples.length

			const minDeltaY = 0.05 // Pitch range is smaller than Yaw usually
			if (avgBottomY - avgTopY < minDeltaY) {
				console.warn('Pitch calibration range too small, widening...')
				const center = (avgBottomY + avgTopY) / 2
				avgTopY = center - minDeltaY / 2
				avgBottomY = center + minDeltaY / 2
			}

			this.calibration.minY = avgTopY
			this.calibration.maxY = avgBottomY
		} else {
			// Fallback: Use variance or default centering if strict top/bottom samples missing
			const rawYs = this.trainingPoints.map(p => p.rawY)
			if (rawYs.length > 0) {
				const minRawY = Math.min(...rawYs)
				const maxRawY = Math.max(...rawYs)

				if (maxRawY - minRawY > 0.05) {
					this.calibration.minY = minRawY
					this.calibration.maxY = maxRawY
				} else {
					const avgY = rawYs.reduce((a, b) => a + b, 0) / rawYs.length
					this.calibration.minY = avgY - 0.15
					this.calibration.maxY = avgY + 0.15
				}
			}
		}

		console.log('Recalibrated Head Pose:', this.calibration)
	}
	public getCurrentGaze(): Point | null {
		// Return null if not ready or no face

		if (!this.detector || (this.debugData.headYaw === 0 && this.debugData.headPitch === 0))
			return null

		return { x: this.debugData.gazeX, y: this.debugData.gazeY }
	}

	public getDebugCanvas(): HTMLCanvasElement | null {
		return this.debugCanvas
	}

	public stop() {
		this._isStopping = true
		if (this.rafId) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}

		if (this.video && this.video.srcObject) {
			const stream = this.video.srcObject as MediaStream
			stream.getTracks().forEach(track => track.stop())
			this.video.srcObject = null
		}

		if (this.video && this.video.parentNode) {
			this.video.parentNode.removeChild(this.video)
		}

		this.video = null
		this.detector = null // Force reload of model next time to be safe/clean
		this.isReady = false

		console.log('FaceMesh Service stopped and resources released.')
	}
}

export const faceMeshService = new FaceMeshService()
