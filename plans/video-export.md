# Video Export — Render Sessions to MP4

Render session as single MP4 file with all audio/visual layers baked in. No interactive elements (behaviors, biofeedback, HUD, 3D visuals). Output = distributable video file.

## Approach: Remotion

React-based video rendering framework. Frame-by-frame deterministic rendering via headless Chrome + FFmpeg. Session JSON → React composition → MP4.

Remotion chosen over:
- **FFmpeg filter graphs** — audio mixing doable, but animated text fades/transitions = nightmare filter syntax
- **Puppeteer recording** — real-time speed, timing drift, fragile
- **Web Codecs + OffscreenCanvas** — building renderer from scratch, no audio mixing primitives

Trade-off: Remotion is React (not Vue), but renderer is standalone package consuming Session JSON. No Vue integration needed.

**License note**: Remotion requires commercial license for companies 3+ employees. Check remotion.dev/pricing.

---

## Pipeline

```
Session JSON
  ↓
Pre-process (Node.js)
  ├── Generate all TTS voice clips (ElevenLabs)
  ├── Render binaural beats → stereo WAV (raw PCM sine waves in Node)
  ├── Resolve asset keys → absolute URLs (presigned S3)
  └── Compute frame-accurate timeline from durations
  ↓
Remotion Composition (React)
  ├── Background (solid color / <OffthreadVideo> / rotating <Img>)
  ├── Tint overlay (color + opacity, per-scene)
  ├── SceneSequence (<Sequence> per scene, text with interpolate() fades)
  └── AudioMixer
      ├── MusicLoop (overlapping <Audio> iterations w/ volume crossfade)
      ├── BinauralTrack (pre-rendered WAV)
      ├── VoiceClips (per-scene <Audio> in <Sequence>)
      ├── SoundboardRegions (event→region, looping <Audio>)
      └── FxClips (one-shots at scene starts)
  ↓
renderMedia() → MP4 (H.264)
  ↓
Upload to S3 → return URL
```

---

## Timeline Computation

Core translation layer. Theater plays scenes imperatively; Remotion needs pre-computed frame timeline.

Since behaviors skipped, scene duration = `max(voiceDuration, textSequenceDuration, config.duration)`.

```typescript
interface SceneTimeline {
  sceneId: string
  startFrame: number
  durationFrames: number
  fadeInFrames: number
  fadeOutFrames: number
  cooldownFrames: number
  textSegments: { text: string, startFrame: number, durationFrames: number, fadeInFrames: number, fadeOutFrames: number }[]
  voiceClip?: { src: string, startFrame: number, durationFrames: number }
  fxClip?: { src: string, volume: number, loop: boolean }
  soundboardEvents: SoundboardEvent[]
  binauralOverride?: { hertz: number, volume: number }
  theme: ThemeConfig // fully resolved (session + scene override merged)
}
```

Master audio mode: if session has `masterAudio.key` + scene `region`, scene duration = `region.end - region.start` seconds.

Two-pass computation needed:
1. Generate TTS clips, get durations → estimate total session length
2. Render binaural WAV to estimated length (+ buffer), compute final timeline

---

## Hard Parts

### Music looping w/ crossfade
Each loop iteration = separate `<Audio>` in overlapping `<Sequence>`. Volume callback handles crossfade ramps at boundaries. Iterations overlap by `crossfadeDuration` frames.

### Binaural beats
Can't use Web Audio oscillators in headless Chrome. Pre-render stereo WAV in Node.js:
- Left channel = `sin(2π * carrierFreq * t)`
- Right channel = `sin(2π * (carrierFreq + beatFreq) * t)`
- Per-scene frequency/volume overrides baked in at correct time offsets

### Scene transitions
Overlap adjacent `<Sequence>` blocks by `fadeOutFrames`. Both scenes render simultaneously during overlap. Outgoing: opacity 1→0, scale 1→0.9. Incoming: opacity 0→1, scale 1.1→1. Mirrors existing CSS transitions.

### Voice generation extraction
ElevenLabs API call logic currently in vite.config.ts middleware. Needs extraction to shared service callable by both dev server and renderer.

---

## Package Structure

```
packages/renderer/
  package.json
  tsconfig.json
  src/
    index.ts                    # CLI entry (local/manual renders)
    api.ts                      # Programmatic API (called by server)
    Root.tsx                    # Remotion entry — registers <Composition>
    SessionVideo.tsx            # Root composition
    components/
      SceneSequence.tsx         # Scene array → <Sequence> blocks
      SceneVisual.tsx           # Single scene: bg + tint + text
      TextOverlay.tsx           # interpolate() fade + scale
      VideoBackground.tsx       # <OffthreadVideo>
      SpiralBackground.tsx      # Rotating <Img>
      TintOverlay.tsx           # Color overlay
    audio/
      AudioMixer.tsx            # All layers combined
      MusicLoop.tsx             # Crossfade loop
      BinauralTrack.tsx
      VoiceTrack.tsx
      SoundboardTrack.tsx
      FxTrack.tsx
    pipeline/
      prepareSession.ts         # Orchestrates pre-processing
      generateVoice.ts          # ElevenLabs TTS
      renderBinaural.ts         # PCM WAV generation
      resolveAssets.ts          # Asset key → URL
      computeTimeline.ts        # Session → frame timeline
    lib/
      themeResolver.ts          # Port of src/utils/themeResolver.ts
      timeCalc.ts               # Port of src/utils/time.ts
```

---

## Server Integration

```
POST /api/render { sessionId, options? }  →  { jobId }
GET  /api/render/:jobId/stream            →  SSE progress updates
```

renderService.ts orchestrates: load session → prepareSession() → bundle (cached) → renderMedia() → upload S3 → return URL.

Bundle caching: `bundle()` is expensive (webpack). Cache and reuse across renders. Only re-bundle when renderer code changes.

---

## Client UI

"Export Video" button in studio toolbar. Progress dialog: preparing → rendering → uploading → done. Download link on completion.

---

## Constraints

- **Memory**: ~2-4 GB RAM per concurrent render
- **Speed**: ~1-3x real-time (10-min session ≈ 10-30 min render)
- **Fonts**: custom web fonts must be loaded in composition
- **Audio sample rate**: all sources should target 44100 Hz

---

## Phases

| # | What | Effort |
|---|------|--------|
| 1 | Scaffold + static rendering (backgrounds, text, transitions, no audio) | 1-2 days |
| 2 | Voice audio (TTS generation + sync) | 1 day |
| 3 | Music, binaural, soundboard, FX | 1 day |
| 4 | Server endpoint + job queue + S3 upload | 1 day |
| 5 | Client UI (export button + progress dialog) | 1 day |

---

## Bonus Unlocks

- **Audio-only export** — same pipeline, `codec: 'mp3'` — instant podcast export
- **Preview before render** — `@remotion/player` in iframe for real-time preview
- **Visual regression testing** — deterministic rendering = comparable frames across builds

---

## Key Existing Files to Reference

- `src/utils/themeResolver.ts` — theme merge logic
- `src/utils/time.ts` — text duration calculation
- `src/audio/binuralEngine.ts` — binaural params
- `src/audio/musicLooper.ts` — loop crossfade logic
- `src/core/Scene.ts` — scene lifecycle, duration calc
- `src/services/voiceService.ts` — TTS generation
- `src/components/scene/Scene.vue` — visual layout, text fade transitions
- `src/composables/useTheaterAudio.ts` — soundboard reconciliation
- `vite.config.ts` — ElevenLabs middleware (needs extraction)
