<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { type Scene } from '@/core/Scene'

const props = defineProps({
	scenes: {
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
	},
	expanded: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits<{
	(e: 'select', index: number): void
	(e: 'toggle', expanded: boolean): void
	(e: 'update:expanded', val: boolean): void
}>()

const isExpandedInternal = ref(props.expanded)

watch(() => props.expanded, (val) => {
	isExpandedInternal.value = val
})

watch(isExpandedInternal, async val => {
	emit('toggle', val)
	emit('update:expanded', val)
	if (val) {
		await nextTick()
		scrollToActive()
	}
})
const searchQuery = ref('')
const placementValue = computed(() => props.placement || 'bottom')
const scrollContainer = ref<HTMLElement | null>(null)

watch(
	() => props.currentIndex,
	() => {
		if (isExpandedInternal.value) {
			scrollToActive()
		}
	}
)

const scrollToActive = () => {
	if (!scrollContainer.value) return
	const activeItem = scrollContainer.value.querySelector('.active-scene')
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

const getBehaviorsLabel = (scene: Scene) => {
	const suggestions = scene.config.behavior?.suggestions || []
	if (suggestions.length === 0) return 'Scene'
	return suggestions
		.map(s => s.type.split(':').pop()?.replace('-', ' '))
		.filter(Boolean)
		.join(', ')
		.toUpperCase()
}

const filteredScenes = computed(() => {
	return (props.scenes as Scene[])
		.map((scene: Scene, originalIndex: number) => ({ scene, originalIndex }))
		.filter(({ scene }: { scene: Scene }) => {
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
			@click="isExpandedInternal = !isExpandedInternal"
			class="bg-surface border border-edge text-content-secondary px-3 py-1 rounded shadow-theme-sm hover:bg-surface-secondary transition-colors"
			:class="{ 'border-accent text-accent': isExpandedInternal }"
		>
			Jump To {{ isExpandedInternal ? '[-]' : '[+]' }}
		</button>

		<div
			v-if="isExpandedInternal"
			class="absolute left-0 bg-surface/90 border border-edge p-2 rounded shadow-theme-lg w-64 backdrop-blur-sm max-h-[60vh] flex flex-col z-50"
			:class="placementValue === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
		>
			<input
				v-model="searchQuery"
				type="text"
				placeholder="Filter..."
				class="w-full bg-surface-secondary border border-edge-secondary text-content px-2 py-1 rounded mb-2 focus:outline-none focus:border-accent"
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
							isExpandedInternal = false
						}
					"
					class="cursor-pointer p-2 hover:bg-surface-tertiary rounded mb-1 transition-colors text-left"
					:class="{
						'bg-accent-muted border border-accent/40 active-scene': item.originalIndex === currentIndex
					}"
				>
					<div class="font-bold flex justify-between items-center mb-1">
						<span
							class="text-accent-text text-[10px] font-mono uppercase tracking-wider"
						>
							{{ getBehaviorsLabel(item.scene) }}
						</span>
						<span class="text-content-secondary">#{{ item.originalIndex + 1 }}</span>
					</div>
					<div
						v-if="getSceneText(item.scene)"
						class="text-content truncate text-left"
						:title="getSceneText(item.scene)"
					>
						{{ getSceneText(item.scene) }}
					</div>
					<div
						v-else
						class="text-content-tertiary italic text-left"
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
	background: rgb(var(--edge-secondary-rgb));
	border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: rgb(var(--accent-rgb) / 0.5);
}
</style>
