import { computed, onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Tracks whether a reactive source has diverged from its last-saved state.
 *
 * Uses a cheap JSON-stringify comparison — plenty fast for session/playlist-
 * sized payloads and avoids a lot of ceremony.
 *
 * Returns:
 *   - `dirty`      — computed boolean, true when current !== snapshot
 *   - `markClean`  — call after a successful save to re-snapshot
 *
 * Automatically registers a `beforeunload` guard that prompts when dirty.
 */
export function useDirtyTracking<T>(source: Ref<T | null>) {
	const snapshot: Ref<string> = { value: '' } as Ref<string>

	const dirty = computed(() =>
		source.value ? JSON.stringify(source.value) !== snapshot.value : false,
	)

	function markClean() {
		snapshot.value = JSON.stringify(source.value)
	}

	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty.value) {
			e.preventDefault()
			e.returnValue = ''
		}
	}

	onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
	onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

	return { dirty, markClean }
}
