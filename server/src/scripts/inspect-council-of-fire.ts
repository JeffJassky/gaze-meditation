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

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!)
  const db = mongoose.connection.db!

  // Find council of fire session
  const sessions = await db.collection('sessions').find({ title: /council|fire/i }).toArray()
  for (const s of sessions) {
    console.log(`\n=== Session: ${s.title} ===`)
    console.log('Session audio:', JSON.stringify(s.audio, null, 2))
    console.log('\nEmbedded assets:')
    for (const a of (s.assets || [])) {
      console.log(`  [${a.kind}] ${a.label || a.key}  (id: ${a.id})`)
    }
    console.log('\nScenes with FX or soundboard:')
    for (let i = 0; i < (s.scenes || []).length; i++) {
      const sc = s.scenes[i]
      const hasFx = sc.config?.audio?.fx
      const hasSoundboard = sc.config?.audio?.soundboard?.length > 0
      if (hasFx || hasSoundboard) {
        console.log(`  Scene ${i} "${sc.label || ''}"`)
        if (hasFx) console.log(`    FX: ${JSON.stringify(sc.config.audio.fx)}`)
        if (hasSoundboard) console.log(`    Soundboard: ${JSON.stringify(sc.config.audio.soundboard)}`)
      }
    }
    console.log('\nAll scenes summary:')
    for (let i = 0; i < (s.scenes || []).length; i++) {
      const sc = s.scenes[i]
      const voice = sc.config?.voice
      const voiceSnip = typeof voice === 'string' ? voice.slice(0, 60) : Array.isArray(voice) ? voice[0]?.slice(0, 60) : '(none)'
      const audioKeys = Object.keys(sc.config?.audio || {}).join(',') || 'none'
      console.log(`  [${i}] ${sc.label || '(unlabeled)'} | audio: {${audioKeys}} | voice: "${voiceSnip}..."`)
    }
  }

  // Check asset collection for FX-like files
  const fxLike = await db.collection('assets').find({
    $or: [
      { label: /fire|drum|winter|wind|crackling|ambient|thunder|rain/i },
      { key: /fire|drum|winter|wind|crackling|ambient/i },
    ]
  }).toArray()
  console.log('\n=== FX-like assets in Asset collection ===')
  for (const a of fxLike) {
    console.log(`  [${a.kind}] ${a.label || a.key}  (id: ${a._id})`)
  }

  // Also show all music-classified assets
  const musicAssets = await db.collection('assets').find({ kind: 'music' }).toArray()
  console.log('\n=== All assets currently classified as "music" ===')
  for (const a of musicAssets) {
    console.log(`  ${a.label || a.key}  (id: ${a._id})`)
  }

  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
