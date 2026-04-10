import { apiRequest } from './client'
import { qs } from '@/utils/queryString'
import type { SessionMetric, PhysiologicalSnapshot, BiometricSummary, SessionReport } from '../types'

/**
 * Client for the /history API. A "run" is one playthrough of a session by
 * the signed-in user — mirrors the server's SessionRun model.
 */

export interface SessionRun {
	id: string
	owner: string
	programId: string
	programTitle: string
	startTime: string
	endTime: string | null
	totalScore: number
	scenesCompleted: number
	totalScenes: number
	completeness: number
	durationMs: number
	metrics: SessionMetric[]
	physiologicalData: PhysiologicalSnapshot[]
	biometrics: BiometricSummary | null
	report: SessionReport | null
	createdAt: string
	updatedAt: string
}

export interface SessionRunListResult {
	items: SessionRun[]
	page: number
	limit: number
	total: number
	hasMore: boolean
}

export type CreateSessionRunInput = Partial<Omit<SessionRun, 'id' | 'owner' | 'createdAt' | 'updatedAt'>> & {
	programId: string
}


export const historyApi = {
	list: (params: { limit?: number; page?: number; programId?: string } = {}) =>
		apiRequest<SessionRunListResult>(`/history${qs(params)}`),
	get: (id: string) => apiRequest<SessionRun>(`/history/${id}`),
	create: (body: CreateSessionRunInput) =>
		apiRequest<SessionRun>('/history', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: Partial<CreateSessionRunInput>) =>
		apiRequest<SessionRun>(`/history/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: (id: string) =>
		apiRequest<{ ok: true }>(`/history/${id}`, { method: 'DELETE' }),
}
