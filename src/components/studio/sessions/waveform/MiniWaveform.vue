<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  peaks: Float32Array
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

// Match wavesurfer's bar style: barWidth 2, barGap 1, barRadius 2, zinc-600 color.
const BAR_WIDTH = 2
const BAR_GAP = 1
const BAR_RADIUS = 2
const BAR_COLOR = '#52525b' // zinc-600

function draw() {
  const el = canvas.value
  if (!el || !props.peaks.length) return

  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth
  const h = el.clientHeight
  el.width = w * dpr
  el.height = h * dpr

  const ctx = el.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const step = BAR_WIDTH + BAR_GAP
  const barCount = Math.floor(w / step)
  const mid = h / 2
  const peaksPerBar = props.peaks.length / barCount

  ctx.fillStyle = BAR_COLOR
  for (let i = 0; i < barCount; i++) {
    // Average peaks in this bar's range for downsampling.
    const from = Math.floor(i * peaksPerBar)
    const to = Math.min(Math.floor((i + 1) * peaksPerBar), props.peaks.length)
    let max = 0
    for (let j = from; j < to; j++) {
      const v = Math.abs(props.peaks[j] ?? 0)
      if (v > max) max = v
    }
    const barH = Math.max(1, max * mid * 0.9)
    const x = i * step
    const y = mid - barH

    if (BAR_RADIUS > 0 && barH > BAR_RADIUS * 2) {
      // Rounded rect
      ctx.beginPath()
      ctx.roundRect(x, y, BAR_WIDTH, barH * 2, BAR_RADIUS)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, BAR_WIDTH, barH * 2)
    }
  }
}

onMounted(draw)
watch(() => props.peaks, draw)

// Redraw on resize.
const ro = new ResizeObserver(draw)
onMounted(() => { if (canvas.value) ro.observe(canvas.value) })
</script>

<template>
  <canvas ref="canvas" class="absolute inset-0 w-full h-full pointer-events-none" />
</template>
