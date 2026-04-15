import { computed, ref, watch } from 'vue'
import { Scene } from '@/core/Scene'
import { camera, microphone, accelerometer } from '@/devices'
import type { Session } from '../api/sessions'

/**
 * Device lifecycle for biofeedback hardware: camera, microphone, accelerometer.
 *
 * Owns: camera, microphone, accelerometer singletons.
 * Does NOT own audio (that's useTheaterAudio) or scene progression.
 */
export function useTheaterBiofeedback(
	biofeedbackEnabled: { readonly value: boolean },
) {
	const showPermissionRequest = ref(false)
	const pendingPermissions = ref({
		camera: false,
		microphone: false,
		accelerometer: false,
		haptics: false,
	})

	const permissionLabel = computed(() => {
		const list: string[] = []
		if (pendingPermissions.value.camera) list.push('Camera')
		if (pendingPermissions.value.microphone) list.push('Microphone')
		if (pendingPermissions.value.accelerometer) list.push('GAZE Motion Device')
		if (pendingPermissions.value.haptics) list.push('Haptic Device')

		if (list.length === 0) return 'Devices'
		if (list.length === 1) return list[0]
		if (list.length === 2) return list.join(' & ')
		return list.slice(0, -1).join(', ') + ' & ' + list[list.length - 1]
	})

	/**
	 * Scan a session's scenes for required hardware.
	 * Returns which device categories are needed.
	 */
	function detectRequiredDevices(session: Session) {
		let needsCamera = false
		let needsMicrophone = false
		let needsAccelerometer = false
		const needsHaptics = session.scenes.some(s => (s.config.haptics?.events?.length ?? 0) > 0)

		if (biofeedbackEnabled.value) {
			for (const s of session.scenes) {
				for (const sig of s.config.behavior?.suggestions ?? []) {
					const BehaviorClass = Scene.getBehaviorClass(sig.type)
					if (!BehaviorClass) continue
					const devices: string[] = (BehaviorClass as any).requiredDevices || []
					if (devices.includes('camera')) needsCamera = true
					if (devices.includes('microphone')) needsMicrophone = true
					if (devices.includes('accelerometer')) needsAccelerometer = true
				}
			}
		}

		return { needsCamera, needsMicrophone, needsAccelerometer, needsHaptics }
	}

	/**
	 * Check permissions and show the permission gate if anything is missing.
	 * Returns a promise that resolves once the user has granted access
	 * (or immediately if nothing is needed).
	 */
	async function requestPermissions(needs: {
		needsCamera: boolean
		needsMicrophone: boolean
		needsAccelerometer: boolean
		needsHaptics?: boolean
	}) {
		if (!needs.needsCamera && !needs.needsMicrophone && !needs.needsAccelerometer && !needs.needsHaptics) return

		try {
			const camQuery = needs.needsCamera
				? navigator.permissions.query({ name: 'camera' as any })
				: Promise.resolve(null)
			const micQuery = needs.needsMicrophone
				? navigator.permissions.query({ name: 'microphone' as any })
				: Promise.resolve(null)
			const accelGranted = needs.needsAccelerometer
				? await accelerometer.isAccessGranted()
				: true

			const [camStatus, micStatus] = await Promise.all([camQuery, micQuery])

			const missingCam = camStatus?.state === 'prompt'
			const missingMic = micStatus?.state === 'prompt'
			const missingAccel = needs.needsAccelerometer && !accelGranted
			const missingHaptics = !!needs.needsHaptics

			if (missingCam || missingMic || missingAccel || missingHaptics) {
				pendingPermissions.value = {
					camera: !!missingCam,
					microphone: !!missingMic,
					accelerometer: missingAccel,
					haptics: missingHaptics,
				}
				showPermissionRequest.value = true

				await new Promise<void>(resolve => {
					const unwatch = watch(showPermissionRequest, val => {
						if (!val) {
							unwatch()
							resolve()
						}
					})
				})
			}
		} catch (e) {
			console.warn('Permissions Query API not supported', e)
		}
	}

	/** Callback invoked during the Grant Access user gesture for haptic scanning. */
	let _onGrantHaptics: (() => Promise<void>) | null = null

	function setOnGrantHaptics(fn: () => Promise<void>) {
		_onGrantHaptics = fn
	}

	/** Handle the "Grant Access" button click. */
	async function handleGrantAccess() {
		if (pendingPermissions.value.accelerometer) {
			try {
				await accelerometer.requestAccess()
			} catch (e) {
				console.warn('Accelerometer access failed', e)
			}
		}
		// Haptic scan must happen inside this user gesture for Web Bluetooth
		if (pendingPermissions.value.haptics && _onGrantHaptics) {
			try {
				await _onGrantHaptics()
			} catch (e) {
				console.warn('Haptic device connection failed', e)
			}
		}
		showPermissionRequest.value = false
	}

	/**
	 * Initialize devices that are needed.
	 * Returns false if a required device failed and should abort.
	 */
	async function initDevices(
		needs: { needsCamera: boolean; needsMicrophone: boolean },
		embedded: boolean,
	): Promise<boolean> {
		if (needs.needsMicrophone) {
			try {
				await microphone.start()
			} catch (e) {
				console.warn('Speech Initialization Failed', e)
				if (!embedded) return false
			}
		}

		if (needs.needsCamera) {
			try {
				await camera.start()
			} catch (e) {
				console.error('Camera Initialization Failed', e)
				if (!embedded) return false
			}
		}

		return true
	}

	/** Stop all hardware devices. */
	function stopDevices() {
		microphone.stop()
		camera.stop()
		accelerometer.stop()
	}

	return {
		// Reactive state (read by template)
		showPermissionRequest,
		pendingPermissions,
		permissionLabel,

		// Methods
		detectRequiredDevices,
		requestPermissions,
		handleGrantAccess,
		setOnGrantHaptics,
		initDevices,
		stopDevices,
	}
}
