<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { SessionDoc } from '@/services/sessions'

/**
 * Blog-style session header rendered at the top of the scrolling script
 * stack. Everything is edit-in-place — title and description are
 * contenteditable spans, tags are a comma-edit field, audience /
 * visibility / adult rating are tiny inline selects styled to read as
 * metadata chips.
 */
const session = defineModel<SessionDoc>({ required: true })

// ──────────────────────────────────────────────────────────────────────
// Title — contenteditable, kept in sync via the same pattern as the
// toolbar title. We don't use v-model because contenteditable inputs
// don't emit `input` events in a way Vue's v-model understands cleanly.
// ──────────────────────────────────────────────────────────────────────
const titleEl = ref<HTMLElement | null>(null)
watch(
	() => session.value.title,
	async (t) => {
		await nextTick()
		if (!titleEl.value) return
		if (document.activeElement === titleEl.value) return
		if (titleEl.value.innerText !== (t ?? '')) {
			titleEl.value.innerText = t ?? ''
		}
	},
	{ immediate: true },
)
function onTitleInput(e: Event) {
	const text = (e.target as HTMLElement).innerText.replace(/\n/g, '').trim()
	session.value.title = text
}
function onTitleKey(e: KeyboardEvent) {
	if (e.key === 'Enter') {
		e.preventDefault()
		;(e.target as HTMLElement).blur()
	}
}

// ──────────────────────────────────────────────────────────────────────
// Description — same pattern, but allows newlines.
// ──────────────────────────────────────────────────────────────────────
const descEl = ref<HTMLElement | null>(null)
watch(
	() => session.value.description,
	async (d) => {
		await nextTick()
		if (!descEl.value) return
		if (document.activeElement === descEl.value) return
		if (descEl.value.innerText !== (d ?? '')) {
			descEl.value.innerText = d ?? ''
		}
	},
	{ immediate: true },
)
function onDescInput(e: Event) {
	session.value.description = (e.target as HTMLElement).innerText
}

// ──────────────────────────────────────────────────────────────────────
// Tags — comma-separated, edited as a single string.
// ──────────────────────────────────────────────────────────────────────
const tagsText = computed({
	get: () => session.value.tags.join(', '),
	set: (v: string) => {
		session.value.tags = v
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	},
})

// ──────────────────────────────────────────────────────────────────────
// Helpers — human-readable labels for the metadata chips.
// ──────────────────────────────────────────────────────────────────────
const audienceLabel = computed(() => session.value.audience || 'unspecified')
const visibilityLabel = computed(() =>
	session.value.visibility === 'public' ? 'public' : 'private',
)
</script>

<template>
	<header class="pb-10 mb-10 border-b border-zinc-900">
		<!-- Status pill -->
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider mb-3"
			:class="
				session.status === 'published'
					? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
					: 'bg-orange-950/60 border border-orange-800/60 text-orange-300'
			">
			{{ session.status }}
		</span>

		<!-- Title -->
		<h1
			ref="titleEl"
			class="text-4xl font-semibold tracking-tight text-zinc-100 outline-none rounded px-1 -mx-1 focus:bg-zinc-900/60 focus:ring-1 focus:ring-zinc-700 empty:before:content-['Untitled_session'] empty:before:text-zinc-700"
			:contenteditable="true"
			spellcheck="false"
			@input="onTitleInput"
			@keydown="onTitleKey" />

		<!-- Description -->
		<p
			ref="descEl"
			class="mt-3 text-[17px] leading-[1.6] text-zinc-400 font-serif italic outline-none rounded px-1 -mx-1 focus:bg-zinc-900/60 focus:ring-1 focus:ring-zinc-700 empty:before:content-['Add_a_description…'] empty:before:text-zinc-700 empty:before:not-italic empty:before:font-sans"
			:contenteditable="true"
			spellcheck="false"
			@input="onDescInput" />

		<!-- Metadata row: audience · visibility · adult · tags -->
		<div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
			<!-- Audience -->
			<label class="relative group">
				<span class="hover:text-zinc-300 transition-colors cursor-pointer">
					{{ audienceLabel }}
				</span>
				<select
					v-model="session.audience"
					class="absolute inset-0 opacity-0 cursor-pointer w-full">
					<option value="f4a">f4a</option>
					<option value="m4a">m4a</option>
					<option value="m4f">m4f</option>
					<option value="m4m">m4m</option>
					<option value="f4f">f4f</option>
					<option value="f4m">f4m</option>
					<option value="t4a">t4a</option>
					<option value="t4f">t4f</option>
					<option value="t4m">t4m</option>
					<option value="t4t">t4t</option>
					<option value="unspecified">unspecified</option>
				</select>
			</label>

			<span class="text-zinc-800">·</span>

			<!-- Visibility -->
			<label class="relative group">
				<span class="hover:text-zinc-300 transition-colors cursor-pointer">
					{{ visibilityLabel }}
				</span>
				<select
					v-model="session.visibility"
					class="absolute inset-0 opacity-0 cursor-pointer w-full">
					<option value="private">private</option>
					<option value="public">public</option>
				</select>
			</label>

			<span class="text-zinc-800">·</span>

			<!-- Adult -->
			<label class="flex items-center gap-1.5 cursor-pointer hover:text-zinc-300 transition-colors">
				<input
					type="checkbox"
					v-model="session.isAdult"
					class="w-3 h-3 accent-zinc-300" />
				<span>18+</span>
			</label>

			<span class="text-zinc-800">·</span>

			<!-- Tags -->
			<div class="flex items-center gap-1.5 flex-1 min-w-[12ch]">
				<span class="text-zinc-700">#</span>
				<input
					v-model="tagsText"
					class="flex-1 bg-transparent border-0 outline-none text-[11px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 focus:text-zinc-300 placeholder-zinc-800 transition-colors"
					placeholder="tags, comma, separated" />
			</div>
		</div>
	</header>
</template>
