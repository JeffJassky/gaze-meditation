import { CameraRegion } from '../region'
import type { Face, Keypoint } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'

export class EyesRegion extends CameraRegion {
	public ear = 0
	public openNormalized = 1
	public blinkDetected = false
	public gazeX = 0
	public gazeY = 0
	public isOpen = true // Default to open

	// Calibration & Adaptation
	private minOpen = 0.15
	private maxOpen = 0.35
	private blinkThreshold = 0.2

	// Adaptive Openness Logic
	private baselineOpenness = 0.3 // approximate starting avg
	private isInitialized = false
	private readonly CLOSE_THRESHOLD = -0.04 // Deviation from baseline
	private readonly OPEN_THRESHOLD = -0.035 // Deviation to return to open

	// Blink State
	private blinkStart: number | null = null
	private blinkDuration = 100 // ms

	private lastEar = 0
	private lastDroopTime = 0
	private smoothedDEar = 0

	// Gaze Calibration (Screen mapping)
	private gazeMinX = -0.2
	private gazeMaxX = 0.2
	private gazeMinY = -0.1
	private gazeMaxY = 0.3

	constructor(camera: Camera) {
		super(camera, 'eyes', 'Eyes')
	}

	private frameCount = 0

	update(face: Face, timestamp: number) {
		this.frameCount++
		if (this.frameCount % 100 === 0) {
			console.log('[EyesRegion] Heartbeat', {
				ear: this.ear.toFixed(3),
				norm: this.openNormalized.toFixed(3),
				isOpen: this.isOpen
			})
		}
		const k = face.keypoints
		// Left Eye
		const lV = this.dist(k[159]!, k[145]!)
		const lH = this.dist(k[33]!, k[133]!)
		const lEAR = lH > 0 ? lV / lH : 0

		// Right Eye
		const rV = this.dist(k[386]!, k[374]!)
		const rH = this.dist(k[263]!, k[362]!)
		const rEAR = rH > 0 ? rV / rH : 0

		const rawEar = (lEAR + rEAR) / 2

		// Pitch Compensation
		// When head tilts up/down, 2D EAR reduces due to foreshortening.
		// We scale it back up based on the cosine of the pitch angle.
		const pitch = this.getPitch(face)
		// Clamp pitch to avoid extreme compensation (e.g. > 60 degrees)
		const clampedPitch = Math.max(-1.0, Math.min(1.0, pitch))
		// Amplified compensation: secant squared (1 / cos^2)
		// This provides a much steeper correction curve for extreme tilts.
		const compensation = 1 / Math.pow(Math.cos(clampedPitch), 2)

		this.ear = rawEar * compensation

		// Normalize
		this.openNormalized = Math.max(
			0,
			Math.min(1, (this.ear - this.minOpen) / (this.maxOpen - this.minOpen))
		)

		// 1. Blink Detection (Fast, normalized check)
		if (this.openNormalized < this.blinkThreshold) {
			if (this.blinkStart === null) {
				this.blinkStart = timestamp
			} else if (timestamp - this.blinkStart >= this.blinkDuration) {
				if (!this.blinkDetected) {
					this.blinkDetected = true
					this.dispatchEvent(
						new CustomEvent('blink', { detail: { start: this.blinkStart } })
					)
				}
			}
		} else {
			this.blinkStart = null
			this.blinkDetected = false
		}

		// 2. Open/Close State (Adaptive)
		if (!this.isInitialized) {
			if (this.ear > 0.15) {
				// Sanity check for "eyes exist and aren't fully closed"
				this.baselineOpenness = this.ear
				this.lastEar = this.ear
				this.isInitialized = true
			}
		} else {
			const deviation = this.ear - this.baselineOpenness
			const FORCE_OPEN_THRESHOLD = 0.3 // Normalized value that is definitely "Open"

			// Determine State
			if (this.isOpen) {
				if (
					this.openNormalized < FORCE_OPEN_THRESHOLD &&
					deviation < this.CLOSE_THRESHOLD
				) {
					// console.log('[EyesRegion] Closing eyes detected', { ear: this.ear, norm: this.openNormalized, dev: deviation })
					this.isOpen = false
					this.dispatchEvent(new CustomEvent('close'))
				}
			} else {
				if (this.openNormalized > FORCE_OPEN_THRESHOLD || deviation > this.OPEN_THRESHOLD) {
					// console.log('[EyesRegion] Opening eyes detected', { ear: this.ear, norm: this.openNormalized, dev: deviation })
					this.isOpen = true
					this.dispatchEvent(new CustomEvent('open'))
				}
			}

			// --- Delta-Based Droop Detection (with Dead Zone) ---
			// We smooth the delta to filter out tracker noise
			const dEar = this.ear - this.lastEar
			this.smoothedDEar = this.lerp(this.smoothedDEar, dEar, 0.2)

			if (this.isOpen && !this.blinkDetected && this.smoothedDEar < -0.003) {
				const now = Date.now()
				if (now - this.lastDroopTime > 300) {
					// Debounce
					this.dispatchEvent(
						new CustomEvent('droop', { detail: { delta: this.smoothedDEar } })
					)
					this.lastDroopTime = now
				}
			}

			// Adapt Baseline (Drift towards "Open")
			// Use Case 1: Rapid Widening
			if (this.ear > this.baselineOpenness) {
				this.baselineOpenness = this.lerp(this.baselineOpenness, this.ear, 0.1)
			}
			// Use Case 2: Stable "Open" State (or Recovery from Wide)
			else if (this.isOpen) {
				this.baselineOpenness = this.lerp(this.baselineOpenness, this.ear, 0.005)
			}
		}

		// Gaze Calculation
		const nose = k[1]
		const midEye = k[168]
		const leftOuter = k[33]
		const rightOuter = k[263]
		if (nose && midEye && leftOuter && rightOuter) {
			const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
			if (iod > 0) {
				const yaw = (-1 * (nose.x - midEye.x)) / iod
				const pitch = (nose.y - midEye.y) / iod

				this.gazeX = this.map(yaw, this.gazeMinX, this.gazeMaxX, window.innerWidth)
				this.gazeY = this.map(pitch, this.gazeMinY, this.gazeMaxY, window.innerHeight)
			}
		}

		this.dispatchEvent(
			new CustomEvent('update', {
				detail: {
					ear: this.ear,
					open: this.openNormalized,
					blink: this.blinkDetected,
					isOpen: this.isOpen,
					gaze: { x: this.gazeX, y: this.gazeY },
					face: face
				}
			})
		)

		this.lastEar = this.ear
	}

	// Calibration Methods
	public setCalibration(min: number, max: number) {
		this.minOpen = min
		this.maxOpen = max
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	private dist(p1: Keypoint, p2: Keypoint) {
		if (!p1 || !p2) return 0
		return Math.hypot(p1.x - p2.x, p1.y - p2.y)
	}

	private map(val: number, min: number, max: number, range: number) {
		const norm = (val - min) / (max - min)
		return Math.max(0, Math.min(range, norm * range))
	}

	private getPitch(face: Face): number {
		const top = face.keypoints[10]
		const chin = face.keypoints[152]
		if (!top || !chin) return 0

		const dy = chin.y - top.y
		const dz = (chin.z || 0) - (top.z || 0)
		return Math.atan2(dz, dy)
	}
}
