/**
 * Migrate legacy scene.config.audio.fx to the unified soundboard system.
 *
 * For each session that has scenes with audio.fx:
 * 1. Creates a SoundboardSample at session.audio.soundboard for each unique fx path
 * 2. Adds a SoundboardEvent { event: 'start', id } on the scene
 * 3. Removes the fx property from the scene
 *
 * Usage:
 *   npx tsx server/src/scripts/migrate-fx-to-soundboard.ts
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(scriptDir, '../../.env')
try {
  const raw = fs.readFileSync(envPath, 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const uri = process.env.MONGODB_URI
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1) }

async function run() {
  await mongoose.connect(uri!)
  const db = mongoose.connection.db!

  const sessions = await db.collection('sessions').find({}).toArray()
  let migratedSessions = 0
  let migratedScenes = 0

  for (const session of sessions) {
    const scenes = session.scenes || []
    const existingSoundboard = session.audio?.soundboard || []
    const existingSampleIds = new Set(existingSoundboard.map((s: any) => s.id))
    const newSamples: any[] = []
    // Map fx path → sample id for deduplication
    const pathToId = new Map<string, string>()
    let changed = false

    for (const scene of scenes) {
      const fx = scene.config?.audio?.fx
      if (!fx?.path) continue

      // Find or create a soundboard sample for this fx path
      let sampleId = pathToId.get(fx.path)
      if (!sampleId) {
        // Check if there's already a session-level sample with this path
        const existing = existingSoundboard.find((s: any) => s.path === fx.path)
        if (existing) {
          sampleId = existing.id
        } else {
          sampleId = `fx-${crypto.randomUUID().slice(0, 8)}`
          newSamples.push({
            id: sampleId,
            path: fx.path,
            volume: fx.volume ?? 1,
            loop: fx.loop ?? false,
          })
        }
        pathToId.set(fx.path, sampleId)
      }

      // Add soundboard event on the scene
      if (!scene.config.audio.soundboard) scene.config.audio.soundboard = []
      const alreadyHas = scene.config.audio.soundboard.some(
        (e: any) => e.event === 'start' && e.id === sampleId,
      )
      if (!alreadyHas) {
        scene.config.audio.soundboard.push({ event: 'start', id: sampleId })
      }

      // Remove legacy fx
      delete scene.config.audio.fx
      changed = true
      migratedScenes++
    }

    if (changed) {
      const updatedSoundboard = [...existingSoundboard, ...newSamples]
      await db.collection('sessions').updateOne(
        { _id: session._id },
        {
          $set: {
            scenes,
            'audio.soundboard': updatedSoundboard,
          },
        },
      )
      migratedSessions++
      console.log(`  ${session.title}: migrated ${newSamples.length} new samples, updated scenes`)
    }
  }

  console.log(`\nDone. Migrated ${migratedScenes} scenes across ${migratedSessions} sessions.`)
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
