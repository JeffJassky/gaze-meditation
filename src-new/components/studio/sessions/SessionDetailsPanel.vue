<script setup lang="ts">
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { su } from '@new/components/ui/studioUi'
import type { Session } from '@/services/sessions'
import { VOICES_KEY } from './voicesKey'

/**
 * Top-of-editor panel for session-level metadata: title, description,
 * audience, tags, visibility, adult flag, and publish toggle.
 *
 * Uses `defineModel` so the parent editor's `session` ref is the single
 * source of truth — no internal copies to keep in sync.
 */
const session = defineModel<Session>({ required: true })

const emit = defineEmits<{
	publish: []
	unpublish: []
}>()

const tagsText = computed({
	get: () => session.value.tags.join(', '),
	set: (v: string) => {
		session.value.tags = v
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	},
})

// Injected from SessionEditorView. May be undefined if this panel is ever
// rendered outside the editor — handle that gracefully.
const voicesState = inject(VOICES_KEY, undefined)
</script>

<template>
	<section :class="su.card">
		<div class="flex items-start justify-between gap-4 mb-4">
			<h2 :class="su.h2">Session details</h2>
			<div class="flex items-center gap-2">
				<span :class="session.status === 'published' ? su.badgePublished : su.badgeDraft">
					{{ session.status }}
				</span>
				<button
					v-if="session.status === 'draft'"
					:class="su.btnSecondary"
					@click="emit('publish')">
					Publish
				</button>
				<button v-else :class="su.btnSecondary" @click="emit('unpublish')">
					Unpublish
				</button>
			</div>
		</div>

		<div class="grid gap-4">
			<div>
				<label :class="su.label">Title</label>
				<input v-model="session.title" :class="su.input" />
			</div>

			<div>
				<label :class="su.label">Description</label>
				<textarea
					v-model="session.description"
					:class="[su.textarea, 'min-h-[80px] !font-sans !text-base']" />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label :class="su.label">Audience</label>
					<select v-model="session.audience" :class="su.select">
						<option value="f4a">f4a</option>
						<option value="m4a">m4a</option>
						<option value="m4f">m4f</option>
						<option value="m4m">m4m</option>
						<option value="f4f">f4f</option>
						<option value="f4m">f4m</option>
						<option value="t4a">t4a</option>
						<option value="t4f">t4f</option>
						<option value="t4m">t4m</option>
						<option value="unspecified">unspecified</option>
					</select>
				</div>

				<div>
					<label :class="su.label">Visibility</label>
					<select v-model="session.visibility" :class="su.select">
						<option value="private">Private (only you)</option>
						<option value="public">Public (anyone can view)</option>
					</select>
				</div>

				<div>
					<label :class="su.label">Content rating</label>
					<label class="flex items-center gap-2 pt-2">
						<input
							type="checkbox"
							v-model="session.isAdult"
							class="w-4 h-4 accent-zinc-200" />
						<span class="text-sm text-zinc-300">Adults only (18+)</span>
					</label>
				</div>
			</div>

			<div>
				<label :class="su.label">Tags (comma separated)</label>
				<input v-model="tagsText" :class="su.input" placeholder="relaxation, focus" />
			</div>

			<!-- ElevenLabs default voice -->
			<div>
				<label :class="su.label">Default voice (ElevenLabs)</label>
				<template v-if="voicesState?.enabled.value">
					<select
						:value="session.elevenlabsVoiceId ?? ''"
						:class="su.select"
						@change="
							(e) =>
								(session.elevenlabsVoiceId =
									(e.target as HTMLSelectElement).value || null)
						">
						<option value="">— no voice —</option>
						<option
							v-for="v in voicesState.voices.value"
							:key="v.voice_id"
							:value="v.voice_id">
							{{ v.name }}{{ v.category ? ` (${v.category})` : '' }}
						</option>
					</select>
					<p v-if="voicesState.loading.value" class="text-xs text-zinc-500 mt-1">
						Loading voices…
					</p>
					<p v-else-if="voicesState.error.value" class="text-xs text-red-400 mt-1">
						{{ voicesState.error.value }}
					</p>
				</template>
				<p v-else class="text-xs text-zinc-500">
					Add your ElevenLabs API key in
					<RouterLink to="/account" class="underline underline-offset-2">
						account settings
					</RouterLink>
					to pick a voice.
				</p>
			</div>
		</div>
	</section>
</template>
