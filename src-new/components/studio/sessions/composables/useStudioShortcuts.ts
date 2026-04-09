import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Global keybinding layer for the studio editor.
 *
 * Save and undo/redo always fire — even from inside a textarea — because
 * those are muscle-memory shortcuts users expect to work everywhere. The
 * remaining navigation/CRUD shortcuts gate on focus so they don't fight
 * the caret while typing.
 */
export interface ShortcutHandlers {
	onSave: () => void
	onUndo: () => void
	onRedo: () => void
	onNext: () => void
	onPrev: () => void
	onDuplicate: () => void
	onDelete: () => void
	onNewScene: () => void
	onToggleMeta: () => void
}

function isEditable(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false
	const tag = el.tagName
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
	if (el.isContentEditable) return true
	return false
}

export function useStudioShortcuts(handlers: ShortcutHandlers) {
	function onKey(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey
		const key = e.key.toLowerCase()
		const inEditable = isEditable(e.target)

		// Always-available shortcuts (work even while typing).
		if (mod && key === 's') {
			e.preventDefault()
			handlers.onSave()
			return
		}
		if (mod && key === 'z' && !e.shiftKey) {
			e.preventDefault()
			handlers.onUndo()
			return
		}
		if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
			e.preventDefault()
			handlers.onRedo()
			return
		}

		// Editable-gated shortcuts.
		if (inEditable) return

		if (mod && e.key === 'Enter') {
			e.preventDefault()
			handlers.onNewScene()
			return
		}
		if (mod && key === 'd') {
			e.preventDefault()
			handlers.onDuplicate()
			return
		}
		if (mod && key === 'i') {
			e.preventDefault()
			handlers.onToggleMeta()
			return
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			handlers.onNext()
			return
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			handlers.onPrev()
			return
		}
		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault()
			handlers.onDelete()
			return
		}
	}

	onMounted(() => window.addEventListener('keydown', onKey))
	onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
