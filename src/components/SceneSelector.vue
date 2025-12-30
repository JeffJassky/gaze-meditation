<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { type Scene } from '../../src-new/core/Scene'

const props = defineProps({
	sscenes: {
		type: Array as () => Scene[],
		required: true
	},
	currentIndex: {
		type: Number,
		required: true
	},
	placement: {
		type: String as () => 'top' | 'bottom',
		required: false
	}
})

const emit = defineEmits<{(e: 'select', index: number): void, (e: 'toggle', expanded: boolean): void}>()

const isExpanded = ref(false)
const searchQuery = ref('')
const placement = computed(() => props.placement || 'bottom')
const scrollContainer = ref<HTMLElement | null>(null)

watch(isExpanded, async val => {
	emit('toggle', val)
	if (val) {
		await nextTick()
		scrollToActive()
	}
})

watch(
	() => props.currentIndex,
	() => {
		if (isExpanded.value) {
			scrollToActive()
		}
	}
)

const scrollToActive = () => {
	if (!scrollContainer.value) return
	const activeItem = scrollContainer.value.querySelector('.bg-cyan-900/50')
	if (activeItem) {
		activeItem.scrollIntoView({ behavior: 'instant', block: 'center' })
	}
}

const getSceneText = (scene: Scene) => {
	const voice = scene.config.voice
	const text = scene.config.text
	const voiceStr = Array.isArray(voice) ? voice.join(' ') : voice
	const textStr = Array.isArray(text) ? text.join(' ') : text
	return voiceStr || textStr || ''
}

const filteredScenes = computed(() => {
	return props.scenes
		.map((scene, originalIndex) => ({ scene, originalIndex }))
		.filter(({ scene }) => {
			if (!searchQuery.value) return true
			const query = searchQuery.value.toLowerCase()
			const type = 'Scene'.toLowerCase()
			const sceneText = getSceneText(scene).toLowerCase()

			return type.includes(query) || sceneText.includes(query)
		})
})
</script>

<template>
	<div class="relative inline-block text-xs font-mono">
		<button
			@click="isExpanded = !isExpanded"
			class="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1 rounded shadow hover:bg-zinc-800 transition-colors"
			:class="{ 'border-cyan-500 text-cyan-400': isExpanded }"
		>
			Jump To {{ isExpanded ? '[-]' : '[+]' }}
		</button>

		<div
			v-if="isExpanded"
			class="absolute left-0 bg-zinc-900/90 border border-zinc-700 p-2 rounded shadow-xl w-64 backdrop-blur-sm max-h-[60vh] flex flex-col z-50"
			:class="placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
		>
			<input
				v-model="searchQuery"
				type="text"
				placeholder="Filter..."
				class="w-full bg-zinc-800 border border-zinc-600 text-zinc-200 px-2 py-1 rounded mb-2 focus:outline-none focus:border-cyan-500"
				autofocus
			/>
			<div
				ref="scrollContainer"
				class="overflow-y-auto flex-1 custom-scrollbar"
			>
				<div
					v-for="item in filteredScenes"
					:key="item.scene.id"
					@click="
						() => {
							emit('select', item.originalIndex)
							isExpanded = false
						}
					"
					class="cursor-pointer p-2 hover:bg-zinc-700 rounded mb-1 transition-colors text-left"
					:class="{
						'bg-cyan-900/50 border border-cyan-700': item.originalIndex === currentIndex
					}"
				>
					<div class="font-bold flex justify-between items-center mb-1">
						<span
							class="text-cyan-500 text-[10px] font-mono uppercase tracking-wider"
						>
							Scene
						</span>
						<span class="text-zinc-400">#{{ item.originalIndex + 1 }}</span>
					</div>
					<div
						v-if="getSceneText(item.scene)"
						class="text-white truncate text-left"
						:title="getSceneText(item.scene)"
					>
						{{ getSceneText(item.scene) }}
					</div>
					<div
						v-else
						class="text-zinc-500 italic text-left"
					>
						No preview available
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #3f3f46;
	border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #52525b;
}
</style>
