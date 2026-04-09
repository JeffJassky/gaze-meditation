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
	failBehavior?: 'pause' | 'reset'
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

function addSuggestion(type: string = 'head:still') {
	const def = BEHAVIOR_BY_TYPE[type]
	// Hold behaviors need a default hold time; trigger behaviors leave
	// the timeout empty so they wait indefinitely until the writer sets
	// one. Stored in milliseconds to match existing program data.
	const duration = def?.kind === 'hold' ? 5000 : undefined
	write('suggestions', [
		...suggestions.value,
		{
			type,
			duration,
			options: defaultOptionsFor(type),
		},
	])
}

// Display/input helpers: the form shows seconds for friendliness, the
// stored value is milliseconds so the runtime (and existing program data)
// don't need to change.
function msToSeconds(ms: number | undefined): number | '' {
	if (ms === undefined || ms === null || Number.isNaN(ms)) return ''
	return ms / 1000
}
function secondsToMs(raw: string): number | undefined {
	if (raw === '') return undefined
	const n = Number(raw)
	if (!Number.isFinite(n)) return undefined
	return Math.round(n * 1000)
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
 * defaults and reset the duration to match the new behavior's kind
 * (hold behaviors get a sensible 5s default, trigger behaviors go to
 * no-timeout by default). Keeping stale data from the previous behavior
 * would lead to fields that don't match the current form.
 */
function changeType(index: number, newType: string) {
	const def = BEHAVIOR_BY_TYPE[newType]
	updateSuggestion(index, {
		duration: def?.kind === 'hold' ? 5000 : undefined,
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
	<div>
		<div class="mb-4">
			<div v-if="suggestions.length === 0" class="text-xs text-zinc-500 mb-3">
				None. Without any, the scene runs for a fixed duration.
			</div>

			<div v-else class="grid gap-3">
				<div
					v-for="(s, i) in suggestions"
					:key="i"
					class="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
					<!-- Type picker -->
					<div class="flex items-center gap-3">
						<label :class="[su.label, '!mb-0 flex-1']">Behavior</label>
						<select
							:class="[su.select, 'w-44']"
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

					<!-- Description of the selected behavior -->
					<p v-if="defOf(s.type)" class="text-xs text-zinc-500">
						{{ defOf(s.type)!.description }}
					</p>

					<div class="flex items-center gap-3">
						<label :class="[su.label, '!mb-0 flex-1']">
							{{ defOf(s.type)?.kind === 'trigger' ? 'Time limit (s)' : 'Hold for (s)' }}
						</label>
						<input
							:class="[su.input, 'w-16 text-right']"
							type="number"
							min="0"
							step="0.5"
							:placeholder="defOf(s.type)?.kind === 'trigger' ? '—' : ''"
							:value="msToSeconds(s.duration)"
							@input="
								(e) =>
									updateSuggestion(i, {
										duration: secondsToMs(
											(e.target as HTMLInputElement).value,
										),
									})
							" />
					</div>

					<p
						v-if="defOf(s.type)?.kind === 'trigger'"
						class="text-[11px] text-zinc-500 -mt-1">
						Leave empty to wait indefinitely for the action.
					</p>

					<div
						v-if="defOf(s.type)?.kind === 'hold'"
						class="flex items-center gap-3">
						<label :class="[su.label, '!mb-0 flex-1']">On failure</label>
						<select
							:class="[su.select, 'w-44']"
							:value="s.failBehavior ?? 'pause'"
							@change="
								(e) =>
									updateSuggestion(i, {
										failBehavior: (e.target as HTMLSelectElement).value as
											| 'pause'
											| 'reset',
									})
							">
							<option value="pause">Pause timer</option>
							<option value="reset">Reset timer</option>
						</select>
					</div>

					<!-- Schema-driven option fields -->
					<template v-if="defOf(s.type) && defOf(s.type)!.fields.length > 0">
						<div
							v-for="f in defOf(s.type)!.fields"
							:key="f.key"
							class="flex items-start gap-3">
							<div class="flex-1 min-w-0">
								<label :class="[su.label, '!mb-0']">{{ f.label }}</label>
								<p v-if="f.help" class="text-[11px] text-zinc-500 mt-0.5">
									{{ f.help }}
								</p>
							</div>

							<input
								v-if="f.type === 'number'"
								:class="[su.input, 'w-16 text-right shrink-0']"
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
								:class="[su.input, 'w-44 shrink-0']"
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
								:class="[su.textarea, 'w-44 min-h-[60px] shrink-0']"
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
								:class="[su.select, 'w-44 shrink-0']"
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
						</div>
					</template>

					<button
						:class="su.btnDanger"
						class="self-end mt-1"
						type="button"
						@click="removeSuggestion(i)">
						Remove
					</button>
				</div>
			</div>

			<button
				:class="[su.btnGhost, 'w-full mt-3']"
				type="button"
				@click="addSuggestion()">
				+ Add behavior
			</button>
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
