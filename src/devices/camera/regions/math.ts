/**
 * Shared math utilities for camera region signal processing.
 */
import type { Keypoint } from '@tensorflow-models/face-landmarks-detection'

/** Linear interpolation between two values. */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

/** 2D Euclidean distance between two face keypoints. */
export function dist(p1: Keypoint, p2: Keypoint): number {
	if (!p1 || !p2) return 0
	return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

/** 3D Euclidean distance between two face keypoints (uses z when available). */
export function dist3D(p1: Keypoint, p2: Keypoint): number {
	if (!p1 || !p2) return 0
	return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0))
}

/** Map a value from [min, max] to [0, range], clamped. */
export function mapRange(val: number, min: number, max: number, range: number): number {
	const norm = (val - min) / (max - min)
	return Math.max(0, Math.min(range, norm * range))
}
