import type { SceneRegion } from '@shared/types'
import {
  SILENCE_THRESHOLD_DB,
  SILENCE_MIN_DURATION,
  MIN_SEGMENT_DURATION,
} from './constants'

/**
 * A contiguous silent gap detected in the audio.
 */
export interface SilenceGap {
  start: number   // seconds
  end: number     // seconds
  midpoint: number
  duration: number
}

export interface DetectSilenceOptions {
  /** RMS threshold in dB (default: SILENCE_THRESHOLD_DB). */
  thresholdDb?: number
  /** Minimum gap length in seconds (default: SILENCE_MIN_DURATION). */
  minDuration?: number
}

/**
 * Scans an AudioBuffer and returns all silence gaps that exceed the
 * configured thresholds. Runs synchronously on the decoded PCM data —
 * fast enough for files up to ~60 min at 44.1 kHz.
 */
export function detectSilence(
  buffer: AudioBuffer,
  options: DetectSilenceOptions = {},
): SilenceGap[] {
  const thresholdDb = options.thresholdDb ?? SILENCE_THRESHOLD_DB
  const minDuration = options.minDuration ?? SILENCE_MIN_DURATION

  // Convert dB threshold to linear amplitude.
  const thresholdLinear = Math.pow(10, thresholdDb / 20)

  // Mix down to mono (average channels).
  const length = buffer.length
  const sampleRate = buffer.sampleRate
  const mono = new Float32Array(length)
  const channels = buffer.numberOfChannels
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      mono[i] = (mono[i] ?? 0) + (data[i] ?? 0)
    }
  }
  if (channels > 1) {
    for (let i = 0; i < length; i++) mono[i] = (mono[i] ?? 0) / channels
  }

  // Analyse in windows — 1024 samples ≈ 23 ms at 44.1 kHz.
  const windowSize = 1024
  const gaps: SilenceGap[] = []
  let gapStart: number | null = null

  for (let offset = 0; offset < length; offset += windowSize) {
    const end = Math.min(offset + windowSize, length)
    let sumSq = 0
    for (let i = offset; i < end; i++) {
      const v = mono[i] ?? 0
      sumSq += v * v
    }
    const rms = Math.sqrt(sumSq / (end - offset))
    const isSilent = rms < thresholdLinear
    const timeSec = offset / sampleRate

    if (isSilent && gapStart === null) {
      gapStart = timeSec
    } else if (!isSilent && gapStart !== null) {
      const gapEnd = timeSec
      const duration = gapEnd - gapStart
      if (duration >= minDuration) {
        gaps.push({
          start: gapStart,
          end: gapEnd,
          midpoint: (gapStart + gapEnd) / 2,
          duration,
        })
      }
      gapStart = null
    }
  }

  // Close a trailing gap (silence until end of file).
  if (gapStart !== null) {
    const gapEnd = length / sampleRate
    const duration = gapEnd - gapStart
    if (duration >= minDuration) {
      gaps.push({
        start: gapStart,
        end: gapEnd,
        midpoint: (gapStart + gapEnd) / 2,
        duration,
      })
    }
  }

  return gaps
}

/**
 * Given silence gaps and a desired scene count, produce non-overlapping
 * SceneRegion[] that tile the audio. Uses the largest gaps as split points.
 *
 * If `sceneCount` exceeds available gaps + 1, the remaining time is divided
 * equally among the extra scenes.
 */
export function splitRegionsFromSilence(
  gaps: SilenceGap[],
  totalDuration: number,
  sceneCount: number,
): SceneRegion[] {
  if (sceneCount <= 0 || totalDuration <= 0) return []
  if (sceneCount === 1) return [{ start: 0, end: totalDuration }]

  // Pick the (sceneCount - 1) largest gaps, sorted by position.
  const sorted = [...gaps].sort((a, b) => b.duration - a.duration)
  const splitPoints = sorted
    .slice(0, sceneCount - 1)
    .map((g) => g.midpoint)
    .sort((a, b) => a - b)

  // Build regions from split points.
  const regions: SceneRegion[] = []
  let prev = 0
  for (const pt of splitPoints) {
    regions.push({ start: prev, end: pt })
    prev = pt
  }
  regions.push({ start: prev, end: totalDuration })

  // If we didn't have enough gaps, subdivide the last region to fill the
  // remaining scene count.
  while (regions.length < sceneCount) {
    const last = regions[regions.length - 1]!
    const mid = (last.start + last.end) / 2
    if (last.end - last.start < MIN_SEGMENT_DURATION * 2) break
    regions[regions.length - 1] = { start: last.start, end: mid }
    regions.push({ start: mid, end: last.end })
  }

  return regions
}
