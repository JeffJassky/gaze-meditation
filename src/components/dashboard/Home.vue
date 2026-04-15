<script setup lang="ts">
import type { Session } from '@/api/sessions'
import SessionCard from './SessionCard.vue'

// Home component for introducing Gaze
defineProps<{
	tutorialSlug?: string
	tutorialSession?: Session | null
	sessions: Session[]
	sessionsLoading: boolean
	sessionsError: string | null
	userSelected: boolean
}>()

const emit = defineEmits<{
	(e: 'startTutorial'): void
	(e: 'browseSessions'): void
	(e: 'startSession', program: Session): void
}>()

const features = [
	{ title: 'Breath', desc: 'Breath rate tracking.', paths: ['M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2', 'M9.6 4.6A2 2 0 1 1 11 8H2', 'M12.6 19.4a2 2 0 1 0-1.4-3.4H2'] },
	{ title: 'Dynamic Pacing', desc: 'Adapts to your rhythm.', paths: ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'] },
	{ title: 'Verbal Affirmations', desc: 'Spoken input via mic.', paths: ['M11 5h2M11 19h2M5 11v2M19 11v2m-2-7l1.414-1.414M6.586 18.414L5 20m12.414 0L19 18.414M6.586 5.586L5 4'] },
	{ title: 'Blink & Eyelids', desc: 'Blink and closure detection.', paths: ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'] },
	{ title: 'Head Heaviness', desc: 'Head drop detection.', paths: ['M12 9v8m0 0l-3-3m3 3l3-3m-3-12a9 9 0 110 18 9 9 0 010-18z'] },
	{ title: 'Jaw Relaxation', desc: 'Mouth and muscle slack.', paths: ['M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'] },
	{ title: 'Stillness', desc: 'Movement monitoring.', paths: ['M4 9s3-2 5-2 5 2 11 0', 'M4 14s3-2 5-2 5 2 11 0', 'M4 19s3-2 5-2 5 2 11 0'] },
	{ title: 'Nod Detection', desc: 'Non-verbal yes/no.', paths: ['M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'] },
	{ title: 'Gaze Tracking', desc: 'Eye focus tracking.', paths: ['M3 12h3m12 0h3M12 3v3m0 12v3'], circle: { cx: 12, cy: 12, r: 3 } },
]
</script>

<template>
	<div class="max-w-4xl mx-auto space-y-16 pb-32 px-6">
		<!-- Hero Section -->
		<header class="flex flex-col items-center text-center space-y-4 pt-16">
			<h2 class="text-7xl font-bold tracking-tighter text-content">GAZE</h2>
			<span
				class="px-3 py-1 text-xs bg-accent-muted text-accent border border-accent/30 rounded uppercase tracking-[0.2em] font-bold"
			>
				Interactive Hypnosis
			</span>
			<p class="text-2xl font-light text-content-secondary leading-relaxed max-w-2xl mt-4">
				A hypnosis app that uses
				<span class="text-accent">biofeedback</span><br />to guide you deeper.
			</p>
		</header>

		<!-- Introduction Section -->
		<section class="space-y-8">
			<div class="flex justify-center items-center gap-8">
				<RouterLink
					:to="tutorialSlug ? `/theater/${tutorialSlug}` : '/sessions'"
					class="bg-accent-muted hover:opacity-90 text-content border border-accent/30 px-8 py-4 rounded-full font-bold text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.2),inset_0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4),inset_0_0_20px_rgba(6,182,212,0.2)] no-underline"
					@click.prevent="emit('startTutorial')"
				>
					Watch Tutorial
				</RouterLink>
				<button
					@click="emit('browseSessions')"
					class="text-content-tertiary hover:text-content-secondary font-bold tracking-wide transition-colors"
				>
					Browse Sessions
				</button>
			</div>
			<div
				class="p-8 md:p-12 bg-surface-secondary/50 border border-edge rounded-2xl text-left"
			>
				<h3 class="text-xl font-bold text-content flex items-center gap-3 mb-4">
					<span class="w-2 h-2 bg-accent rounded-full"></span>
					What is Gaze?
				</h3>
				<p class="text-content-secondary leading-relaxed text-base">
					Gaze uses your camera and microphone to measure biometrics and dynamically adapt
					to your state of mind. By tracking your eyes, jaw, breath and other biometrics,
					sessions become interactive, and you can guide yourself deeper.
				</p>
			</div>
		</section>

		<!-- Features Grid -->
		<section class="space-y-6">
			<h3
				class="text-xs uppercase font-bold text-content-tertiary tracking-widest text-center"
			>
				Biometric & Interactive Features
			</h3>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
				<div
					v-for="feature in features"
					:key="feature.title"
					class="p-4 border border-edge rounded-lg bg-surface-secondary/30 text-left"
				>
					<div class="flex items-center gap-2 mb-1.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 shrink-0 text-accent"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								v-for="(d, i) in feature.paths"
								:key="i"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								:d="d"
							/>
							<circle
								v-if="feature.circle"
								v-bind="feature.circle"
								stroke-width="1.5"
							/>
						</svg>
						<h4 class="text-base font-bold text-content leading-tight">{{ feature.title }}</h4>
					</div>
					<p class="text-xs text-content-tertiary leading-snug">
						{{ feature.desc }}
					</p>
				</div>
			</div>
		</section>

		<!-- Sessions Section -->
		<section class="space-y-8">
			<!-- Tutorial CTA -->
			<RouterLink
				v-if="tutorialSession"
				:to="`/theater/${tutorialSession.slug}`"
				:class="[
					'group relative bg-surface-secondary border border-accent/30 p-8 rounded-2xl hover:border-accent transition-all overflow-hidden block no-underline',
					(!userSelected || !tutorialSession) && 'opacity-50 cursor-not-allowed pointer-events-none'
				]"
				@click.prevent="emit('startTutorial')">
				<div
					class="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full" />

				<div
					class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-3">
							<span
								class="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-accent/20">
								Get Started
							</span>
						</div>
						<div class="flex items-center gap-3">
							<h3
								class="text-3xl font-bold text-content group-hover:text-accent transition-colors text-left">
								{{ tutorialSession.title }}
							</h3>
							<span
								class="text-xs bg-surface-tertiary px-3 py-1 rounded-full text-content-secondary border border-edge-secondary whitespace-nowrap">
								{{ Math.ceil(tutorialSession.scenes.length / 4) }}-{{
									Math.ceil(tutorialSession.scenes.length / 3)
								}}
								min
							</span>
						</div>
						<p class="text-content-secondary max-w-xl text-left">
							{{ tutorialSession.description }}
						</p>
					</div>
					<div class="flex flex-col items-end gap-4">
						<button
							:disabled="!userSelected || !tutorialSession"
							@click.stop.prevent="emit('startTutorial')"
							class="bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-surface px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg shadow-accent/20 active:scale-95">
							Start Introduction
						</button>
					</div>
				</div>
			</RouterLink>

			<label
				class="text-xs uppercase font-bold text-content-tertiary tracking-wider block text-center">
				Sessions
			</label>

			<div v-if="sessionsLoading && sessions.length === 0" class="text-center text-sm text-content-tertiary py-8">
				Loading sessions...
			</div>
			<div v-else-if="sessionsError" class="text-center text-sm text-danger py-8">
				{{ sessionsError }}
			</div>
			<div v-else-if="sessions.length === 0" class="text-center text-sm text-content-tertiary py-8">
				No sessions yet.
			</div>
			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<SessionCard
					v-for="prog in sessions"
					:key="prog.id"
					:program="prog"
					:disabled="!userSelected"
					@start="emit('startSession', $event)" />
			</div>
		</section>

		<!-- Privacy Section -->
		<section>
			<div
				class="p-8 md:p-12 bg-surface-secondary/50 border border-edge rounded-2xl text-left"
			>
				<div class="flex items-center gap-3 text-xs font-mono text-accent mb-4">
					<span class="w-1.5 h-1.5 bg-success rounded-full animate-pulse ml-1"></span>
					SECURE LOCAL PROCESSING
				</div>
				<h3 class="text-xl font-bold text-content flex items-center gap-3 mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-accent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Privacy First
				</h3>
				<p class="text-content-secondary leading-relaxed text-base">
					Nothing is recorded. All camera and microphone data is captured and processed
					<strong class="text-content">100% locally in your browser</strong> and never
					sent to a server. Your privacy is paramount, and your experience is yours alone.
					<RouterLink
						to="/privacy"
						class="text-accent hover:underline ml-1"
					>
						Read our Privacy Policy
					</RouterLink>
				</p>
			</div>
		</section>

		<!-- Permissions Note -->
		<section class="p-10 border border-edge rounded-2xl bg-surface-secondary/20 text-left">
			<h3
				class="text-sm font-bold text-content-secondary uppercase tracking-widest mb-8 flex items-center gap-2"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-content-tertiary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Device Permissions
			</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="space-y-4">
					<p class="text-content-tertiary text-sm leading-relaxed">
						To function, Gaze requires access to your
						<strong class="text-content-secondary">Camera</strong> for tracking eye
						movement and facial expressions, and optionally your
						<strong class="text-content-secondary">Microphone</strong> for speech
						segments.
					</p>
				</div>
				<div class="space-y-4">
					<p class="text-content-tertiary text-sm leading-relaxed">
						A green light will appear next to your camera when active. This feed is
						processed in real time on your device and is
						<strong class="text-content-secondary"
							>never recorded, stored, or transmitted.</strong
						>
					</p>
				</div>
			</div>
		</section>
	</div>
</template>
