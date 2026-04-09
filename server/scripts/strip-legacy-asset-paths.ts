#!/usr/bin/env tsx
/**
 * Strips leading `/` from asset-path fields in Session documents so they
 * match `asset.key` directly. Part of the legacy-removal refactor: after
 * this runs, the frontend can resolve assets with `${S3_BASE}/${key}`
 * without any prefix-sniffing or path-rewriting layer.
 *
 * Fields rewritten per session:
 *   - audio.musicTrack
 *   - audio.soundboard[].path
 *   - settings.spiralBackground
 *   - settings.videoBackground
 *
 * Usage:
 *   ./node_modules/.bin/tsx scripts/strip-legacy-asset-paths.ts --dry-run
 *   ./node_modules/.bin/tsx scripts/strip-legacy-asset-paths.ts
 */

import path from 'node:path'
import fsSync from 'node:fs'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.resolve(SCRIPT_DIR, '..')

loadEnvFile(path.join(SERVER_DIR, '.env'))

function loadEnvFile(file: string): void {
	let raw: string
	try {
		raw = fsSync.readFileSync(file, 'utf-8')
	} catch {
		return
	}
	for (const line of raw.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eq = trimmed.indexOf('=')
		if (eq === -1) continue
		const key = trimmed.slice(0, eq).trim()
		let value = trimmed.slice(eq + 1).trim()
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		if (!(key in process.env)) process.env[key] = value
	}
}

const dryRun = process.argv.includes('--dry-run')

function strip(p: unknown): string | undefined {
	if (typeof p !== 'string' || !p) return p as undefined
	// Leave full URLs, data URIs, blob URIs alone.
	if (/^(https?:|data:|blob:|\/\/)/.test(p)) return p
	return p.replace(/^\/+/, '')
}

interface Change {
	field: string
	before: string
	after: string
}

async function main() {
	const uri = process.env.MONGODB_URI
	if (!uri) throw new Error('Missing MONGODB_URI')

	await mongoose.connect(uri)
	const db = mongoose.connection.db
	if (!db) throw new Error('No db handle')

	const sessions = await db.collection('sessions').find({}).toArray()
	console.log(
		`[migrate] mode=${dryRun ? 'DRY-RUN' : 'WRITE'}  sessions=${sessions.length}`,
	)

	let touched = 0
	let totalChanges = 0

	for (const s of sessions) {
		const changes: Change[] = []
		const update: Record<string, unknown> = {}

		// audio.musicTrack
		const mt = s.audio?.musicTrack
		if (typeof mt === 'string') {
			const next = strip(mt)
			if (next !== mt) {
				changes.push({ field: 'audio.musicTrack', before: mt, after: next! })
				update['audio.musicTrack'] = next
			}
		}

		// audio.soundboard[].path — array element update: rewrite whole array
		const sb = s.audio?.soundboard
		if (Array.isArray(sb)) {
			let sbDirty = false
			const nextSb = sb.map((entry: Record<string, unknown>, i: number) => {
				const p = entry?.path
				if (typeof p === 'string') {
					const next = strip(p)
					if (next !== p) {
						changes.push({
							field: `audio.soundboard[${i}].path`,
							before: p,
							after: next!,
						})
						sbDirty = true
						return { ...entry, path: next }
					}
				}
				return entry
			})
			if (sbDirty) update['audio.soundboard'] = nextSb
		}

		// settings.spiralBackground / videoBackground
		for (const key of ['spiralBackground', 'videoBackground'] as const) {
			const v = s.settings?.[key]
			if (typeof v === 'string') {
				const next = strip(v)
				if (next !== v) {
					changes.push({ field: `settings.${key}`, before: v, after: next! })
					update[`settings.${key}`] = next
				}
			}
		}

		if (changes.length === 0) continue

		touched++
		totalChanges += changes.length
		console.log(
			`\n[migrate] ${s._id}  "${s.title}"  (${changes.length} change${changes.length === 1 ? '' : 's'})`,
		)
		for (const c of changes) {
			console.log(`    ${c.field}`)
			console.log(`      - ${c.before}`)
			console.log(`      + ${c.after}`)
		}

		if (!dryRun) {
			await db
				.collection('sessions')
				.updateOne({ _id: s._id }, { $set: update })
		}
	}

	console.log(
		`\n[migrate] done  sessionsTouched=${touched}  fieldChanges=${totalChanges}  ${dryRun ? '(no writes)' : '(written)'}`,
	)

	await mongoose.disconnect()
}

main().catch((e) => {
	console.error('[migrate] FAILED:', e)
	process.exit(1)
})
