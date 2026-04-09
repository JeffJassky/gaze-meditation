export interface SessionMetric {
	sceneId: string
	success: boolean
	timestamp: number
	reactionTime: number
}

export interface PhysiologicalSnapshot {
	timestamp: number
	blinkRate: number
	blinkSpeed: number
	breathRate: number
	stillness: number
	headYaw: number
	headPitch: number
	headRoll: number
	browRaise: number
	eyeOpenness: number
	mouthOpenness: number
}

export interface BiometricSummary {
	blinkRate: { start: number; best: number; improvement: number }
	blinkSpeed: { start: number; best: number; improvement: number }
	stillness: { start: number; best: number; improvement: number }
	relaxation: { start: number; best: number; improvement: number }
	eyeDroop: { start: number; best: number; improvement: number }
}

export interface SessionReport {
	durationMs: number
	scenesCompleted: number
	totalScenes: number
	suggestionsCompleted: number
	points: number
	biometrics?: BiometricSummary
}
