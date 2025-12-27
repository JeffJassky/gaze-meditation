import { CameraRegion } from '../region'
import type { Face, Keypoint } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'

export class MouthRegion extends CameraRegion {
	public openness = 0
	public isOpen = false

	// Experimental Tongue Tracking
	public chinDist = 0
	public baselineChinDist = 0
	public tongueMetric = 0 // Ratio chinDist / baselineChinDist

	// Adaptive Baseline
	private baselineOpenness = 0
	private isInitialized = false
	private lastTongueTime = 0

	// Thresholds & Constants
	private readonly OPEN_THRESHOLD = 0.03 // Delta from baseline to consider "open"
	private readonly ADAPTATION_RATE = 0.05
	private readonly ADAPTATION_WINDOW = 0.01 // Noise window

	constructor(camera: Camera) {
		super(camera, 'mouth', 'Mouth')
	}

	update(face: Face, timestamp: number) {
		const k = face.keypoints
		const upper = k[13]
		const lower = k[14]
		const left = k[61]
		const right = k[291]
		const chin = k[152] // Chin tip

		if (!upper || !lower || !left || !right) return

		const v = this.dist3D(upper, lower)
		const h = this.dist3D(left, right)

		if (h > 0) {
			this.openness = v / h
		}

		// --- Tongue / Chin Metric ---
		if (chin && lower) {
			this.chinDist = this.dist3D(lower, chin)
		}

		// Initialization
		if (!this.isInitialized) {
			if (this.openness > 0) {
				this.baselineOpenness = this.openness
				if (this.chinDist > 0) this.baselineChinDist = this.chinDist
				this.isInitialized = true
			}
			return
		}

		// Adaptive Logic
		const diff = this.openness - this.baselineOpenness
		const newState = diff > this.OPEN_THRESHOLD

		// Baseline Adaptation (when closed/resting)
		if (!newState) {
			// Adapt mouth openness baseline
			if (diff < 0) {
				this.baselineOpenness = this.lerp(
					this.baselineOpenness,
					this.openness,
					this.ADAPTATION_RATE
				)
			} else if (diff < this.ADAPTATION_WINDOW) {
				this.baselineOpenness = this.lerp(
					this.baselineOpenness,
					this.openness,
					this.ADAPTATION_RATE
				)
			}

			// Adapt Chin Distance Baseline (Assume closed mouth = standard chin distance)
			if (this.chinDist > 0) {
				this.baselineChinDist = this.lerp(this.baselineChinDist, this.chinDist, 0.05)
			}
		}

		// Calculate Tongue Metric
		// If chinDist decreases relative to baseline, this ratio goes < 1.0
		this.tongueMetric = this.baselineChinDist > 0 ? this.chinDist / this.baselineChinDist : 1.0

		// Tongue Event Detection
		if (newState && this.tongueMetric < 0.8) {
			const now = Date.now()
			if (now - this.lastTongueTime > 300) {
				this.dispatchEvent(
					new CustomEvent('tongue', {
						detail: { type: 'OUT', metric: this.tongueMetric }
					})
				)
				this.lastTongueTime = now
			}
		}

		// State Change Events
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
					// Tongue Data
					chinDist: this.chinDist,
					baselineChinDist: this.baselineChinDist,
					tongueMetric: this.tongueMetric,
					face: face
				}
			})
		)
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	private dist3D(p1: Keypoint, p2: Keypoint) {
		const dx = p1.x - p2.x
		const dy = p1.y - p2.y
		const dz = (p1.z || 0) - (p2.z || 0)
		return Math.hypot(dx, dy, dz)
	}
}
