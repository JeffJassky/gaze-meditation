<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Instruction } from '../core/Instruction'

const props = defineProps<{
	instructions: Instruction<any>[]
	currentIndex: number
	placement?: 'top' | 'bottom'
}>()

const emit = defineEmits<{
	(e: 'select', index: number): void
	(e: 'toggle', expanded: boolean): void
}>()

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
	const activeItem = scrollContainer.value.querySelector('.bg-cyan-900\\/50')
	if (activeItem) {
		activeItem.scrollIntoView({ behavior: 'instant', block: 'center' })
	}
}

const filteredInstructions = computed(() => {
	return props.instructions
		.map((instr, originalIndex) => ({ instr, originalIndex }))
		.filter(({ instr }) => {
			if (!searchQuery.value) return true
			const query = searchQuery.value.toLowerCase()
			const type = instr.constructor.name.replace('Instruction', '').toLowerCase()
			const prompt = instr.options.prompt?.toLowerCase() || ''
			const text = Array.isArray(instr.options.text)
				? instr.options.text.join(' ').toLowerCase()
				: instr.options.text?.toLowerCase() || ''
			const voice = Array.isArray(instr.options.voice)
				? instr.options.voice.join(' ').toLowerCase()
				: instr.options.voice?.toLowerCase() || ''

			return type.includes(query) || prompt.includes(query) || text.includes(query) || voice.includes(query)
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
					v-for="item in filteredInstructions"
					:key="item.instr.id"
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
							:title="item.instr.constructor.name"
						>
							{{ item.instr.constructor.name.replace('Instruction', '') }}
						</span>
						<span class="text-zinc-400">#{{ item.originalIndex + 1 }}</span>
					</div>
					<div
						v-if="item.instr.options.voice || item.instr.options.text || item.instr.options.prompt"
						class="text-white truncate text-left"
						:title="
							(Array.isArray(item.instr.options.voice) ? item.instr.options.voice.join(' ') : item.instr.options.voice) ||
							(Array.isArray(item.instr.options.text) ? item.instr.options.text.join(' ') : item.instr.options.text) ||
							item.instr.options.prompt
						"
					>
						{{
							(Array.isArray(item.instr.options.voice) ? item.instr.options.voice.join(' ') : item.instr.options.voice) ||
							(Array.isArray(item.instr.options.text) ? item.instr.options.text.join(' ') : item.instr.options.text) ||
							item.instr.options.prompt
						}}
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
