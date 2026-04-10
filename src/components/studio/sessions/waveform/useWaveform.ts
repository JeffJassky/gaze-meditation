import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.esm.js'
import type { SceneBlock } from '@shared/types'
import {
  MIN_REGION_DURATION,
  REGION_COLOR,
  REGION_ACTIVE_COLOR,
  WAVEFORM_HEIGHT,
} from './constants'

export interface UseWaveformOptions {
  container: Ref<HTMLElement | null>
  audioUrl: Ref<string | null>
  scenes: Ref<SceneBlock[]>
  selectedId: Ref<string | null>
  onSelect: (id: string) => void
}

export function useWaveform(options: UseWaveformOptions) {
  const { container, audioUrl, scenes, selectedId, onSelect } = options

  const isReady = ref(false)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const decodedBuffer = ref<AudioBuffer | null>(null)

  let ws: WaveSurfer | null = null
  let regions: RegionsPlugin | null = null
  // Suppress model writes while we're programmatically syncing regions.
  let syncing = false

  function init() {
    if (!container.value) return
    destroy()

    regions = RegionsPlugin.create()

    ws = WaveSurfer.create({
      container: container.value,
      height: WAVEFORM_HEIGHT,
      waveColor: '#52525b',     // zinc-600
      progressColor: '#a1a1aa', // zinc-400
      cursorColor: '#38bdf8',   // sky-400
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      minPxPerSec: 1,
      plugins: [
        regions,
        ZoomPlugin.create({
          scale: 0.2,
          maxZoom: 500,
          exponentialZooming: true,
        }),
      ],
    })

    ws.on('ready', () => {
      isReady.value = true
      duration.value = ws!.getDuration()
      decodedBuffer.value = ws!.getDecodedData()

      // no overflow hacks needed — labels/pills rendered as Vue overlay

      syncRegionsFromScenes()
    })

    ws.on('timeupdate', (t) => {
      currentTime.value = t
    })

    ws.on('play', () => { isPlaying.value = true })
    ws.on('pause', () => { isPlaying.value = false })

    // Region interaction events.
    // On click: select the scene AND move the playhead to the click position.
    // stopPropagation prevents wavesurfer's own seek, so we seek manually.
    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation()
      onSelect(region.id)
      // Compute click position as a fraction of the waveform width.
      const wrapper = container.value
      if (wrapper && ws) {
        const rect = wrapper.getBoundingClientRect()
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        ws.seekTo(fraction)
      }
    })

    regions.on('region-updated', (region: Region) => {
      if (syncing) return
      const idx = scenes.value.findIndex((s) => s.id === region.id)
      if (idx < 0) return

      const oldRegion = scenes.value[idx]!.region
      if (!oldRegion) return

      let { start, end } = region

      // Determine which edge(s) moved by comparing against the pre-drag state.
      const startMoved = Math.abs(start - oldRegion.start) > 0.001
      const endMoved = Math.abs(end - oldRegion.end) > 0.001

      // Clamp to audio bounds.
      if (start < 0) start = 0
      if (duration.value > 0 && end > duration.value) end = duration.value

      syncing = true

      // Left edge moved → drag the boundary with the previous scene.
      if (startMoved && idx > 0) {
        const prevScene = scenes.value[idx - 1]!
        if (prevScene.region) {
          // Don't let the boundary crush the previous scene below minimum.
          const minPrevEnd = prevScene.region.start + MIN_REGION_DURATION
          if (start < minPrevEnd) start = minPrevEnd
          prevScene.region = { start: prevScene.region.start, end: start }
          // Update the wavesurfer region for the neighbour.
          const prevWsRegion = regions!.getRegions().find((r) => r.id === prevScene.id)
          if (prevWsRegion) {
            prevWsRegion.setOptions({ end: start })
            styleRegionElement(prevWsRegion, prevScene.id === selectedId.value)
          }
        }
      }

      // Right edge moved → drag the boundary with the next scene.
      if (endMoved && idx < scenes.value.length - 1) {
        const nextScene = scenes.value[idx + 1]!
        if (nextScene.region) {
          // Don't let the boundary crush the next scene below minimum.
          const maxNextStart = nextScene.region.end - MIN_REGION_DURATION
          if (end > maxNextStart) end = maxNextStart
          nextScene.region = { start: end, end: nextScene.region.end }
          const nextWsRegion = regions!.getRegions().find((r) => r.id === nextScene.id)
          if (nextWsRegion) {
            nextWsRegion.setOptions({ start: end })
            styleRegionElement(nextWsRegion, nextScene.id === selectedId.value)
          }
        }
      }

      // Enforce minimum width on the dragged region itself.
      if (end - start < MIN_REGION_DURATION) {
        if (startMoved) start = end - MIN_REGION_DURATION
        else end = start + MIN_REGION_DURATION
      }

      // Apply final clamped values back to the dragged region.
      if (start !== region.start || end !== region.end) {
        region.setOptions({ start, end })
      }
      styleRegionElement(region, region.id === selectedId.value)

      scenes.value[idx]!.region = { start, end }
      syncing = false
    })

    if (audioUrl.value) {
      ws.load(audioUrl.value)
    }
  }

  function destroy() {
    ws?.destroy()
    ws = null
    regions = null
    isReady.value = false
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    decodedBuffer.value = null
  }

  /**
   * Rebuild all wavesurfer regions from the current scene data.
   * Called after load, undo/redo, auto-split, etc.
   */
  function styleRegionElement(region: Region, active: boolean) {
    const el = region.element
    if (!el) return

    el.style.border = active
      ? '2px solid hsla(200, 60%, 65%, 0.5)'
      : '2px solid hsla(0, 0%, 40%, 0.25)'
    el.style.borderRadius = '10px'
    el.style.boxSizing = 'border-box'
    el.style.backgroundColor = active ? REGION_ACTIVE_COLOR : REGION_COLOR
    el.style.outline = 'none'
    el.style.overflow = 'visible'

    // Hide wavesurfer's default resize handle borders — they clash with ours.
    el.querySelectorAll<HTMLElement>('[part*="region-handle"]').forEach((h) => {
      h.style.border = 'none'
    })
  }

  function syncRegionsFromScenes() {
    if (!regions) return
    syncing = true
    regions.clearRegions()
    scenes.value.forEach((scene) => {
      if (!scene.region) return
      const active = scene.id === selectedId.value
      const region = regions!.addRegion({
        id: scene.id,
        start: scene.region.start,
        end: scene.region.end,
        color: 'transparent',
        minLength: MIN_REGION_DURATION,
        drag: true,
        resize: true,
      })
      styleRegionElement(region, active)
    })
    syncing = false
  }

  /**
   * Update region highlights when the selected scene changes, without
   * tearing down and recreating every region.
   */
  function updateRegionHighlights() {
    if (!regions) return
    const allRegions = regions.getRegions()
    allRegions.forEach((region) => {
      const active = region.id === selectedId.value
      styleRegionElement(region, active)
    })
  }

  // --- Playback controls ---------------------------------------------------

  function play() { ws?.play() }
  function pause() { ws?.pause() }
  function togglePlayback() { ws?.playPause() }
  function seekTo(seconds: number) {
    if (!ws || duration.value === 0) return
    ws.seekTo(Math.max(0, Math.min(1, seconds / duration.value)))
  }

  // --- Watchers ------------------------------------------------------------

  // Re-load audio when URL changes.
  watch(audioUrl, (url) => {
    if (!ws) return
    isReady.value = false
    if (url) ws.load(url)
    else ws.empty()
  })

  // Highlight swap on selection change.
  watch(selectedId, () => updateRegionHighlights())

  // Re-sync regions when scene regions change externally (undo, auto-split).
  watch(
    () => scenes.value.map((s) => `${s.id}:${s.region?.start ?? ''}:${s.region?.end ?? ''}`).join('|'),
    () => {
      if (!syncing) syncRegionsFromScenes()
    },
  )

  // Init when the container element mounts.
  watch(container, (el) => {
    if (el) init()
  }, { immediate: true })

  onBeforeUnmount(() => destroy())

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    decodedBuffer,
    play,
    pause,
    togglePlayback,
    seekTo,
    syncRegionsFromScenes,
  }
}
