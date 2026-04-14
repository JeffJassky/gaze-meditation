<script setup lang="ts">
import { ref } from 'vue'
import type { Session } from '@/api/sessions'
import { Scene } from '@/core/Scene'

/**
 * Editor-side permission gate for the live preview's biofeedback mode.
 *
 * When the writer clicks "enable biofeedback" in the preview transport, the
 * wrapper mounts this component instead of (or over) the scaled Theater.
 * It scans the session for required devices, shows a clear explanation at
 * editor-native size (not squashed inside the 320px preview box), and
 * calls `getUserMedia` to prime the permission grants before Theater is
 * told `enableBiofeedback = true`.
 *
 * By the time Theater mounts with biofeedback enabled, the browser's
 * permissions are already in the 'granted' state, so Theater's internal
 * permission UI never runs.
 */
const props = defineProps<{ session: Session }>()
const emit = defineEmits<{
	granted: []
	cancel: []
}>()

// ──────────────────────────────────────────────────────────────────────────
// Scan required devices from the session's behavior suggestions
// ──────────────────────────────────────────────────────────────────────────
interface DeviceRequirements {
	camera: boolean
	microphone: boolean
	accelerometer: boolean
}

function scanRequirements(): DeviceRequirements {
	const req: DeviceRequirements = {
		camera: false,
		microphone: false,
		accelerometer: false,
	}
	for (const block of props.session.scenes) {
		const suggestions = (block.config as any)?.behavior?.suggestions ?? []
		for (const sug of suggestions) {
			const BehaviorClass = Scene.getBehaviorClass(sug.type)
			if (!BehaviorClass) continue
			const devices: string[] = (BehaviorClass as any).requiredDevices ?? []
			if (devices.includes('camera')) req.camera = true
			if (devices.includes('microphone')) req.microphone = true
			if (devices.includes('accelerometer')) req.accelerometer = true
		}
	}
	return req
}

const requirements = ref<DeviceRequirements>(scanRequirements())
const hasAnyRequirement =
	requirements.value.camera ||
	requirements.value.microphone ||
	requirements.value.accelerometer

// ──────────────────────────────────────────────────────────────────────────
// Permission request flow
// ──────────────────────────────────────────────────────────────────────────
const requesting = ref(false)
const errorMessage = ref<string | null>(null)

async function requestAccess() {
	requesting.value = true
	errorMessage.value = null
	try {
		const constraints: MediaStreamConstraints = {}
		if (requirements.value.camera) constraints.video = true
		if (requirements.value.microphone) constraints.audio = true

		if (constraints.video || constraints.audio) {
			const stream = await navigator.mediaDevices.getUserMedia(constraints)
			// Release the preview stream immediately — the actual devices
			// (camera / microphone) will open their own streams when
			// Theater initializes with biofeedback enabled. We only
			// needed the user gesture + permission grant here.
			stream.getTracks().forEach((t) => t.stop())
		}
		// Accelerometer (iOS) needs a separate flow and isn't wired here.
		// For now, we surface it in the list but don't block on it — the
		// writer will get a separate gesture prompt inside Theater if we
		// re-enable that path later.

		emit('granted')
	} catch (e) {
		const err = e as Error
		if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
			errorMessage.value =
				'Access was denied. Check your browser settings and try again.'
		} else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
			errorMessage.value = 'No matching devices were found on this machine.'
		} else {
			errorMessage.value = err.message || 'Unable to access the requested devices.'
		}
	} finally {
		requesting.value = false
	}
}

// If the session has no behaviors that need devices, enabling is a no-op.
// Emit granted immediately so the wrapper flips the toggle without UI.
if (!hasAnyRequirement) {
	emit('granted')
}
</script>

<template>
	<div class="p-4 text-sm">
		<h3 class="text-content font-semibold mb-1">Enable biofeedback</h3>
		<p class="text-content-secondary text-xs leading-relaxed mb-3">
			This session uses behaviors that need hardware access. Grant permission
			below to test them in the preview.
		</p>

		<ul class="space-y-1 mb-4 text-xs">
			<li
				v-if="requirements.camera"
				class="flex items-center gap-2 text-content-secondary">
				<span class="w-1.5 h-1.5 rounded-full bg-success" />
				Camera — face tracking, blink &amp; gaze behaviors
			</li>
			<li
				v-if="requirements.microphone"
				class="flex items-center gap-2 text-content-secondary">
				<span class="w-1.5 h-1.5 rounded-full bg-info" />
				Microphone — speech behaviors
			</li>
			<li
				v-if="requirements.accelerometer"
				class="flex items-center gap-2 text-content-secondary">
				<span class="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
				Motion — tilt &amp; impact behaviors
			</li>
		</ul>

		<div
			v-if="errorMessage"
			class="text-xs text-danger mb-3 p-2 rounded bg-danger/10 border border-danger/30">
			{{ errorMessage }}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="px-3 py-1.5 text-xs rounded bg-content text-surface-secondary font-medium hover:bg-content disabled:opacity-50"
				:disabled="requesting"
				@click="requestAccess">
				{{ requesting ? 'Requesting…' : 'Grant access' }}
			</button>
			<button
				type="button"
				class="px-3 py-1.5 text-xs rounded text-content-secondary hover:text-content"
				:disabled="requesting"
				@click="emit('cancel')">
				Cancel
			</button>
		</div>
	</div>
</template>
