import { reactive } from 'vue'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
	id: string
	type: NotificationType
	message: string
	/** Auto-dismiss after this many ms. 0 = sticky. Default: 5000. */
	duration: number
}

/** Global reactive notification queue. */
const notifications = reactive<Notification[]>([])

let nextId = 0

function push(type: NotificationType, message: string, duration = 5000): string {
	const id = `n_${++nextId}`
	notifications.push({ id, type, message, duration })

	if (duration > 0) {
		setTimeout(() => dismiss(id), duration)
	}
	return id
}

function dismiss(id: string) {
	const idx = notifications.findIndex(n => n.id === id)
	if (idx !== -1) notifications.splice(idx, 1)
}

/**
 * Global notification helpers.
 *
 * Usage from any composable, service, or component:
 *   import { notify } from '@/composables/useNotifications'
 *   notify.error('Session save failed — your data is cached locally.')
 */
export const notify = {
	info: (msg: string, duration?: number) => push('info', msg, duration),
	success: (msg: string, duration?: number) => push('success', msg, duration),
	warning: (msg: string, duration?: number) => push('warning', msg, duration),
	error: (msg: string, duration?: number) => push('error', msg, duration ?? 8000),
	dismiss,
}

/**
 * Returns the reactive notification list for rendering.
 * Used by AppNotifications.vue — most callers should use `notify` instead.
 */
export function useNotifications() {
	return { notifications, dismiss }
}
