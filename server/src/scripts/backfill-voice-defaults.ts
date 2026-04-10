/**
 * One-shot migration: set voiceOrigin='ai' and voiceStructure='scene' on all
 * existing sessions that don't already have these fields.
 *
 * Usage:
 *   npx tsx server/src/scripts/backfill-voice-defaults.ts
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

// Load server/.env manually (no dotenv dependency).
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
} catch {
  // rely on process.env
}

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI not set')
  process.exit(1)
}

async function run() {
  await mongoose.connect(uri!)
  console.log('Connected to MongoDB')

  const result = await mongoose.connection.db!.collection('sessions').updateMany(
    { voiceOrigin: { $exists: false } },
    { $set: { voiceOrigin: 'ai', voiceStructure: 'scene' } },
  )

  console.log(`Updated ${result.modifiedCount} sessions`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
