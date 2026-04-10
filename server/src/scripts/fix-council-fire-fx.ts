/**
 * Fix Council of Fire FX assets — reclassify wind, drums, fire from 'music' to 'fx'.
 * Also fixes the music.mp3 to stay as 'music' and spiral.png to 'spiral'.
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

const FX_LABELS = ['drums.mp3', 'fire.mp3']
const FX_LABEL_PATTERNS = [/winter.*wind/i, /drum/i, /fire\.mp3/i]

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!)
  const db = mongoose.connection.db!

  // Fix embedded assets in the Council of Fire session
  const session = await db.collection('sessions').findOne({ title: /council.*fire/i })
  if (!session) {
    console.log('Council of Fire session not found')
    await mongoose.disconnect()
    return
  }

  let changed = false
  for (const a of (session.assets || [])) {
    const label = (a.label || a.key || '').toLowerCase()

    // FX sounds
    if (FX_LABEL_PATTERNS.some(p => p.test(a.label || a.key || ''))) {
      if (a.kind !== 'fx') {
        console.log(`  ${a.label || a.key}: ${a.kind} → fx`)
        a.kind = 'fx'
        changed = true
      }
    }
    // Spiral
    if (label.includes('spiral')) {
      if (a.kind !== 'spiral') {
        console.log(`  ${a.label || a.key}: ${a.kind} → spiral`)
        a.kind = 'spiral'
        changed = true
      }
    }
  }

  if (changed) {
    await db.collection('sessions').updateOne(
      { _id: session._id },
      { $set: { assets: session.assets } },
    )
    console.log('Session embedded assets updated')
  } else {
    console.log('No changes needed in session')
  }

  // Also fix in the Asset collection
  const fxAssets = await db.collection('assets').find({
    $or: FX_LABEL_PATTERNS.map(p => ({ label: p })),
  }).toArray()

  for (const a of fxAssets) {
    if (a.kind !== 'fx') {
      console.log(`  Asset ${a._id} "${a.label}": ${a.kind} → fx`)
      await db.collection('assets').updateOne(
        { _id: a._id },
        { $set: { kind: 'fx' } },
      )
    }
  }

  // Fix spirals in Asset collection
  const spiralAssets = await db.collection('assets').find({
    label: /spiral/i, kind: { $ne: 'spiral' },
  }).toArray()
  for (const a of spiralAssets) {
    console.log(`  Asset ${a._id} "${a.label}": ${a.kind} → spiral`)
    await db.collection('assets').updateOne(
      { _id: a._id },
      { $set: { kind: 'spiral' } },
    )
  }

  await mongoose.disconnect()
  console.log('Done')
}

run().catch((err) => { console.error(err); process.exit(1) })
