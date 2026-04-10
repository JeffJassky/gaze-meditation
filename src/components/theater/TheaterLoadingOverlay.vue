<script setup lang="ts">
import type { ThemeConfig } from '@/types'
import ProgressBar from '@/components/ui/ProgressBar.vue'

defineProps<{
	message: string
	progress: number
	showContent: boolean
	showPermissionRequest: boolean
	permissionLabel: string
	showBeginButton: boolean
	theme: ThemeConfig
}>()

const emit = defineEmits<{
	grantAccess: []
	begin: []
}>()
</script>

<template>
	<div class="absolute inset-0 z-50 bg-black text-white">
		<div
			class="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out"
			:class="showContent ? 'opacity-100' : 'opacity-0'">

			<div
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-24 text-2xl text-center w-full"
				:style="{ color: theme.positiveColor || '#10b981' }">
				{{ message }}
			</div>

			<ProgressBar
				v-if="!showPermissionRequest && !showBeginButton"
				:progress="progress"
				:fill-color="theme.positiveColor || '#10b981'" />

			<!-- Permission gate -->
			<div
				v-if="showPermissionRequest"
				class="mt-8 text-center px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<p class="text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
					This session uses biofeedback. To proceed, we need temporary access to your
					<span class="text-white font-bold">{{ permissionLabel }}</span>.
					<br />
					<span class="text-xs opacity-50 block mt-2">
						Data is processed locally on your device and is never recorded.
					</span>
				</p>
				<button
					@click.stop="emit('grantAccess')"
					class="px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-105"
					:style="{
						backgroundColor: theme.positiveColor || '#10b981',
						color: '#000',
						boxShadow: `0 0 20px ${theme.positiveColor || '#10b981'}40`,
					}">
					Grant Access
				</button>
			</div>

			<!-- Begin session gate -->
			<div
				v-if="showBeginButton"
				class="mt-8 text-center px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<button
					@click.stop="emit('begin')"
					class="px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-105"
					:style="{
						backgroundColor: theme.positiveColor || '#10b981',
						color: '#000',
						boxShadow: `0 0 20px ${theme.positiveColor || '#10b981'}40`,
					}">
					Begin Session
				</button>
			</div>
		</div>
	</div>
</template>
