import { ref, watch, type Ref } from 'vue'
import type { SceneBlock } from '@shared/types'
import { textToHash } from '@/utils/voiceCrypto'
import { assetsApi } from '@/api/assets'
import { assetUrl } from '@/utils/assetUrl'

export interface ScenePeakData {
  sceneId: string
  peaks: Float32Array
  duration: number
}

/**
 * Resolves cached voice audio for each scene and extracts peak data
 * for waveform rendering. Results are cached by scene id + voice text
 * so re-renders don't re-fetch.
 */
export function useScenePeaks(scenes: Ref<SceneBlock[]>) {
  const peaksMap = ref<Map<string, ScenePeakData>>(new Map())
  const cache = new Map<string, ScenePeakData>() // keyed by hash
  let audioCtx: OfflineAudioContext | null = null

  function getAudioContext() {
    if (!audioCtx) audioCtx = new OfflineAudioContext(1, 1, 44100)
    return audioCtx
  }

  async function extractPeaks(buffer: AudioBuffer, numBins: number): Promise<Float32Array> {
    const data = buffer.getChannelData(0)
    const binSize = Math.floor(data.length / numBins) || 1
    const peaks = new Float32Array(numBins)
    for (let i = 0; i < numBins; i++) {
      let max = 0
      const start = i * binSize
      const end = Math.min(start + binSize, data.length)
      for (let j = start; j < end; j++) {
        const abs = Math.abs(data[j] ?? 0)
        if (abs > max) max = abs
      }
      peaks[i] = max
    }
    return peaks
  }

  async function resolveScene(scene: SceneBlock) {
    const voice = scene.config?.voice
    if (!voice) return
    const text = Array.isArray(voice) ? voice.join(' ') : voice
    if (!text.trim()) return

    const hash = await textToHash(text)

    // Check memory cache first.
    if (cache.has(hash)) {
      const cached = cache.get(hash)!
      peaksMap.value.set(scene.id, { ...cached, sceneId: scene.id })
      return
    }

    try {
      const asset = await assetsApi.byVoiceHash(hash)
      if (!asset) return

      const url = assetUrl(asset.key)
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) return

      const arrayBuf = await res.arrayBuffer()
      const ctx = getAudioContext()
      const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0))

      const peaks = await extractPeaks(audioBuf, 200)
      const data: ScenePeakData = { sceneId: scene.id, peaks, duration: audioBuf.duration }

      cache.set(hash, data)
      const next = new Map(peaksMap.value)
      next.set(scene.id, data)
      peaksMap.value = next
    } catch (e) {
      // Scene audio not available yet — that's fine, no peaks to show.
    }
  }

  async function resolveAll() {
    await Promise.allSettled(scenes.value.map(resolveScene))
  }

  // Re-resolve when scenes change.
  watch(
    () => scenes.value.map((s) => {
      const v = s.config?.voice
      return `${s.id}:${Array.isArray(v) ? v.join(' ') : (v ?? '')}`
    }).join('|'),
    () => resolveAll(),
    { immediate: true },
  )

  return { peaksMap }
}
