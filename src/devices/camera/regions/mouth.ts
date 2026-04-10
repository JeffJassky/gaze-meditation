import { CameraRegion } from '../region'
import type { Face } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'
import { lerp, dist3D } from './math'
import {
	MOUTH_OPEN_THRESHOLD,
	MOUTH_ADAPTATION_RATE,
	MOUTH_ADAPTATION_WINDOW,
	MOUTH_CHIN_BASELINE_ALPHA,
	MOUTH_TONGUE_METRIC_THRESHOLD,
	MOUTH_TONGUE_DEBOUNCE_MS,
} from './constants'

export class MouthRegion extends CameraRegion {
	public openness = 0
	public isOpen = false

	// Tongue tracking
	public chinDist = 0
	public baselineChinDist = 0
	public tongueMetric = 0

	// Adaptive baseline
	private baselineOpenness = 0
	private isInitialized = false
	private lastTongueTime = 0

	constructor(camera: Camera) {
		super(camera, 'mouth', 'Mouth')
	}

	update(face: Face) {
		const k = face.keypoints
		const upper = k[13]
		const lower = k[14]
		const left = k[61]
		const right = k[291]
		const chin = k[152]

		if (!upper || !lower || !left || !right) return

		const v = dist3D(upper, lower)
		const h = dist3D(left, right)
		if (h > 0) this.openness = v / h

		// Chin metric for tongue detection
		if (chin && lower) this.chinDist = dist3D(lower, chin)

		// Initialisation
		if (!this.isInitialized) {
			if (this.openness > 0) {
				this.baselineOpenness = this.openness
				if (this.chinDist > 0) this.baselineChinDist = this.chinDist
				this.isInitialized = true
			}
			return
		}

		// --- Adaptive baseline -------------------------------------------------

		const diff = this.openness - this.baselineOpenness
		const newState = diff > MOUTH_OPEN_THRESHOLD

		if (!newState) {
			if (diff < MOUTH_ADAPTATION_WINDOW) {
				this.baselineOpenness = lerp(this.baselineOpenness, this.openness, MOUTH_ADAPTATION_RATE)
			}
			if (this.chinDist > 0) {
				this.baselineChinDist = lerp(this.baselineChinDist, this.chinDist, MOUTH_CHIN_BASELINE_ALPHA)
			}
		}

		// --- Tongue metric -----------------------------------------------------

		this.tongueMetric = this.baselineChinDist > 0 ? this.chinDist / this.baselineChinDist : 1.0

		if (newState && this.tongueMetric < MOUTH_TONGUE_METRIC_THRESHOLD) {
			const now = Date.now()
			if (now - this.lastTongueTime > MOUTH_TONGUE_DEBOUNCE_MS) {
				this.dispatchEvent(
					new CustomEvent('tongue', { detail: { type: 'OUT', metric: this.tongueMetric } }),
				)
				this.lastTongueTime = now
			}
		}

		// --- State change events -----------------------------------------------

		if (newState && !this.isOpen) {
			this.isOpen = true
			this.dispatchEvent(new CustomEvent('open'))
		} else if (!newState && this.isOpen) {
			this.isOpen = false
			this.dispatchEvent(new CustomEvent('close'))
		}

		this.dispatchEvent(
			new CustomEvent('update', {
				detail: {
					openness: this.openness,
					isOpen: this.isOpen,
					baseline: this.baselineOpenness,
					chinDist: this.chinDist,
					baselineChinDist: this.baselineChinDist,
					tongueMetric: this.tongueMetric,
					face,
				},
			}),
		)
	}
}
