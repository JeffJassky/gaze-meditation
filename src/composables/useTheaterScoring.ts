import { ref } from 'vue'
import type { SessionLog, SessionMetric, SessionReport } from '../types'
import { sessionTracker } from '../services/sessionTracker'
import { historyApi } from '../api/history'
import { saveSession } from '../services/storageService'
import { notify } from '@/composables/useNotifications'
import type { Scene } from '@/core/Scene'

/**
 * Scoring, metrics collection, reinforcement logic, and run persistence.
 *
 * Owns: sessionTracker, historyApi, saveSession (localStorage).
 * Does NOT own scene progression or audio — it returns instructions
 * that the caller (Theater) interprets.
 */
export function useTheaterScoring() {
	const score = ref(0)
	const metricsRef = ref<SessionMetric[]>([])
	const sessionReport = ref<SessionReport | undefined>(undefined)
	const startTimeRef = ref(Date.now())

	/** Call when starting a new session or replaying. */
	function resetForSession() {
		score.value = 0
		metricsRef.value = []
		sessionReport.value = undefined
		startTimeRef.value = Date.now()
	}

	/** Call when scene 0 begins. */
	function startTracking() {
		sessionTracker.startSession()
	}

	/**
	 * Handle scene completion. Returns an instruction for the caller:
	 *
	 * - `{ action: 'advance', nextIndex, cooldown }` — move to next scene
	 * - `{ action: 'retry', currentIndex, cooldown }` — replay current scene
	 * - `{ action: 'jump', targetIndex, cooldown }` — jump to a specific scene
	 * - `null` — paused, do nothing
	 */
	function handleReinforcement(
		scene: Scene,
		sceneIndex: number,
		success: boolean,
		metrics: any,
		result: any,
		isPaused: boolean,
		findSceneIndexById: (id: string) => number,
		playbackSpeed: number,
	): {
		action: 'advance' | 'retry' | 'jump'
		targetIndex: number
		cooldown: number
		state: 'REINFORCING_POS' | 'REINFORCING_NEG' | null
	} | null {
		// Record the metric.
		metricsRef.value.push({
			sceneId: scene.id,
			success,
			timestamp: Date.now(),
			reactionTime: metrics?.reactionTime || 0,
		})

		if (isPaused) return null

		const cooldown = scene.cooldown ?? 2000 / playbackSpeed

		// Check for onComplete custom routing.
		if (scene.onComplete) {
			const nextSceneId = scene.onComplete(success, result)
			if (nextSceneId) {
				const jumpToIndex = findSceneIndexById(nextSceneId)
				if (jumpToIndex !== -1) {
					return { action: 'jump', targetIndex: jumpToIndex, cooldown, state: null }
				}
				console.warn(`Scene with ID '${nextSceneId}' not found. Continuing sequentially.`)
			}
		}

		const isPosEnabled = scene.config.behavior?.success?.enabled === true
		const isNegEnabled = scene.config.behavior?.fail?.enabled === true

		if (success) {
			if (isPosEnabled) {
				const duration = scene.duration || 5000
				const reaction = metrics?.reactionTime || 0
				const remainingRatio = Math.max(0, (duration - reaction) / duration)
				score.value += Math.round(100 * remainingRatio)
			}
			return {
				action: 'advance',
				targetIndex: sceneIndex + 1,
				cooldown,
				state: isPosEnabled ? 'REINFORCING_POS' : null,
			}
		} else {
			if (isNegEnabled) {
				score.value -= 50
			}
			return {
				action: 'retry',
				targetIndex: sceneIndex,
				cooldown,
				state: isNegEnabled ? 'REINFORCING_NEG' : null,
			}
		}
	}

	/**
	 * End the session, compute the report, and persist the run.
	 * Returns the report for the caller.
	 */
	function finishSession(
		sessionId: string,
		sessionTitle: string,
		subjectId: string,
		sessionScenes: Scene[],
		totalScenesInProgram: number,
	): SessionReport {
		const { snapshots: physData, summary: biometricSummary } =
			sessionTracker.stopSession()

		const successfulSceneIds = new Set(
			metricsRef.value.filter(m => m.success).map(m => m.sceneId),
		)

		const suggestionsCompleted = sessionScenes.filter(
			s =>
				s.config.behavior?.suggestions &&
				s.config.behavior.suggestions.length > 0 &&
				successfulSceneIds.has(s.id),
		).length

		const report: SessionReport = {
			durationMs: Date.now() - startTimeRef.value,
			scenesCompleted: metricsRef.value.length,
			totalScenes: sessionScenes.length,
			suggestionsCompleted,
			points: score.value,
			biometrics: biometricSummary,
		}
		sessionReport.value = report

		// Persist.
		const log: SessionLog = {
			id: `SES_${Date.now()}`,
			subjectId,
			programId: sessionId,
			startTime: new Date(startTimeRef.value).toISOString(),
			endTime: new Date().toISOString(),
			totalScore: score.value,
			metrics: metricsRef.value,
			physiologicalData: physData,
			biometrics: biometricSummary,
		}

		// Local cache (offline fallback).
		saveSession(log)

		// Remote persistence (fire-and-forget).
		const scenesCompleted = log.metrics.length
		historyApi
			.create({
				programId: log.programId,
				programTitle: sessionTitle,
				startTime: log.startTime,
				endTime: log.endTime,
				totalScore: log.totalScore,
				scenesCompleted,
				totalScenes: totalScenesInProgram,
				completeness: totalScenesInProgram
					? Math.min(100, Math.round((scenesCompleted / totalScenesInProgram) * 100))
					: 0,
				durationMs: log.endTime
					? new Date(log.endTime).getTime() - new Date(log.startTime).getTime()
					: 0,
				metrics: log.metrics,
				physiologicalData: log.physiologicalData,
				biometrics: log.biometrics ?? null,
				report,
			})
			.catch(err => {
				console.warn('[TheaterScoring] failed to persist session run', err)
				notify.error('Session could not be saved to the server. Your data is cached locally.')
			})

		return report
	}

	return {
		// Reactive state
		score,
		metricsRef,
		sessionReport,

		// Methods
		resetForSession,
		startTracking,
		handleReinforcement,
		finishSession,
	}
}
