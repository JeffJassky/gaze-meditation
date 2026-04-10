import { CameraRegion } from '../region'
import type { Face, Keypoint } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'
import { lerp, dist, mapRange } from './math'
import {
	EYES_MIN_OPEN,
	EYES_MAX_OPEN,
	EYES_BLINK_THRESHOLD,
	EYES_BLINK_MIN_DURATION_MS,
	EYES_CLOSE_DEVIATION,
	EYES_OPEN_DEVIATION,
	EYES_FORCE_OPEN_THRESHOLD,
	EYES_INIT_EAR_THRESHOLD,
	EYES_BASELINE_FAST_ALPHA,
	EYES_BASELINE_SLOW_ALPHA,
	EYES_DELTA_SMOOTH_ALPHA,
	EYES_DROOP_THRESHOLD,
	EYES_DROOP_DEBOUNCE_MS,
	EYES_GAZE_MIN_X,
	EYES_GAZE_MAX_X,
	EYES_GAZE_MIN_Y,
	EYES_GAZE_MAX_Y,
} from './constants'

export class EyesRegion extends CameraRegion {
	public ear = 0
	public openNormalized = 1
	public blinkDetected = false
	public gazeX = 0
	public gazeY = 0
	public isOpen = true
	public browRaise = 0

	// Calibration
	private minOpen = EYES_MIN_OPEN
	private maxOpen = EYES_MAX_OPEN

	// Adaptive openness
	private baselineOpenness = 0.3
	private isInitialized = false

	// Blink state
	private blinkStart: number | null = null

	// Delta / droop detection
	private lastEar = 0
	private lastDroopTime = 0
	private smoothedDEar = 0

	// Gaze calibration
	private gazeMinX = EYES_GAZE_MIN_X
	private gazeMaxX = EYES_GAZE_MAX_X
	private gazeMinY = EYES_GAZE_MIN_Y
	private gazeMaxY = EYES_GAZE_MAX_Y

	private frameCount = 0

	constructor(camera: Camera) {
		super(camera, 'eyes', 'Eyes')
	}

	update(face: Face, timestamp: number) {
		this.frameCount++
		if (this.frameCount % 100 === 0) {
			console.log('[EyesRegion] Heartbeat', {
				ear: this.ear.toFixed(3),
				norm: this.openNormalized.toFixed(3),
				isOpen: this.isOpen,
			})
		}

		const k = face.keypoints

		// --- Eye aspect ratio (EAR) -------------------------------------------

		const lV = dist(k[159]!, k[145]!)
		const lH = dist(k[33]!, k[133]!)
		const lEAR = lH > 0 ? lV / lH : 0

		const rV = dist(k[386]!, k[374]!)
		const rH = dist(k[263]!, k[362]!)
		const rEAR = rH > 0 ? rV / rH : 0

		const rawEar = (lEAR + rEAR) / 2

		// Pitch compensation — secant² to counteract 2D foreshortening.
		const pitch = this.getPitch(face)
		const clampedPitch = Math.max(-1.0, Math.min(1.0, pitch))
		const compensation = 1 / Math.pow(Math.cos(clampedPitch), 2)
		this.ear = rawEar * compensation

		this.openNormalized = Math.max(
			0,
			Math.min(1, (this.ear - this.minOpen) / (this.maxOpen - this.minOpen)),
		)

		// --- Blink detection ---------------------------------------------------

		if (this.openNormalized < EYES_BLINK_THRESHOLD) {
			if (this.blinkStart === null) {
				this.blinkStart = timestamp
			} else if (timestamp - this.blinkStart >= EYES_BLINK_MIN_DURATION_MS) {
				this.blinkDetected = true
			}
		} else {
			if (this.blinkDetected && this.blinkStart !== null) {
				this.dispatchEvent(
					new CustomEvent('blink', {
						detail: { start: this.blinkStart, duration: timestamp - this.blinkStart },
					}),
				)
			}
			this.blinkStart = null
			this.blinkDetected = false
		}

		// --- Open / close state (adaptive baseline) ----------------------------

		if (!this.isInitialized) {
			if (this.ear > EYES_INIT_EAR_THRESHOLD) {
				this.baselineOpenness = this.ear
				this.lastEar = this.ear
				this.isInitialized = true
			}
		} else {
			const deviation = this.ear - this.baselineOpenness

			if (this.isOpen) {
				if (
					this.openNormalized < EYES_FORCE_OPEN_THRESHOLD &&
					deviation < EYES_CLOSE_DEVIATION
				) {
					this.isOpen = false
					this.dispatchEvent(new CustomEvent('close'))
				}
			} else {
				if (
					this.openNormalized > EYES_FORCE_OPEN_THRESHOLD ||
					deviation > EYES_OPEN_DEVIATION
				) {
					this.isOpen = true
					this.dispatchEvent(new CustomEvent('open'))
				}
			}

			// Delta-based droop detection
			const dEar = this.ear - this.lastEar
			this.smoothedDEar = lerp(this.smoothedDEar, dEar, EYES_DELTA_SMOOTH_ALPHA)

			if (this.isOpen && !this.blinkDetected && this.smoothedDEar < EYES_DROOP_THRESHOLD) {
				const now = Date.now()
				if (now - this.lastDroopTime > EYES_DROOP_DEBOUNCE_MS) {
					this.dispatchEvent(
						new CustomEvent('droop', { detail: { delta: this.smoothedDEar } }),
					)
					this.lastDroopTime = now
				}
			}

			// Adaptive baseline
			if (this.ear > this.baselineOpenness) {
				this.baselineOpenness = lerp(this.baselineOpenness, this.ear, EYES_BASELINE_FAST_ALPHA)
			} else if (this.isOpen) {
				this.baselineOpenness = lerp(this.baselineOpenness, this.ear, EYES_BASELINE_SLOW_ALPHA)
			}
		}

		// --- Brow tension ------------------------------------------------------

		const leftBrow = k[66]
		const rightBrow = k[296]
		const leftEyeTop = k[159]
		const rightEyeTop = k[386]
		const leftOuter = k[33]
		const rightOuter = k[263]

		if (leftBrow && rightBrow && leftEyeTop && rightEyeTop && leftOuter && rightOuter) {
			const iod = dist(leftOuter, rightOuter)
			if (iod > 0) {
				this.browRaise = ((dist(leftBrow, leftEyeTop) + dist(rightBrow, rightEyeTop)) / 2) / iod
			}
		}

		// --- Gaze calculation --------------------------------------------------

		const nose = k[1]
		const midEye = k[168]
		if (nose && midEye && leftOuter && rightOuter) {
			const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
			if (iod > 0) {
				const yaw = (-1 * (nose.x - midEye.x)) / iod
				const gazePitch = (nose.y - midEye.y) / iod
				this.gazeX = mapRange(yaw, this.gazeMinX, this.gazeMaxX, window.innerWidth)
				this.gazeY = mapRange(gazePitch, this.gazeMinY, this.gazeMaxY, window.innerHeight)
			}
		}

		// --- Update event ------------------------------------------------------

		this.dispatchEvent(
			new CustomEvent('update', {
				detail: {
					ear: this.ear,
					open: this.openNormalized,
					blink: this.blinkDetected,
					isOpen: this.isOpen,
					gaze: { x: this.gazeX, y: this.gazeY },
					face,
				},
			}),
		)

		this.lastEar = this.ear
	}

	public setCalibration(min: number, max: number) {
		this.minOpen = min
		this.maxOpen = max
	}

	private getPitch(face: Face): number {
		const top = face.keypoints[10]
		const chin = face.keypoints[152]
		if (!top || !chin) return 0
		return Math.atan2((chin.z || 0) - (top.z || 0), chin.y - top.y)
	}
}
