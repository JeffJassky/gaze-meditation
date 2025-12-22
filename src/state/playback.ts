import { ref } from 'vue'

export const playbackSpeed = ref(1.0)

export const setPlaybackSpeed = (speed: number) => {
  playbackSpeed.value = speed
}

