import { ref } from 'vue'
import type { SceneBlock } from '@/services/sessions'

/**
 * Soft-delete queue with an undo window.
 *
 * The actual splice happens immediately at the call site so the UI reflects
 * the deletion. We just track the removed scene + its original index here so
 * an Undo click within the window can re-insert it. When the timer fires we
 * simply drop the entry — the splice was already permanent.
 */
export interface PendingDelete {
	id: string
	scene: SceneBlock
	index: number
	createdAt: number
}

const UNDO_WINDOW_MS = 6000

export function useSoftDelete(
	restore: (scene: SceneBlock, index: number) => void,
) {
	const pending = ref<PendingDelete[]>([])
	const timers = new Map<string, ReturnType<typeof setTimeout>>()

	function enqueue(scene: SceneBlock, index: number) {
		const entry: PendingDelete = {
			id: crypto.randomUUID(),
			scene,
			index,
			createdAt: Date.now(),
		}
		pending.value = [...pending.value, entry]
		const timer = setTimeout(() => commit(entry.id), UNDO_WINDOW_MS)
		timers.set(entry.id, timer)
	}

	function commit(id: string) {
		const timer = timers.get(id)
		if (timer) {
			clearTimeout(timer)
			timers.delete(id)
		}
		pending.value = pending.value.filter((p) => p.id !== id)
	}

	function undo(id: string) {
		const entry = pending.value.find((p) => p.id === id)
		if (!entry) return
		commit(id)
		restore(entry.scene, entry.index)
	}

	return { pending, enqueue, undo, commit, UNDO_WINDOW_MS }
}
