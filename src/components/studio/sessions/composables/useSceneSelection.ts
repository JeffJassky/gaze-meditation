import { computed, ref, watchEffect, type Ref } from 'vue'
import type { SceneBlock } from '@/api/sessions'

/**
 * Tracks which scene is currently selected in the three-pane editor.
 *
 * Keeps the selection valid across scene list mutations: auto-selects the
 * first scene when nothing is selected, and falls back to the first scene
 * when the currently selected id disappears (e.g. after a delete).
 */
export function useSceneSelection(scenes: Ref<SceneBlock[]>) {
	const selectedId = ref<string | null>(null)
	/** True when the user explicitly deselected — prevents auto-reselect. */
	const userDeselected = ref(false)

	watchEffect(() => {
		if (!scenes.value.length) {
			selectedId.value = null
			return
		}
		// If user explicitly deselected, don't auto-select
		if (userDeselected.value && selectedId.value === null) return
		// Auto-select first scene only when current selection is stale (deleted)
		if (!scenes.value.find((s) => s.id === selectedId.value)) {
			selectedId.value = scenes.value[0]?.id ?? null
		}
	})

	const selectedIndex = computed(() =>
		scenes.value.findIndex((s) => s.id === selectedId.value),
	)
	const selectedScene = computed(() =>
		selectedIndex.value >= 0 ? scenes.value[selectedIndex.value] : null,
	)

	function select(id: string) {
		userDeselected.value = false
		selectedId.value = id
	}
	function selectIndex(i: number) {
		if (!scenes.value.length) return
		const clamped = Math.max(0, Math.min(i, scenes.value.length - 1))
		selectedId.value = scenes.value[clamped]?.id ?? null
	}
	function next() {
		selectIndex(selectedIndex.value + 1)
	}
	function prev() {
		selectIndex(selectedIndex.value - 1)
	}

	function deselect() {
		userDeselected.value = true
		selectedId.value = null
	}

	return { selectedId, selectedIndex, selectedScene, select, selectIndex, next, prev, deselect }
}
