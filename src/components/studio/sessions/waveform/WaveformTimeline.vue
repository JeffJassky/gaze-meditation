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

interface HapticEventDisplay {
  event: 'start' | 'stop'
  name: string
}

interface SceneTimelineBlock {
  id: string
  index: number
  label: string
  voiceText: string
  onScreenText: string
  promptTextColor?: string
  durationSec: number
  hasAudio: boolean
  behaviorLabels: string[]
  binauralHz: number | null
  soundboardEvents: SoundboardEventDisplay[]
  hapticEvents: HapticEventDisplay[]
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

function onScreenText(scene: SceneBlock): string {
  const t = scene.config?.text
  if (!t) return ''
  return Array.isArray(t) ? t.join(' ') : t
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

import { HAPTIC_PRESETS } from '@shared/constants/haptics'

function getHapticEvents(scene: SceneBlock): HapticEventDisplay[] {
  const evts = scene.config?.haptics?.events
  if (!evts || evts.length === 0) return []
  return evts.map((e) => {
    const preset = HAPTIC_PRESETS.find((p) => p.key === e.id)
    return { event: e.event as 'start' | 'stop', name: preset?.label ?? e.id }
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
      onScreenText: onScreenText(s),
      promptTextColor: (s.config?.theme as any)?.promptTextColor as string | undefined,
      durationSec: peakData?.duration ?? estimateDuration(s),
      hasAudio: hasAudio(s) || !!peakData,
      behaviorLabels: getBehaviorLabels(s),
      binauralHz: getBinauralHz(s),
      soundboardEvents: getSoundboardEvents(s),
      hapticEvents: getHapticEvents(s),
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
  hapticEvents: HapticEventDisplay[]
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
        hapticEvents: getHapticEvents(s),
      }
    })
})

// --- Per-scene zoom --------------------------------------------------------
// 1.0 = fit all scenes in view, >1 = zoomed in (scrollable).
const perSceneZoom = ref(1)

const maxSoundboardEvents = computed(() =>
  Math.max(0, ...sceneBlocks.value.map(b => b.soundboardEvents.length)),
)
const maxHapticEvents = computed(() =>
  Math.max(0, ...sceneBlocks.value.map(b => b.hapticEvents.length)),
)
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
      <!-- Feature tracks (above waveform) — each feature type is its own row -->
      <div v-if="regionOverlays.length" class="relative mb-1 flex flex-col gap-px">
        <!-- Soundboard track -->
        <div v-if="regionOverlays.some(ov => ov.soundboardEvents.length)" class="relative h-4">
          <div v-for="ov in regionOverlays" :key="'sb-t-' + ov.id"
            class="absolute top-0 overflow-hidden pointer-events-none"
            :style="{ left: ov.leftPct, width: ov.widthPct }">
            <div class="flex gap-0.5 px-1">
              <span v-for="(ev, ei) in ov.soundboardEvents" :key="ei"
                class="inline-flex items-center gap-0.5 text-[9px] leading-tight whitespace-nowrap"
                :class="ev.event === 'start' ? 'text-success' : 'text-danger'">
                <svg class="shrink-0" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                {{ ev.name }}
              </span>
            </div>
          </div>
        </div>
        <!-- Haptics track -->
        <div v-if="regionOverlays.some(ov => ov.hapticEvents.length)" class="relative h-4">
          <div v-for="ov in regionOverlays" :key="'hp-t-' + ov.id"
            class="absolute top-0 overflow-hidden pointer-events-none"
            :style="{ left: ov.leftPct, width: ov.widthPct }">
            <div class="flex gap-0.5 px-1">
              <span v-for="(ev, ei) in ov.hapticEvents" :key="ei"
                class="inline-flex items-center gap-0.5 text-[9px] leading-tight whitespace-nowrap"
                :class="ev.event === 'start' ? 'text-success' : 'text-danger'">
                <svg class="shrink-0" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8v8"/><path d="M6 4v16"/><rect x="10" y="2" width="4" height="20" rx="1"/><path d="M18 4v16"/><path d="M22 8v8"/></svg>
                {{ ev.name }}
              </span>
            </div>
          </div>
        </div>
        <!-- Binaural track -->
        <div v-if="regionOverlays.some(ov => ov.binauralHz !== null)" class="relative h-4">
          <div v-for="ov in regionOverlays" :key="'bn-t-' + ov.id"
            class="absolute top-0 overflow-hidden pointer-events-none"
            :style="{ left: ov.leftPct, width: ov.widthPct }">
            <span v-if="ov.binauralHz !== null"
              class="inline-flex items-center gap-0.5 px-1 text-[9px] leading-tight whitespace-nowrap text-brand">
              <svg class="shrink-0" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z"/><path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z"/></svg>
              {{ ov.binauralHz }} Hz
            </span>
          </div>
        </div>
        <!-- Behaviors track -->
        <div v-if="regionOverlays.some(ov => ov.behaviorLabels.length)" class="relative h-4">
          <div v-for="ov in regionOverlays" :key="'bh-t-' + ov.id"
            class="absolute top-0 overflow-hidden pointer-events-none"
            :style="{ left: ov.leftPct, width: ov.widthPct }">
            <div v-if="ov.behaviorLabels.length" class="flex gap-0.5 px-1">
              <span v-for="(bl, bi) in ov.behaviorLabels" :key="bi"
                class="inline-flex items-center gap-0.5 text-[9px] leading-tight whitespace-nowrap text-info">
                <svg class="shrink-0" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                {{ bl }}
              </span>
            </div>
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
      <div class="flex">
        <!-- Track labels (fixed left column) -->
        <div class="shrink-0 w-[80px] flex flex-col pr-2">
          <div v-if="maxSoundboardEvents > 0"
            class="flex items-start gap-1 text-success pt-0.5"
            :style="{ height: (maxSoundboardEvents * 16) + 'px' }">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span class="text-[9px] truncate">FX Sound</span>
          </div>
          <div v-if="maxHapticEvents > 0"
            class="flex items-start gap-1 text-warning pt-0.5"
            :style="{ height: (maxHapticEvents * 16) + 'px' }">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8v8"/><path d="M6 4v16"/><rect x="10" y="2" width="4" height="20" rx="1"/><path d="M18 4v16"/><path d="M22 8v8"/></svg>
            <span class="text-[9px] truncate">Haptics</span>
          </div>
          <div v-if="sceneBlocks.some(b => b.binauralHz !== null)"
            class="h-4 flex items-start gap-1 text-brand pt-0.5">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 14a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z"/><path d="M3 14a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z"/></svg>
            <span class="text-[9px] truncate">Binaural</span>
          </div>
          <div v-if="sceneBlocks.some(b => b.behaviorLabels.length)"
            class="h-4 flex items-start gap-1 text-info pt-0.5">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span class="text-[9px] truncate">Behaviors</span>
          </div>
          <!-- Waveform label -->
          <div class="h-[70px] flex items-start gap-1 text-content-tertiary pt-0.5">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            <span class="text-[9px] truncate">Voice</span>
          </div>
          <!-- Voice transcript spacer (shares row with voice text in grid) -->
          <div class="h-4" />
          <!-- On-screen text label -->
          <div v-if="sceneBlocks.some(b => b.onScreenText)"
            class="h-4 flex items-start gap-1 text-content-tertiary pt-0.5">
            <svg class="shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
            <span class="text-[9px] truncate">Text</span>
          </div>
        </div>

        <!-- Scrollable timeline grid -->
        <div
          class="flex-1 min-w-0 overflow-x-auto pb-[18px] thin-scrollbar"
          @wheel="onPerSceneWheel">
        <div
          class="grid gap-x-1.5"
          :style="{
            gridTemplateColumns: sceneBlocks.map(b => `minmax(48px, calc(${b.flexBasis} * ${perSceneZoom}))`).join(' '),
            minWidth: 'min-content',
          }">

          <!-- Soundboard lanes (one row per event across all scenes) -->
          <template v-for="evIdx in maxSoundboardEvents" :key="'sb-row-' + evIdx">
            <div v-for="block in sceneBlocks" :key="'sb-lane-' + block.id + '-' + evIdx"
              class="overflow-hidden px-1 h-4 flex items-center">
              <span v-if="block.soundboardEvents[evIdx - 1]"
                class="text-[9px] leading-tight whitespace-nowrap truncate"
                :class="block.soundboardEvents[evIdx - 1]?.event === 'start' ? 'text-success' : 'text-danger'">{{ block.soundboardEvents[evIdx - 1]?.event === 'start' ? '▶' : '■' }} {{ block.soundboardEvents[evIdx - 1]?.name }}</span>
            </div>
          </template>

          <!-- Haptics lanes (one row per event across all scenes) -->
          <template v-for="evIdx in maxHapticEvents" :key="'hp-row-' + evIdx">
            <div v-for="block in sceneBlocks" :key="'hp-lane-' + block.id + '-' + evIdx"
              class="overflow-hidden px-1 h-4 flex items-center">
              <span v-if="block.hapticEvents[evIdx - 1]"
                class="text-[9px] leading-tight whitespace-nowrap truncate"
                :class="block.hapticEvents[evIdx - 1]?.event === 'start' ? 'text-success' : 'text-danger'">{{ block.hapticEvents[evIdx - 1]?.event === 'start' ? '▶' : '■' }} {{ block.hapticEvents[evIdx - 1]?.name }}</span>
            </div>
          </template>

          <!-- Binaural lane -->
          <template v-if="sceneBlocks.some(b => b.binauralHz !== null)">
            <div v-for="block in sceneBlocks" :key="'bn-lane-' + block.id"
              class="overflow-hidden truncate px-1 h-4 flex items-center">
              <span v-if="block.binauralHz !== null"
                class="text-[9px] leading-tight whitespace-nowrap text-brand">
                {{ block.binauralHz }} Hz
              </span>
            </div>
          </template>

          <!-- Behaviors lane -->
          <template v-if="sceneBlocks.some(b => b.behaviorLabels.length)">
            <div v-for="block in sceneBlocks" :key="'bh-lane-' + block.id"
              class="overflow-hidden truncate px-1 h-4 flex items-center">
              <span v-for="(bl, bi) in block.behaviorLabels" :key="bi"
                class="text-[9px] leading-tight whitespace-nowrap text-info">
                {{ bl }}{{ bi < block.behaviorLabels.length - 1 ? ' + ' : '' }}
              </span>
            </div>
          </template>

          <!-- Scene blocks row -->
          <button
            v-for="block in sceneBlocks"
            :key="block.id"
            type="button"
            class="relative rounded-[10px] transition-all min-w-[48px] overflow-visible h-[70px]"
            :style="{
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
          </button>

          <!-- Voice text row -->
          <span
            v-for="block in sceneBlocks"
            :key="'vt-' + block.id"
            class="text-[9px] leading-tight text-content truncate px-1 h-4 flex items-center">
            {{ block.voiceText }}
          </span>

          <!-- On-screen text row -->
          <template v-if="sceneBlocks.some(b => b.onScreenText)">
            <span
              v-for="block in sceneBlocks"
              :key="'ot-' + block.id"
              class="text-[9px] leading-tight italic truncate px-1 h-4 flex items-center"
              :class="block.promptTextColor ? '' : 'text-content-tertiary'"
              :style="block.promptTextColor ? { color: block.promptTextColor } : undefined">
              {{ block.onScreenText }}
            </span>
          </template>
        </div>
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
