import { CameraRegion } from '../region'
import type { Face } from '@tensorflow-models/face-landmarks-detection'
import { Camera } from '../camera'

export class HeadRegion extends CameraRegion {
	// Public State
	public yaw = 0
	public pitch = 0
	public roll = 0
	public x = 0
	public y = 0
	public scale = 0 // Inter-Ocular Distance

	// Nod Detection State
	private centerPitch = 0
	private centerYaw = 0
	private centerX = 0
	private centerY = 0
	private isInitialized = false

	public pitchState: -1 | 0 | 1 = 0 // -1: Up, 0: Center, 1: Down
	public yawState: -1 | 0 | 1 = 0 // -1: Left, 0: Center, 1: Right

	public isStable = true
	public smoothedStability = 1

	// Thresholds
	private readonly LEFT_THRESH = -0.009
	private readonly RIGHT_THRESH = 0.009
	private readonly MOVE_THRESH = 0.005 // Normalized distance

	private lastX = 0
	private lastY = 0
	private lastPitch = 0
	private lastYaw = 0
	private lastGestureTime = 0
	private smoothedDPitch = 0
	private smoothedDYaw = 0

	constructor(camera: Camera) {
		super(camera, 'head', 'Head')
	}

	update(face: Face) {
		const keypoints = face.keypoints
		const nose = keypoints[1]
		// 3D Landmarks for geometric calculation
		const topHead = keypoints[10]
		const chin = keypoints[152]
		const leftSide = keypoints[234]
		const rightSide = keypoints[454]

		if (!nose || !topHead || !chin || !leftSide || !rightSide) return

		// 1. Calculate Pose (3D Geometric)

		// Pitch (Rotation around X-axis)
		// We use the vector from TopHead to Chin.
		// In MediaPipe: Z is depth (negative is closer to camera).
		// Tilted Down: TopHead comes closer (Z decr), Chin goes back (Z incr).
		const dy = chin.y - topHead.y
		const dz = (chin.z || 0) - (topHead.z || 0) // Ensure Z exists (it usually does in facemesh)

		// This raw atan2 gives the angle of the face plane relative to vertical.
		// We subtract a calibration offset (approx 0.2 rad) because neutral faces aren't perfectly vertical planes.
		// Note: We invert the result so Tilted Down is Positive (matching previous 2D logic direction).
		// Actually, let's test:
		// Down: Top(Z-) Chin(Z+). dz = + - - = +. dy = +. atan2(+,+) is positive.
		// Up: Top(Z+) Chin(Z-). dz = - - + = -. dy = +. atan2(-,+) is negative.
		// This matches our desired output (Down = Positive).
		this.pitch = Math.atan2(dz, dy) - 0.15 // 0.15 offset for natural neutral head position

		// Yaw (Rotation around Y-axis)
		// Vector from Left to Right.
		// Turn Left: LeftSide goes back (Z+), RightSide comes close (Z-).
		// dx = Right.x - Left.x (Always positive approx)
		// dz = Right.z - Left.z
		// Left Turn: Right(Z-) - Left(Z+) = Negative.
		// Right Turn: Right(Z+) - Left(Z-) = Positive.
		// We want Left = Negative, Right = Positive.
		// So we use atan2(dz, dx).
		const dx = rightSide.x - leftSide.x
		const dzYaw = (rightSide.z || 0) - (leftSide.z || 0)
		// Reverted to standard calculation per calibration check
		this.yaw = Math.atan2(dzYaw, dx)

		// Roll (Rotation around Z-axis)
		// Simply the 2D angle of the eyes or cheekbones
		const dY = rightSide.y - leftSide.y
		const dX = rightSide.x - leftSide.x
		this.roll = Math.atan2(dY, dX)

		// Scale / Position (unchanged)
		const leftOuter = keypoints[33]
		const rightOuter = keypoints[263]
		
		if (leftOuter && rightOuter) {
			const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y)
			this.scale = iod
		}

		this.x = nose.x / this.camera.videoWidth
		this.y = nose.y / this.camera.videoHeight

		// Detect Movement
		const dist = Math.hypot(this.x - this.lastX, this.y - this.lastY)
		if (dist > this.MOVE_THRESH) {
			this.dispatchEvent(
				new CustomEvent('move', { detail: { x: this.x, y: this.y, delta: dist } })
			)
		}

		// Emit Pose Event
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
					face: face // Raw face data
				}
			})
		)

		// 2. Process Nods (Adaptive Logic) & Orientation
		this.processGestures()

		// Update Last Frame State (for velocity calc next frame)
		this.lastX = this.x
		this.lastY = this.y
		this.lastPitch = this.pitch
		this.lastYaw = this.yaw
	}

	private processGestures() {
		// Initialization

		if (!this.isInitialized) {
			if (this.pitch !== 0 || this.yaw !== 0) {
				this.centerPitch = this.pitch

				this.centerYaw = this.yaw

				this.centerX = this.x

				this.centerY = this.y

				this.isInitialized = true

				// Init last values

				this.lastPitch = this.pitch

				this.lastYaw = this.yaw

				this.lastX = this.x

				this.lastY = this.y
			}

			return
		}

				// Adaptive Centering

				// Dynamic Alpha: 

				// If Stable: Adapt FAST (0.05) to re-center on the new comfortable position.

				// If Unstable (Moving): Adapt SLOW (0.001) to "hold" the center so we can measure the deviation magnitude.

				const alpha = this.isStable ? 0.05 : 0.001

				

				this.centerPitch = this.lerp(this.centerPitch, this.pitch, alpha)

				this.centerYaw = this.lerp(this.centerYaw, this.yaw, alpha)

				this.centerX = this.lerp(this.centerX, this.x, alpha)

				this.centerY = this.lerp(this.centerY, this.y, alpha)

		const relPitch = this.pitch - this.centerPitch

		const relYaw = this.yaw - this.centerYaw

		const relX = this.x - this.centerX

		const relY = this.y - this.centerY

		// --- Stillness (Velocity) vs Drift (Position) ---

		// 1. Drift (Position relative to Center)

		// Used for "Keep head in circle" logic

		const drift = Math.hypot(relYaw, relPitch, relX * 1.5, relY * 1.5)

		// 2. Velocity (Instantaneous Movement)

		// Used for "Stability" score

		const dPitch = this.pitch - this.lastPitch

		const dYaw = this.yaw - this.lastYaw

		const dX = this.x - this.lastX

				const dY = this.y - this.lastY

				let velocity = Math.hypot(dPitch, dYaw, dX * 2, dY * 2) 

				

				if (isNaN(velocity)) velocity = 0

		

				// Stability Score (0 to 1)

		// Velocity is per-frame.

		// Reduced sensitivity further: now requires roughly 5x more movement than original.

				const rawStability = Math.max(0, 1 - (velocity * 20))

				

				if (isNaN(this.smoothedStability)) this.smoothedStability = rawStability

				

				// Smooth the stability score to prevent jagged graph

				this.smoothedStability = this.lerp(this.smoothedStability, rawStability, 0.1)

				

				// Stable/Unstable Event Logic with Hysteresis

		// Threshold: > 0.5 is Stable, < 0.4 is Unstable

		if (this.isStable && this.smoothedStability < 0.4) {
			this.isStable = false

			this.dispatchEvent(new CustomEvent('unstable'))
		} else if (!this.isStable && this.smoothedStability > 0.5) {
			this.isStable = true

			this.dispatchEvent(new CustomEvent('stable'))
		}

		this.dispatchEvent(
			new CustomEvent('stillness', {
				detail: {
					score: this.smoothedStability,

					velocity: velocity,

					drift: drift,

					isStable: this.isStable,

					x: relYaw,

					y: relPitch,

					posX: relX,

					posY: relY
				}
			})
		)

						// --- Momentary Gesture Detection (Velocity Based with Dead Zone) ---

						// We smooth the deltas to create a stable "velocity" signal that ignores micro-jitter.

						this.smoothedDPitch = this.lerp(this.smoothedDPitch, dPitch, 0.2)

						this.smoothedDYaw = this.lerp(this.smoothedDYaw, dYaw, 0.2)

				

						// Threshold for deliberate movement (The Dead Zone)

						const GESTURE_VEL_THRESH = 0.004 

						const now = Date.now()

						

						// Debounce logic to prevent rapid re-triggering during a single movement

						if (now - this.lastGestureTime > 300) {

							// Turn (Yaw Velocity)

							// Swapped Axis: Positive dYaw is LEFT (for mirrored webcam)

							if (this.smoothedDYaw > GESTURE_VEL_THRESH) {

								this.dispatchEvent(new CustomEvent('turn', { detail: { direction: 'LEFT' } }))

								this.lastGestureTime = now

							} else if (this.smoothedDYaw < -GESTURE_VEL_THRESH) {

								this.dispatchEvent(new CustomEvent('turn', { detail: { direction: 'RIGHT' } }))

								this.lastGestureTime = now

							}

							

										// Tilt (Pitch Velocity)

							

										// Positive dPitch is DOWN (Drop)

							

										if (this.smoothedDPitch > GESTURE_VEL_THRESH) {

							

											this.dispatchEvent(new CustomEvent('tilt', { detail: { direction: 'DOWN' } }))

							

											this.emitNod('YES') // Nod also triggers on downward impulse

							

											this.lastGestureTime = now

							

										} else if (this.smoothedDPitch < -GESTURE_VEL_THRESH) {

								this.dispatchEvent(new CustomEvent('tilt', { detail: { direction: 'UP' } }))

								this.lastGestureTime = now

							}

						}

		

				// --- Gesture Detection (Nod/Shake - Oscillations) ---

				// Keep existing logic for repetitive Nod/Shake patterns?

				// User asked to change "head 'drop' event" and "turn left/right".

				// I will keep the Nod/Shake logic as it tracks *patterns* (oscillations), 

				// whereas the new Turn/Tilt tracks *impulses*.

				

				// Pitch State (Nod) - This tracks position-based excursions for Nods

				// ... (Keep existing Nod logic for "YES/NO" pattern detection)

				

				const NOD_DOWN_THRESH = 0.010

				const NOD_UP_THRESH = -0.010

		

				if (this.pitchState === 0) {

					if (relPitch < NOD_UP_THRESH) this.pitchState = -1

					else if (relPitch > NOD_DOWN_THRESH) this.pitchState = 1

				} else {

					if (this.pitchState === 1 && relPitch < 0.002) {

						this.pitchState = 0

						this.emitNod('YES')

					} 

					else if (this.pitchState === -1 && relPitch > -0.002) {

						this.pitchState = 0

						this.emitNod('YES') 

					}

					else if (this.pitchState === 1 && relPitch < NOD_UP_THRESH) {

						this.pitchState = -1

						this.emitNod('YES')

					}

					else if (this.pitchState === -1 && relPitch > NOD_DOWN_THRESH) {

						this.pitchState = 1

						this.emitNod('YES')

					}

				}

		

				// Yaw State (Shake)

				if (this.yawState === 0) {

					if (relYaw > this.RIGHT_THRESH) this.yawState = 1

					else if (relYaw < this.LEFT_THRESH) this.yawState = -1

				} else {

					if (this.yawState === 1 && relYaw < this.LEFT_THRESH) {

						this.yawState = -1

						this.emitNod('NO')

					} 

					else if (this.yawState === -1 && relYaw > this.RIGHT_THRESH) {

						this.yawState = 1

						this.emitNod('NO')

					} else if (Math.abs(relYaw) < 0.002) {

						this.yawState = 0

					}

				}
	}
	private emitNod(type: 'YES' | 'NO') {
		this.dispatchEvent(new CustomEvent('nod', { detail: { type } }))
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}
}
