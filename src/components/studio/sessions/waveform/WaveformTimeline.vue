<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { SceneBlock } from '@shared/types'
import { SOUNDBOARD_SAMPLES_KEY } from '../soundboardSamplesKey'
import { useWaveform } from './useWaveform'
import { useScenePeaks } from './useScenePeaks'
import MiniWaveform from './MiniWaveform.vue'
import { detectSilence, splitRegionsFromSilence } from './detectSilence'
import {
  SILENCE_THRESHOLD_DB,
  SILENCE_MIN_DURATION,
  REGION_COLOR,
  REGION_ACTIVE_COLOR,
  ESTIMATED_WPM,
  DEFAULT_SCENE_DURATION,
  MIN_ESTIMATED_DURATION,
} from './constants'
import { BEHAVIOR_BY_TYPE } from '../behaviorCatalog'

const scenes = defineModel<SceneBlock[]>({ required: true })

const props = defineProps<{
  audioUrl: string | null
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  'update:duration': [seconds: number]
}>()

// --- Mode detection --------------------------------------------------------
// Master-audio mode: a single recording that scenes align to.
// Per-scene mode: no master audio — show individual scene blocks.
const isMasterMode = computed(() => !!props.audioUrl)

// --- Master-audio mode (wavesurfer) ----------------------------------------
const containerEl = ref<HTMLElement | null>(null)
const audioUrlRef = computed(() => props.audioUrl)
const selectedIdRef = computed(() => props.selectedId)

const {
  isReady,
  isPlaying,
  currentTime,
  duration,
  decodedBuffer,
  togglePlayback,
  syncRegionsFromScenes,
} = useWaveform({
  container: containerEl,
  audioUrl: audioUrlRef,
  scenes,
  selectedId: selectedIdRef,
  onSelect: (id) => emit('select', id),
})

watch(duration, (d) => {
  if (d > 0) emit('update:duration', d)
})

function autoSplit() {
  const buf = decodedBuffer.value
  if (!buf) return
  const gaps = detectSilence(buf, {
    thresholdDb: SILENCE_THRESHOLD_DB,
    minDuration: SILENCE_MIN_DURATION,
  })
  const regions = splitRegionsFromSilence(gaps, duration.value, scenes.value.length)
  regions.forEach((r, i) => {
    if (scenes.value[i]) scenes.value[i].region = r
  })
  syncRegionsFromScenes()
}

function clearRegions() {
  scenes.value.forEach((s) => { s.region = undefined })
  syncRegionsFromScenes()
}

function distributeEvenly() {
  const d = duration.value
  if (d <= 0 || scenes.value.length === 0) return
  const step = d / scenes.value.length
  scenes.value.forEach((s, i) => {
    s.region = { start: i * step, end: (i + 1) * step }
  })
  syncRegionsFromScenes()
}

// --- Per-scene mode --------------------------------------------------------

interface SoundboardEventDisplay {
  event: 'start' | 'stop'
  name: string
}

interface SceneTimelineBlock {
  id: string
  index: number
  label: string
  voiceText: string
  durationSec: number
  hasAudio: boolean
  behaviorLabels: string[]
  binauralHz: number | null
  soundboardEvents: SoundboardEventDisplay[]
  flexBasis: string // CSS percentage width
}

/** Estimate duration from voice text word count. */
function estimateDuration(scene: SceneBlock): number {
  // Explicit duration takes priority (stored as ms).
  if (scene.config.duration) return scene.config.duration / 1000

  // Estimate from voice/text content word count.
  const raw = scene.config.voice ?? scene.config.text
  const text = Array.isArray(raw) ? raw.join(' ') : (raw ?? '')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return DEFAULT_SCENE_DURATION

  return Math.max(MIN_ESTIMATED_DURATION, (words / ESTIMATED_WPM) * 60)
}

function hasAudio(scene: SceneBlock): boolean {
  const v = scene.config.voice
  if (!v) return false
  const text = Array.isArray(v) ? v.join(' ') : v
  return text.trim().length > 0
}

function voiceText(scene: SceneBlock): string {
  const v = scene.config?.voice
  if (!v) return ''
  return Array.isArray(v) ? v.join(' ') : v
}

function getBehaviorLabels(scene: SceneBlock): string[] {
  const sugs = scene.config?.behavior?.suggestions
  if (!sugs || sugs.length === 0) return []
  return sugs.map((s) => BEHAVIOR_BY_TYPE[s.type]?.label ?? s.type)
}

function getBinauralHz(scene: SceneBlock): number | null {
  const hz = scene.config?.audio?.binaural?.hertz
  if (typeof hz !== 'number' || !Number.isFinite(hz)) return null
  return hz
}

const soundboardSamples = inject(SOUNDBOARD_SAMPLES_KEY, computed(() => []))

function getSoundboardEvents(scene: SceneBlock): SoundboardEventDisplay[] {
  const evts = scene.config?.audio?.soundboard
  if (!evts || evts.length === 0) return []
  return evts.map((e) => {
    const sample = soundboardSamples.value.find((s) => s.id === e.id)
    const name = sample?.path
      ? (sample.path.split('/').pop() ?? sample.id).replace(/\.[^.]+$/, '')
      : e.id
    return { event: e.event as 'start' | 'stop', name }
  })
}

const sceneBlocks = computed<SceneTimelineBlock[]>(() => {
  const blocks = scenes.value.map((s, i) => {
    const peakData = peaksMap.value.get(s.id)
    return {
      id: s.id,
      index: i,
      label: s.label || `Scene ${i + 1}`,
      voiceText: voiceText(s),
      durationSec: peakData?.duration ?? estimateDuration(s),
      hasAudio: hasAudio(s) || !!peakData,
      behaviorLabels: getBehaviorLabels(s),
      binauralHz: getBinauralHz(s),
      soundboardEvents: getSoundboardEvents(s),
    }
  })
  const total = blocks.reduce((sum, b) => sum + b.durationSec, 0)
  return blocks.map((b) => ({
    ...b,
    flexBasis: total > 0 ? `${(b.durationSec / total) * 100}%` : `${100 / blocks.length}%`,
  }))
})

const totalPerSceneDuration = computed(() =>
  sceneBlocks.value.reduce((sum, b) => sum + b.durationSec, 0),
)

// Resolve cached voice audio peaks for per-scene waveform rendering.
const { peaksMap } = useScenePeaks(scenes)

function blockColor(active: boolean): string {
  return active ? REGION_ACTIVE_COLOR : REGION_COLOR
}

// --- Master-audio overlay data (pills + transcript positioned by region %) --
interface RegionOverlay {
  id: string
  leftPct: string
  widthPct: string
  voiceText: string
  behaviorLabels: string[]
  binauralHz: number | null
  soundboardEvents: SoundboardEventDisplay[]
}

const regionOverlays = computed<RegionOverlay[]>(() => {
  if (!isMasterMode.value || duration.value <= 0) return []
  return scenes.value
    .filter((s) => s.region)
    .map((s) => {
      const r = s.region!
      return {
        id: s.id,
        leftPct: `${(r.start / duration.value) * 100}%`,
        widthPct: `${((r.end - r.start) / duration.value) * 100}%`,
        voiceText: voiceText(s),
        behaviorLabels: getBehaviorLabels(s),
        binauralHz: getBinauralHz(s),
        soundboardEvents: getSoundboardEvents(s),
      }
    })
})

// --- Per-scene zoom --------------------------------------------------------
// 1.0 = fit all scenes in view, >1 = zoomed in (scrollable).
const perSceneZoom = ref(1)
const MIN_ZOOM = 1
const MAX_ZOOM = 8

function onPerSceneWheel(e: WheelEvent) {
  // Only zoom on pinch/ctrl+scroll (trackpad pinch sends ctrlKey).
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = -e.deltaY * 0.01
  perSceneZoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, perSceneZoom.value * (1 + delta)))
}

// --- Shared helpers --------------------------------------------------------

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

defineExpose({
  // Master mode
  isMasterMode,
  isReady,
  isPlaying,
  currentTime,
  duration,
  decodedBuffer,
  togglePlayback,
  distributeEvenly,
  autoSplit,
  clearRegions,
  // Per-scene mode
  totalPerSceneDuration,
  // Shared
  fmt,
})
</script>

<template>
  <div class="flex flex-col px-[10px] pb-[10px]">
    <!-- MASTER AUDIO MODE -->
    <template v-if="isMasterMode">
      <!-- Pills row (above waveform) -->
      <div v-if="regionOverlays.length" class="relative h-[16px] mb-1">
        <div
          v-for="ov in regionOverlays"
          :key="'pills-' + ov.id"
          class="absolute top-0 overflow-hidden pointer-events-none"
          :style="{ left: ov.leftPct, width: ov.widthPct }">
          <div
            v-if="ov.behaviorLabels.length || ov.binauralHz !== null || ov.soundboardEvents.length"
            class="flex gap-0.5 px-1">
            <span
              v-for="(bl, bi) in ov.behaviorLabels"
              :key="'b-' + bi"
              class="inline-flex items-center px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap bg-info/10 border border-info/30 text-info">
              {{ bl }}
            </span>
            <span
              v-if="ov.binauralHz !== null"
              class="inline-flex items-center px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap bg-brand/10 border border-brand/30 text-brand">
              {{ ov.binauralHz }} Hz
            </span>
            <span
              v-for="(ev, ei) in ov.soundboardEvents"
              :key="'sb-' + ei"
              class="inline-flex items-center gap-0.5 px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap"
              :class="ev.event === 'start'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-danger/10 border border-danger/30 text-danger'">
              <span class="text-[7px]">{{ ev.event === 'start' ? '&#9654;' : '&#9632;' }}</span>
              {{ ev.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Waveform -->
      <div ref="containerEl" class="relative w-full cursor-crosshair rounded" />

      <!-- Transcript row (below waveform) -->
      <div v-if="regionOverlays.length" class="relative h-[14px] mt-1">
        <div
          v-for="ov in regionOverlays"
          :key="'text-' + ov.id"
          class="absolute top-0 overflow-hidden pointer-events-none"
          :style="{ left: ov.leftPct, width: ov.widthPct }">
          <span class="block px-1 text-[11px] leading-none text-content truncate">
            {{ ov.voiceText }}
          </span>
        </div>
      </div>

      <div
        v-if="!isReady && props.audioUrl"
        class="flex items-center justify-center h-[70px] text-content-tertiary text-xs">
        Loading waveform...
      </div>
    </template>

    <!-- PER-SCENE MODE -->
    <template v-else>
      <div
        class="overflow-x-auto pt-[18px] pb-[18px] thin-scrollbar"
        @wheel="onPerSceneWheel">
      <div
        class="flex items-stretch h-[70px] gap-1.5"
        style="min-width: min-content;">
        <button
          v-for="block in sceneBlocks"
          :key="block.id"
          type="button"
          class="relative rounded-[10px] transition-all min-w-[48px] overflow-visible"
          :style="{
            flexBasis: `calc(${block.flexBasis} * ${perSceneZoom})`,
            flexShrink: 0,
            flexGrow: 0,
            backgroundColor: blockColor(block.id === selectedId),
            border: block.id === selectedId
              ? '2px solid hsla(200, 60%, 65%, 0.5)'
              : '2px solid hsla(0, 0%, 40%, 0.2)',
            boxSizing: 'border-box',
          }"
          :title="`${block.label} — ${block.hasAudio ? '' : '(no audio) '}~${fmt(block.durationSec)}`"
          @click="emit('select', block.id)">
          <!-- Waveform peaks (if cached audio exists) -->
          <MiniWaveform
            v-if="peaksMap.get(block.id)"
            :peaks="peaksMap.get(block.id)!.peaks" />

          <!-- Pending stripe pattern for scenes without audio -->
          <div
            v-if="!block.hasAudio && !peaksMap.get(block.id)"
            class="absolute inset-0 opacity-30"
            style="background: repeating-linear-gradient(
              -45deg,
              hsla(45, 80%, 55%, 0.25),
              hsla(45, 80%, 55%, 0.25) 4px,
              transparent 4px,
              transparent 10px
            )" />

          <!-- Pills: above block -->
          <div
            v-if="block.behaviorLabels.length || block.binauralHz !== null || block.soundboardEvents.length"
            class="absolute bottom-full mb-1 left-1 flex gap-0.5 overflow-hidden max-w-[calc(100%-8px)]">
            <span
              v-for="(bl, bi) in block.behaviorLabels"
              :key="'b-' + bi"
              class="inline-flex items-center px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap bg-info/10 border border-info/30 text-info">
              {{ bl }}
            </span>
            <span
              v-if="block.binauralHz !== null"
              class="inline-flex items-center px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap bg-brand/10 border border-brand/30 text-brand">
              {{ block.binauralHz }} Hz
            </span>
            <span
              v-for="(ev, ei) in block.soundboardEvents"
              :key="'sb-' + ei"
              class="inline-flex items-center gap-0.5 px-1 py-px rounded-full text-[9px] leading-tight whitespace-nowrap"
              :class="ev.event === 'start'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-danger/10 border border-danger/30 text-danger'">
              <span class="text-[7px]">{{ ev.event === 'start' ? '&#9654;' : '&#9632;' }}</span>
              {{ ev.name }}
            </span>
          </div>

          <!-- Voice text: below block -->
          <span class="absolute top-full mt-1 left-1 max-w-[calc(100%-8px)] text-[11px] leading-none text-content truncate">
            {{ block.voiceText }}
          </span>
        </button>
      </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}
.thin-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}
</style>
