<script setup lang="ts">
// Home component for introducing Gaze
const emit = defineEmits<{
	(e: 'startTutorial'): void
}>()
</script>

<template>
	<div
		class="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 px-6"
	>
		<!-- Hero Section -->
		<header class="flex flex-col items-center text-center space-y-4 pt-16">
			<h2 class="text-7xl font-bold tracking-tighter text-white">GAZE</h2>
			<span
				class="px-3 py-1 text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 rounded uppercase tracking-[0.2em] font-bold"
			>
				Interactive Hypnosis
			</span>
			<p class="text-2xl font-light text-zinc-400 leading-relaxed max-w-2xl mt-4">
				A hypnosis app that uses
				<span class="text-cyan-400">biofeedback</span> to guide you deeper.
			</p>
		</header>

		<!-- Introduction Section -->
		<section class="space-y-8">
			<div class="flex justify-center">
				<button
					@click="emit('startTutorial')"
					class="bg-cyan-950 hover:bg-cyan-900 text-white border border-cyan-800 px-8 py-4 rounded-full font-bold text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.2),inset_0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4),inset_0_0_20px_rgba(6,182,212,0.2)]"
				>
					Begin Tutorial
				</button>
			</div>
			<div class="p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-left">
				<h3 class="text-xl font-bold text-white flex items-center gap-3 mb-4">
					<span class="w-2 h-2 bg-cyan-500 rounded-full"></span>
					What is Gaze?
				</h3>
				<p class="text-zinc-400 leading-relaxed text-base">
					Gaze uses your camera and microphone to measure biometrics and dynamically adapt
					to your state of mind. By tracking subtle somatic cues, it creates a unique,
					responsive meditation experience that evolves with your presence.
				</p>
			</div>
		</section>

		<!-- Features Grid -->
		<section class="space-y-8">
			<h3 class="text-xs uppercase font-bold text-zinc-500 tracking-widest text-center">
				Somatic Triggers & Features
			</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Pacing -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Dynamic Pacing</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Rhythm is algorithmically calculated based on sentence structure.
					</p>
				</div>

				<!-- Breath -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9.6 4.6A2 2 0 1 1 11 8H2"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M12.6 19.4a2 2 0 1 0-1.4-3.4H2"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Breath Monitoring</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Monitors face and body movement to track breath rate.
					</p>
				</div>

				<!-- Verbal -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M11 5h2M11 19h2M5 11v2M19 11v2m-2-7l1.414-1.414M6.586 18.414L5 20m12.414 0L19 18.414M6.586 5.586L5 4"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Verbal Affirmations</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Suggest and confirm verbal affirmations through microphone input.
					</p>
				</div>
				<!-- Eyes -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Blink & Eyelid Heaviness</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Tracks blinking patterns and eyelid closure for deepening trance.
					</p>
				</div>

				<!-- Head Heaviness -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M12 9v8m0 0l-3-3m3 3l3-3m-3-12a9 9 0 110 18 9 9 0 010-18z"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Head Heaviness</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Detects the gradual dropping of the head as relaxation deepens.
					</p>
				</div>

				<!-- Jaw -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Jaw Relaxation</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Measures mouth openness and muscle slack to ensure deep release.
					</p>
				</div>

				<!-- Stillness -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M4 9s3-2 5-2 5 2 11 0"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M4 14s3-2 5-2 5 2 11 0"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M4 19s3-2 5-2 5 2 11 0"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Stillness Tracking</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Monitors head movement tolerance for focused awareness.
					</p>
				</div>
				<!-- Nod -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Nod Detection</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Allows for non-verbal "Yes/No" interaction with the meditation.
					</p>
				</div>

				<!-- Gaze -->
				<div class="p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-left">
					<div class="text-cyan-400 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<circle
								cx="12"
								cy="12"
								r="3"
								stroke-width="1.5"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M3 12h3m12 0h3M12 3v3m0 12v3"
							/>
						</svg>
					</div>
					<h4 class="font-bold text-zinc-100">Gaze Tracking</h4>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Senses where your eyes are focused on the screen.
					</p>
				</div>
			</div>
		</section>

		<!-- Privacy Section -->
		<section>
			<div class="p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-left">
				<div class="flex items-center gap-3 text-xs font-mono text-cyan-400 mb-4">
					<span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1"></span>
					SECURE LOCAL PROCESSING
				</div>
				<h3 class="text-xl font-bold text-white flex items-center gap-3 mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-cyan-500"
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
				<p class="text-zinc-400 leading-relaxed text-base">
					All biofeedback data is processed
					<strong class="text-zinc-200">100% locally in your browser.</strong> No data is
					ever sent to a server. Your privacy is paramount, and your biometric data
					remains yours alone.
				</p>
			</div>
		</section>

		<!-- Permissions Note -->
		<section class="p-10 border border-zinc-800 rounded-[3rem] bg-zinc-900/20 text-left">
			<h3
				class="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-8 flex items-center gap-2"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-zinc-500"
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
					<p class="text-zinc-500 text-sm leading-relaxed">
						To function, Gaze requires access to your
						<strong class="text-zinc-300">Camera</strong> for tracking eye movement and
						facial expressions, and optionally your
						<strong class="text-zinc-300">Microphone</strong> for speech segments.
					</p>
				</div>
				<div class="space-y-4">
					<p class="text-zinc-500 text-sm leading-relaxed">
						A green light will appear next to your camera when active. This feed is
						processed instantly by JavaScript on your device and is
						<strong class="text-zinc-300"
							>never recorded, stored, or transmitted.</strong
						>
					</p>
				</div>
			</div>
		</section>
	</div>
</template>
