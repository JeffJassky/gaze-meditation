<script setup lang="ts">
import { computed } from 'vue'
import { su } from '@new/components/ui/studioUi'
import {
	BEHAVIOR_BY_TYPE,
	defaultOptionsFor,
	groupedBehaviors,
	type BehaviorDefinition,
} from './behaviorCatalog'

/**
 * Behavior editor for a single scene.
 *
 * Each suggestion in `scene.config.behavior.suggestions` is rendered as a
 * labeled card: behavior picker, duration, fail handling, and a form that's
 * auto-generated from the selected behavior's option schema (see
 * behaviorCatalog.ts). No raw JSON exposed to the user.
 */
const config = defineModel<Record<string, unknown>>({ required: true })

interface Suggestion {
	type: string
	duration?: number
	options?: Record<string, unknown>
	failBehavor?: 'pause' | 'reset'
}

const behavior = computed<{
	suggestions?: Suggestion[]
	success?: { enabled?: boolean; message?: string }
	fail?: { enabled?: boolean; message?: string }
}>({
	get: () => (config.value.behavior as any) ?? {},
	set: (v) => (config.value.behavior = v),
})

function write<K extends 'suggestions' | 'success' | 'fail'>(key: K, value: unknown) {
	const b = { ...behavior.value }
	;(b as any)[key] = value
	config.value.behavior = b
}

const suggestions = computed<Suggestion[]>(() => behavior.value.suggestions ?? [])

function addSuggestion() {
	write('suggestions', [
		...suggestions.value,
		{
			type: 'head:still',
			duration: 5,
			options: defaultOptionsFor('head:still'),
		},
	])
}

function removeSuggestion(index: number) {
	const next = suggestions.value.slice()
	next.splice(index, 1)
	write('suggestions', next)
}

function updateSuggestion(index: number, patch: Partial<Suggestion>) {
	const next = suggestions.value.slice()
	const current = next[index]
	if (!current) return
	next[index] = { ...current, ...patch }
	write('suggestions', next)
}

/**
 * When the behavior type changes, reset the options to the new type's
 * defaults. Keeping stale options from the previous behavior would lead
 * to confusing data that doesn't match any visible field.
 */
function changeType(index: number, newType: string) {
	updateSuggestion(index, {
		type: newType,
		options: defaultOptionsFor(newType),
	})
}

function setOptionField(index: number, key: string, value: unknown) {
	const current = suggestions.value[index]
	if (!current) return
	const nextOptions = { ...(current.options ?? {}), [key]: value }
	updateSuggestion(index, { options: nextOptions })
}

/**
 * Definition lookup with a graceful fallback: if the stored type isn't in
 * the catalog (older data, custom type), we still render the row but with
 * no option fields.
 */
function defOf(type: string): BehaviorDefinition | null {
	return BEHAVIOR_BY_TYPE[type] ?? null
}

const groups = computed(() => groupedBehaviors())
</script>

<template>
	<div :class="su.subCard">
		<h3 :class="[su.h3, 'mb-3']">Behaviors</h3>

		<!-- Suggestions -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<span :class="su.label" class="!mb-0">Suggestions</span>
				<button :class="su.btnGhost" type="button" @click="addSuggestion">+ Add</button>
			</div>

			<div v-if="suggestions.length === 0" class="text-xs text-zinc-500">
				No suggestions. Without any, the scene runs for a fixed duration.
			</div>

			<div v-else class="grid gap-3">
				<div
					v-for="(s, i) in suggestions"
					:key="i"
					class="bg-zinc-950 border border-zinc-800 rounded-lg p-4 grid gap-3">
					<!-- Row 1: behavior / duration / fail / delete -->
					<div class="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_auto] gap-3 items-end">
						<div>
							<label :class="su.label">Behavior</label>
							<select
								:class="su.select"
								:value="s.type"
								@change="(e) => changeType(i, (e.target as HTMLSelectElement).value)">
								<optgroup
									v-for="(items, cat) in groups"
									:key="cat"
									:label="cat">
									<option v-for="b in items" :key="b.type" :value="b.type">
										{{ b.label }}
									</option>
								</optgroup>
								<!-- Preserve unknown legacy types so data isn't silently lost. -->
								<option v-if="s.type && !defOf(s.type)" :value="s.type">
									{{ s.type }} (custom)
								</option>
							</select>
						</div>

						<div>
							<label :class="su.label">Duration (s)</label>
							<input
								:class="su.input"
								type="number"
								min="0"
								step="0.5"
								:value="s.duration ?? ''"
								@input="
									(e) =>
										updateSuggestion(i, {
											duration:
												Number((e.target as HTMLInputElement).value) || undefined,
										})
								" />
						</div>

						<div>
							<label :class="su.label">On failure</label>
							<select
								:class="su.select"
								:value="s.failBehavor ?? ''"
								@change="
									(e) =>
										updateSuggestion(i, {
											failBehavor:
												((e.target as HTMLSelectElement).value as
													| 'pause'
													| 'reset') || undefined,
										})
								">
								<option value="">Default</option>
								<option value="pause">Pause timer</option>
								<option value="reset">Reset timer</option>
							</select>
						</div>

						<button
							:class="su.btnDanger"
							class="self-end mb-[1px]"
							type="button"
							@click="removeSuggestion(i)">
							Remove
						</button>
					</div>

					<!-- Description of the selected behavior -->
					<p v-if="defOf(s.type)" class="text-xs text-zinc-500 -mt-1">
						{{ defOf(s.type)!.description }}
					</p>

					<!-- Row 2: schema-driven option fields -->
					<div
						v-if="defOf(s.type) && defOf(s.type)!.fields.length > 0"
						class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
						<div v-for="f in defOf(s.type)!.fields" :key="f.key">
							<label :class="su.label">{{ f.label }}</label>

							<input
								v-if="f.type === 'number'"
								:class="su.input"
								type="number"
								:min="f.min"
								:max="f.max"
								:step="f.step ?? 0.01"
								:value="(s.options?.[f.key] as number | string) ?? ''"
								@input="
									(e) => {
										const raw = (e.target as HTMLInputElement).value
										setOptionField(
											i,
											f.key,
											raw === '' ? undefined : Number(raw),
										)
									}
								" />

							<input
								v-else-if="f.type === 'text'"
								:class="su.input"
								type="text"
								:value="(s.options?.[f.key] as string) ?? ''"
								@input="
									(e) =>
										setOptionField(
											i,
											f.key,
											(e.target as HTMLInputElement).value,
										)
								" />

							<textarea
								v-else-if="f.type === 'longText'"
								:class="[su.textarea, 'min-h-[70px]']"
								:value="(s.options?.[f.key] as string) ?? ''"
								@input="
									(e) =>
										setOptionField(
											i,
											f.key,
											(e.target as HTMLTextAreaElement).value,
										)
								" />

							<select
								v-else-if="f.type === 'select'"
								:class="su.select"
								:value="(s.options?.[f.key] as string) ?? ''"
								@change="
									(e) =>
										setOptionField(
											i,
											f.key,
											(e.target as HTMLSelectElement).value,
										)
								">
								<option
									v-for="c in f.choices"
									:key="c.value"
									:value="c.value">
									{{ c.label }}
								</option>
							</select>

							<p v-if="f.help" class="text-xs text-zinc-500 mt-1">{{ f.help }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Reinforcement messages -->
		<div class="grid md:grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
			<div>
				<label :class="su.label">Success message</label>
				<input
					:class="su.input"
					:value="behavior.success?.message ?? ''"
					placeholder="Well done."
					@input="
						(e) =>
							write('success', {
								enabled: true,
								message: (e.target as HTMLInputElement).value,
							})
					" />
			</div>
			<div>
				<label :class="su.label">Fail message</label>
				<input
					:class="su.input"
					:value="behavior.fail?.message ?? ''"
					placeholder="Try again."
					@input="
						(e) =>
							write('fail', {
								enabled: true,
								message: (e.target as HTMLInputElement).value,
							})
					" />
			</div>
		</div>
	</div>
</template>
