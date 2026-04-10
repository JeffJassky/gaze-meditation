/**
 * Mark an asset as a system asset (visible to all users).
 *
 * Usage:
 *   npx tsx server/src/scripts/mark-system-asset.ts <asset-id> [--unmark]
 *
 * Examples:
 *   npx tsx server/src/scripts/mark-system-asset.ts 665a1b2c3d4e5f6a7b8c9d0e
 *   npx tsx server/src/scripts/mark-system-asset.ts 665a1b2c3d4e5f6a7b8c9d0e --unmark
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

// Load server/.env
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

const assetId = process.argv[2]
if (!assetId) {
  console.error('Usage: mark-system-asset.ts <asset-id> [--unmark]')
  process.exit(1)
}

const unmark = process.argv.includes('--unmark')

async function run() {
  await mongoose.connect(uri!)
  console.log('Connected to MongoDB')

  const result = await mongoose.connection.db!.collection('assets').updateOne(
    { _id: new mongoose.Types.ObjectId(assetId) },
    { $set: { isSystem: !unmark } },
  )

  if (result.matchedCount === 0) {
    console.error(`Asset ${assetId} not found`)
    process.exit(1)
  }

  console.log(`Asset ${assetId} — isSystem: ${!unmark}`)
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
