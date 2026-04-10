/**
 * List all system assets.
 *
 * Usage:
 *   npx tsx server/src/scripts/list-system-assets.ts
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
  const assets = await mongoose.connection.db!.collection('assets')
    .find({ isSystem: true })
    .project({ _id: 1, kind: 1, key: 1, label: 1 })
    .toArray()

  if (assets.length === 0) {
    console.log('No system assets.')
  } else {
    console.log(`${assets.length} system asset(s):\n`)
    for (const a of assets) {
      console.log(`  ${a._id}  [${a.kind}]  ${a.label || a.key}`)
    }
  }

  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
