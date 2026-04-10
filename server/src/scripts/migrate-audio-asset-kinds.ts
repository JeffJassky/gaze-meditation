/**
 * Migrate legacy 'audio' assets to specific kinds based on context.
 *
 * - Assets with meta.voiceHash → 'voice'
 * - Assets referenced as session.masterAudio → 'session-audio'
 * - Remaining 'audio' assets → 'music' (safe default)
 *
 * Also updates session.assets[] subdocs to match.
 *
 * Usage:
 *   npx tsx server/src/scripts/migrate-audio-asset-kinds.ts
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
} catch { /* rely on process.env */ }

const uri = process.env.MONGODB_URI
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1) }

async function run() {
  await mongoose.connect(uri!)
  const db = mongoose.connection.db!

  // 1. Voice assets (have voiceHash in meta)
  const voiceResult = await db.collection('assets').updateMany(
    { kind: 'audio', 'meta.voiceHash': { $exists: true } },
    { $set: { kind: 'voice' } },
  )
  console.log(`Migrated ${voiceResult.modifiedCount} audio → voice`)

  // 2. Session-audio assets (referenced by session.masterAudio.key)
  const sessions = await db.collection('sessions')
    .find({ 'masterAudio.key': { $exists: true } })
    .project({ 'masterAudio.key': 1 })
    .toArray()
  const masterKeys = sessions.map((s) => s.masterAudio?.key).filter(Boolean)
  if (masterKeys.length > 0) {
    const saResult = await db.collection('assets').updateMany(
      { kind: 'audio', key: { $in: masterKeys } },
      { $set: { kind: 'session-audio' } },
    )
    console.log(`Migrated ${saResult.modifiedCount} audio → session-audio`)
  }

  // 3. Remaining audio → music
  const musicResult = await db.collection('assets').updateMany(
    { kind: 'audio' },
    { $set: { kind: 'music' } },
  )
  console.log(`Migrated ${musicResult.modifiedCount} audio → music`)

  // 4. Update session.assets[] subdocs
  const allSessions = await db.collection('sessions').find({}).toArray()
  let updatedSessions = 0
  for (const s of allSessions) {
    if (!Array.isArray(s.assets) || s.assets.length === 0) continue
    let changed = false
    for (const a of s.assets) {
      if (a.kind !== 'audio') continue
      // Look up the migrated kind from the assets collection
      const doc = await db.collection('assets').findOne({ key: a.key })
      if (doc) {
        a.kind = doc.kind
        changed = true
      }
    }
    if (changed) {
      await db.collection('sessions').updateOne(
        { _id: s._id },
        { $set: { assets: s.assets } },
      )
      updatedSessions++
    }
  }
  console.log(`Updated assets[] in ${updatedSessions} sessions`)

  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
