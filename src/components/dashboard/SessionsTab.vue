<script setup lang="ts">
import type { Session } from '@/api/sessions'
import SessionCard from './SessionCard.vue'

defineProps<{
	tutorialSession: Session | null
	sessions: Session[]
	loading: boolean
	error: string | null
	userSelected: boolean
}>()

const emit = defineEmits<{
	startTutorial: []
	startSession: [program: Session]
}>()
</script>

<template>
	<div class="max-w-4xl mx-auto space-y-8">
		<header class="text-center">
			<h2 class="text-3xl font-light text-white mb-2">Select a Session</h2>
			<p class="text-zinc-500">Explore these curated Hypnosis sessions.</p>
		</header>

		<div class="space-y-4">
			<!-- Tutorial CTA -->
			<div
				class="group relative bg-zinc-900 border border-cyan-500/30 p-8 rounded-2xl hover:border-cyan-400 transition-all overflow-hidden">
				<div
					class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />

				<div
					class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-3">
							<span
								class="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-cyan-500/20">
								Get Started
							</span>
						</div>
						<div class="flex items-center gap-3">
							<h3
								class="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors text-left">
								{{ tutorialSession?.title ?? 'Tutorial' }}
							</h3>
							<span
								v-if="tutorialSession"
								class="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 border border-zinc-700 whitespace-nowrap">
								{{ Math.ceil(tutorialSession.scenes.length / 4) }}-{{
									Math.ceil(tutorialSession.scenes.length / 3)
								}}
								min
							</span>
						</div>
						<p class="text-zinc-400 max-w-xl text-left">
							{{ tutorialSession?.description ?? 'Learn how Gaze works.' }}
						</p>
					</div>
					<div class="flex flex-col items-end gap-4">
						<button
							:disabled="!userSelected || !tutorialSession"
							@click="emit('startTutorial')"
							class="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
							Start Introduction
						</button>
					</div>
				</div>
			</div>

			<label
				class="pt-4 text-xs uppercase font-bold text-zinc-500 tracking-wider block text-center">
				Sessions
			</label>

			<div v-if="loading && sessions.length === 0" class="text-center text-sm text-zinc-500 py-8">
				Loading sessions...
			</div>
			<div v-else-if="error" class="text-center text-sm text-red-400 py-8">
				{{ error }}
			</div>
			<div v-else-if="sessions.length === 0" class="text-center text-sm text-zinc-500 py-8">
				No sessions yet.
				<router-link
					to="/studio/sessions"
					class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
					Create one in the studio
				</router-link>.
			</div>
			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<SessionCard
					v-for="prog in sessions"
					:key="prog.id"
					:program="prog"
					:disabled="!userSelected"
					@start="emit('startSession', $event)" />
			</div>
		</div>
	</div>
</template>
