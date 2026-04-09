import { ref, watch, nextTick, computed, type Ref } from 'vue'
import type { Session } from '@/services/sessions'

/**
 * Ring-buffer undo/redo over JSON snapshots of the session document.
 *
 * Snapshotting the entire session is dirt cheap at session-sized payloads,
 * keeps history immune to nested mutation gotchas, and lets us reuse the
 * existing reactive write paths — no command pattern boilerplate.
 *
 * Writes are debounced so a burst of typing collapses into one history entry.
 * `suppress` shields the watcher from snapshotting the document we just
 * restored during undo/redo.
 */
const MAX = 100
const DEBOUNCE_MS = 400

export function useSceneHistory(session: Ref<Session | null>) {
	const past = ref<string[]>([])
	const future = ref<string[]>([])
	let suppress = false
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	function record() {
		debounceTimer = null
		if (!session.value) return
		const snap = JSON.stringify(session.value)
		if (past.value[past.value.length - 1] === snap) return
		past.value.push(snap)
		if (past.value.length > MAX) past.value.shift()
		future.value = []
	}

	watch(
		session,
		(s, prev) => {
			if (!s) {
				past.value = []
				future.value = []
				return
			}
			// Seed baseline when the session first loads.
			if (s && !prev) {
				past.value = [JSON.stringify(s)]
				future.value = []
				return
			}
			if (suppress) return
			if (debounceTimer) clearTimeout(debounceTimer)
			debounceTimer = setTimeout(record, DEBOUNCE_MS)
		},
		{ deep: true },
	)

	function undo() {
		if (!session.value) return
		// Flush any pending debounced record so we don't lose the in-flight edit.
		if (debounceTimer) {
			clearTimeout(debounceTimer)
			record()
		}
		if (past.value.length < 2) return
		const current = past.value.pop()!
		future.value.push(current)
		const prev = past.value[past.value.length - 1]
		suppress = true
		session.value = JSON.parse(prev)
		nextTick(() => {
			suppress = false
		})
	}

	function redo() {
		if (future.value.length === 0 || !session.value) return
		const next = future.value.pop()!
		past.value.push(next)
		suppress = true
		session.value = JSON.parse(next)
		nextTick(() => {
			suppress = false
		})
	}

	function reset() {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
			debounceTimer = null
		}
		if (!session.value) {
			past.value = []
			future.value = []
			return
		}
		past.value = [JSON.stringify(session.value)]
		future.value = []
	}

	const canUndo = computed(() => past.value.length > 1)
	const canRedo = computed(() => future.value.length > 0)

	return { undo, redo, reset, canUndo, canRedo }
}
