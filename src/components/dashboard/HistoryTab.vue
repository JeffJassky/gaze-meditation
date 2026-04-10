<script setup lang="ts">
import { ref } from 'vue'
import type { SessionLog } from '@/types'
import type { SessionRun } from '@/api/history'
import SessionDetail from './SessionDetail.vue'

export interface HistoryRow {
	id: string
	programId: string
	title: string
	startTime: string
	endTime: string | null
	totalScore: number
	completeness: number
	durationMs: number
	raw: SessionRun | SessionLog
	isRemote: boolean
}

defineProps<{
	rows: HistoryRow[]
	loading: boolean
	error: string | null
}>()

const expandedSessionId = ref<string | null>(null)

function toggleExpand(id: string) {
	expandedSessionId.value = expandedSessionId.value === id ? null : id
}

function formatDuration(ms: number): string {
	if (!ms) return '\u2014'
	const mins = Math.floor(ms / 60000)
	const secs = Math.floor((ms % 60000) / 1000)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

function runAsSessionLog(r: SessionRun): SessionLog {
	return {
		id: r.id,
		subjectId: r.owner,
		programId: r.programId,
		startTime: r.startTime,
		endTime: r.endTime || undefined,
		totalScore: r.totalScore,
		metrics: r.metrics,
		physiologicalData: r.physiologicalData,
		biometrics: r.biometrics || undefined,
	}
}
</script>

<template>
	<div class="max-w-6xl mx-auto">
		<h2 class="text-3xl font-light text-white mb-6 text-center">History</h2>

		<div v-if="error" class="mb-4 text-xs text-red-400/80 text-center">
			{{ error }}
		</div>

		<div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
			<table class="w-full text-left text-sm">
				<thead class="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-medium">
					<tr>
						<th class="px-6 py-4">Session</th>
						<th class="px-6 py-4">Date</th>
						<th class="px-6 py-4 text-right">Duration</th>
						<th class="px-6 py-4 text-right">Completeness</th>
						<th class="px-6 py-4 text-right">Score</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-800">
					<template v-for="row in rows" :key="row.id">
						<tr
							@click="toggleExpand(row.id)"
							class="hover:bg-zinc-800/30 cursor-pointer transition-colors"
							:class="expandedSessionId === row.id ? 'bg-zinc-800/20' : ''">
							<td class="px-6 py-4 text-white font-medium">{{ row.title }}</td>
							<td class="px-6 py-4 text-zinc-400">
								{{ new Date(row.startTime).toLocaleString() }}
							</td>
							<td class="px-6 py-4 text-right font-mono text-zinc-400">
								{{ formatDuration(row.durationMs) }}
							</td>
							<td class="px-6 py-4 text-right text-zinc-400">
								{{ row.completeness }}%
							</td>
							<td class="px-6 py-4 text-right font-mono text-cyan-400">
								{{ row.totalScore }}
							</td>
						</tr>
						<tr v-if="expandedSessionId === row.id" class="bg-zinc-900/50">
							<td colspan="5" class="p-4">
								<SessionDetail
									:session="
										row.isRemote
											? runAsSessionLog(row.raw as SessionRun)
											: (row.raw as SessionLog)
									" />
							</td>
						</tr>
					</template>
				</tbody>
			</table>

			<div v-if="loading && rows.length === 0" class="p-8 text-center text-zinc-500">
				Loading...
			</div>
			<div v-else-if="rows.length === 0" class="p-8 text-center text-zinc-500">
				No history yet. Finish a session to see it here.
			</div>
		</div>
	</div>
</template>
