import { CameraRegion } from '../region'
import type { Face } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'
import { lerp } from './math'
import {
	HEAD_PITCH_NEUTRAL_OFFSET,
	HEAD_MOVE_THRESHOLD,
	HEAD_CENTER_ALPHA_STABLE,
	HEAD_CENTER_ALPHA_MOVING,
	HEAD_STABILITY_VELOCITY_GAIN,
	HEAD_POSITION_VELOCITY_WEIGHT,
	HEAD_POSITION_DRIFT_WEIGHT,
	HEAD_STABILITY_SMOOTH_ALPHA,
	HEAD_STABLE_THRESHOLD,
	HEAD_UNSTABLE_THRESHOLD,
	HEAD_GESTURE_VELOCITY_SMOOTH,
	HEAD_GESTURE_VELOCITY_THRESHOLD,
	HEAD_GESTURE_DEBOUNCE_MS,
	HEAD_NOD_DOWN_THRESHOLD,
	HEAD_NOD_UP_THRESHOLD,
	HEAD_NOD_RETURN_THRESHOLD,
	HEAD_SHAKE_LEFT_THRESHOLD,
	HEAD_SHAKE_RIGHT_THRESHOLD,
	HEAD_SHAKE_RETURN_THRESHOLD,
} from './constants'

export class HeadRegion extends CameraRegion {
	// Public pose state
	public yaw = 0
	public pitch = 0
	public roll = 0
	public x = 0
	public y = 0
	public scale = 0

	// Gesture state (exposed for visualisers)
	public pitchState: -1 | 0 | 1 = 0
	public yawState: -1 | 0 | 1 = 0
	public isStable = true
	public smoothedStability = 1

	// Adaptive centre
	private centerPitch = 0
	private centerYaw = 0
	private centerX = 0
	private centerY = 0
	private isInitialized = false

	// Previous-frame state (velocity calculation)
	private lastX = 0
	private lastY = 0
	private lastPitch = 0
	private lastYaw = 0

	// Gesture detection state
	private lastGestureTime = 0
	private smoothedDPitch = 0
	private smoothedDYaw = 0

	constructor(camera: Camera) {
		super(camera, 'head', 'Head')
	}

	// ---------------------------------------------------------------------------
	// Frame update — called by Camera on every RAF tick
	// ---------------------------------------------------------------------------

	update(face: Face) {
		const k = face.keypoints
		const nose = k[1]
		const topHead = k[10]
		const chin = k[152]
		const leftSide = k[234]
		const rightSide = k[454]

		if (!nose || !topHead || !chin || !leftSide || !rightSide) return

		// --- Pose calculation (3D geometric) ---------------------------------

		// Pitch: angle of top-head → chin vector in the YZ plane.
		const dy = chin.y - topHead.y
		const dz = (chin.z || 0) - (topHead.z || 0)
		this.pitch = Math.atan2(dz, dy) - HEAD_PITCH_NEUTRAL_OFFSET

		// Yaw: angle of left-side → right-side vector in the XZ plane.
		const dx = rightSide.x - leftSide.x
		const dzYaw = (rightSide.z || 0) - (leftSide.z || 0)
		this.yaw = Math.atan2(dzYaw, dx)

		// Roll: 2D angle of the left-side → right-side line.
		this.roll = Math.atan2(rightSide.y - leftSide.y, rightSide.x - leftSide.x)

		// Scale (inter-ocular distance) and normalised nose position.
		const leftOuter = k[33]
		const rightOuter = k[263]
		if (leftOuter && rightOuter) {
			this.scale = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
		}
		this.x = nose.x / this.camera.videoWidth
		this.y = nose.y / this.camera.videoHeight

		// --- Movement event ---------------------------------------------------

		const moveDist = Math.hypot(this.x - this.lastX, this.y - this.lastY)
		if (moveDist > HEAD_MOVE_THRESHOLD) {
			this.dispatchEvent(
				new CustomEvent('move', { detail: { x: this.x, y: this.y, delta: moveDist } }),
			)
		}

		// --- Pose event -------------------------------------------------------

		this.dispatchEvent(
			new CustomEvent('pose', {
				detail: {
					yaw: this.yaw,
					pitch: this.pitch,
					roll: this.roll,
					x: this.x,
					y: this.y,
					scale: this.scale,
					pitchState: this.pitchState,
					yawState: this.yawState,
					face,
				},
			}),
		)

		// --- Gesture detection ------------------------------------------------

		this.processGestures()

		// Store frame state for next-frame velocity.
		this.lastX = this.x
		this.lastY = this.y
		this.lastPitch = this.pitch
		this.lastYaw = this.yaw
	}

	// ---------------------------------------------------------------------------
	// Gesture detection pipeline
	// ---------------------------------------------------------------------------

	private processGestures() {
		// --- Initialisation (first valid frame) --------------------------------

		if (!this.isInitialized) {
			if (this.pitch !== 0 || this.yaw !== 0) {
				this.centerPitch = this.pitch
				this.centerYaw = this.yaw
				this.centerX = this.x
				this.centerY = this.y
				this.lastPitch = this.pitch
				this.lastYaw = this.yaw
				this.lastX = this.x
				this.lastY = this.y
				this.isInitialized = true
			}
			return
		}

		// --- Adaptive centering ------------------------------------------------

		const alpha = this.isStable ? HEAD_CENTER_ALPHA_STABLE : HEAD_CENTER_ALPHA_MOVING
		this.centerPitch = lerp(this.centerPitch, this.pitch, alpha)
		this.centerYaw = lerp(this.centerYaw, this.yaw, alpha)
		this.centerX = lerp(this.centerX, this.x, alpha)
		this.centerY = lerp(this.centerY, this.y, alpha)

		const relPitch = this.pitch - this.centerPitch
		const relYaw = this.yaw - this.centerYaw
		const relX = this.x - this.centerX
		const relY = this.y - this.centerY

		// --- Stability (velocity + drift) --------------------------------------

		this.updateStability(relYaw, relPitch, relX, relY)

		// --- Velocity-based impulse gestures (turn / tilt) ---------------------

		this.detectImpulseGestures(relPitch)

		// --- Oscillation-based nod / shake patterns ----------------------------

		this.detectNodShake(relPitch, relYaw)
	}

	// ---------------------------------------------------------------------------
	// Stability scoring
	// ---------------------------------------------------------------------------

	private updateStability(relYaw: number, relPitch: number, relX: number, relY: number) {
		// Drift (position relative to centre) — used by StillnessBehavior.
		const drift = Math.hypot(
			relYaw,
			relPitch,
			relX * HEAD_POSITION_DRIFT_WEIGHT,
			relY * HEAD_POSITION_DRIFT_WEIGHT,
		)

		// Velocity (per-frame deltas) — drives the 0–1 stability score.
		const dPitch = this.pitch - this.lastPitch
		const dYaw = this.yaw - this.lastYaw
		const dX = this.x - this.lastX
		const dY = this.y - this.lastY
		let velocity = Math.hypot(
			dPitch,
			dYaw,
			dX * HEAD_POSITION_VELOCITY_WEIGHT,
			dY * HEAD_POSITION_VELOCITY_WEIGHT,
		)
		if (isNaN(velocity)) velocity = 0

		const rawStability = Math.max(0, 1 - velocity * HEAD_STABILITY_VELOCITY_GAIN)
		if (isNaN(this.smoothedStability)) this.smoothedStability = rawStability
		this.smoothedStability = lerp(this.smoothedStability, rawStability, HEAD_STABILITY_SMOOTH_ALPHA)

		// Hysteresis toggle
		if (this.isStable && this.smoothedStability < HEAD_UNSTABLE_THRESHOLD) {
			this.isStable = false
			this.dispatchEvent(new CustomEvent('unstable'))
		} else if (!this.isStable && this.smoothedStability > HEAD_STABLE_THRESHOLD) {
			this.isStable = true
			this.dispatchEvent(new CustomEvent('stable'))
		}

		this.dispatchEvent(
			new CustomEvent('stillness', {
				detail: {
					score: this.smoothedStability,
					velocity,
					drift,
					isStable: this.isStable,
					x: relYaw,
					y: relPitch,
					posX: this.x - this.centerX,
					posY: this.y - this.centerY,
				},
			}),
		)
	}

	// ---------------------------------------------------------------------------
	// Velocity-based impulse gestures (single turn / tilt)
	// ---------------------------------------------------------------------------

	private detectImpulseGestures(relPitch: number) {
		const dPitch = this.pitch - this.lastPitch
		const dYaw = this.yaw - this.lastYaw

		this.smoothedDPitch = lerp(this.smoothedDPitch, dPitch, HEAD_GESTURE_VELOCITY_SMOOTH)
		this.smoothedDYaw = lerp(this.smoothedDYaw, dYaw, HEAD_GESTURE_VELOCITY_SMOOTH)

		const now = Date.now()
		if (now - this.lastGestureTime <= HEAD_GESTURE_DEBOUNCE_MS) return

		// Turn (yaw velocity) — positive dYaw = LEFT for mirrored webcam
		if (this.smoothedDYaw > HEAD_GESTURE_VELOCITY_THRESHOLD) {
			this.dispatchEvent(new CustomEvent('turn', { detail: { direction: 'LEFT' } }))
			this.lastGestureTime = now
		} else if (this.smoothedDYaw < -HEAD_GESTURE_VELOCITY_THRESHOLD) {
			this.dispatchEvent(new CustomEvent('turn', { detail: { direction: 'RIGHT' } }))
			this.lastGestureTime = now
		}

		// Tilt (pitch velocity) — positive dPitch = DOWN
		if (this.smoothedDPitch > HEAD_GESTURE_VELOCITY_THRESHOLD) {
			this.dispatchEvent(new CustomEvent('tilt', { detail: { direction: 'DOWN' } }))
			this.emitNod('YES')
			this.lastGestureTime = now
		} else if (this.smoothedDPitch < -HEAD_GESTURE_VELOCITY_THRESHOLD) {
			this.dispatchEvent(new CustomEvent('tilt', { detail: { direction: 'UP' } }))
			this.lastGestureTime = now
		}
	}

	// ---------------------------------------------------------------------------
	// Oscillation-based nod (pitch) and shake (yaw) detection
	// ---------------------------------------------------------------------------

	private detectNodShake(relPitch: number, relYaw: number) {
		// Pitch state machine (nod = YES)
		if (this.pitchState === 0) {
			if (relPitch < HEAD_NOD_UP_THRESHOLD) this.pitchState = -1
			else if (relPitch > HEAD_NOD_DOWN_THRESHOLD) this.pitchState = 1
		} else if (this.pitchState === 1) {
			if (relPitch < HEAD_NOD_RETURN_THRESHOLD) {
				this.pitchState = 0
				this.emitNod('YES')
			} else if (relPitch < HEAD_NOD_UP_THRESHOLD) {
				this.pitchState = -1
				this.emitNod('YES')
			}
		} else if (this.pitchState === -1) {
			if (relPitch > -HEAD_NOD_RETURN_THRESHOLD) {
				this.pitchState = 0
				this.emitNod('YES')
			} else if (relPitch > HEAD_NOD_DOWN_THRESHOLD) {
				this.pitchState = 1
				this.emitNod('YES')
			}
		}

		// Yaw state machine (shake = NO)
		if (this.yawState === 0) {
			if (relYaw > HEAD_SHAKE_RIGHT_THRESHOLD) this.yawState = 1
			else if (relYaw < HEAD_SHAKE_LEFT_THRESHOLD) this.yawState = -1
		} else if (this.yawState === 1 && relYaw < HEAD_SHAKE_LEFT_THRESHOLD) {
			this.yawState = -1
			this.emitNod('NO')
		} else if (this.yawState === -1 && relYaw > HEAD_SHAKE_RIGHT_THRESHOLD) {
			this.yawState = 1
			this.emitNod('NO')
		} else if (Math.abs(relYaw) < HEAD_SHAKE_RETURN_THRESHOLD) {
			this.yawState = 0
		}
	}

	private emitNod(type: 'YES' | 'NO') {
		this.dispatchEvent(new CustomEvent('nod', { detail: { type } }))
	}
}
