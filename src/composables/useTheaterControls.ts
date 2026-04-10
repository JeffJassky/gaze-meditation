import { ref, watch } from 'vue'

/**
 * UI chrome visibility — auto-hiding transport controls.
 *
 * Owns: controlsVisible, menu/hover state, auto-hide timer.
 * No service dependencies.
 */
export function useTheaterControls() {
	const controlsVisible = ref(false)
	const isMenuOpen = ref(false)
	const isHoveringControls = ref(false)
	const controlsTimer = ref<number | null>(null)

	function showControls() {
		controlsVisible.value = true
		if (controlsTimer.value) clearTimeout(controlsTimer.value)

		if (!isMenuOpen.value && !isHoveringControls.value) {
			controlsTimer.value = window.setTimeout(() => {
				if (!isMenuOpen.value && !isHoveringControls.value) {
					controlsVisible.value = false
				}
			}, 5000)
		}
	}

	watch([isMenuOpen, isHoveringControls], ([menuOpen, hovering]) => {
		if (menuOpen || hovering) {
			controlsVisible.value = true
			if (controlsTimer.value) clearTimeout(controlsTimer.value)
		} else {
			showControls()
		}
	})

	return {
		controlsVisible,
		isMenuOpen,
		isHoveringControls,
		showControls,
	}
}
