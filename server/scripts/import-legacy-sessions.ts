#!/usr/bin/env tsx
/**
 * One-shot migration script: import legacy hard-coded session programs from
 * `src/programs/` into the database as per-user SessionDocs, uploading every
 * referenced asset (audio/img/video/voice-cache) to S3 along the way.
 *
 * Data flow:
 *   1. Load ALL_SESSIONS from src/programs/index.ts via dynamic import.
 *   2. For each legacy Session:
 *      a. Walk the session + scenes collecting every referenced asset path.
 *      b. Walk public/sessions/{id}/audio/voice/ for cached voice files.
 *      c. Upload each file to S3, preserving its relative path as the key.
 *      d. Upsert an Asset doc per file (per-user, deduped on (owner, key)).
 *         For voice cache files, the .json sidecar is parsed and merged
 *         into the Asset's `meta` field.
 *      e. Create a SessionDoc via mongoose (bypassing auth) with scene
 *         configs passed through unchanged and an `assets` subdocument
 *         array populated from the uploaded Asset docs.
 *   3. Report summary.
 *
 * Run:
 *   npx tsx scripts/import-legacy-sessions.ts [--dry-run] [--only <id>]
 *                                            [--replace] [--owner-email <email>]
 *
 * Env (read from server/.env):
 *   MONGODB_URI, S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID,
 *   S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL, S3_FORCE_PATH_STYLE
 *
 * Safety:
 *   - `--dry-run` skips all S3 uploads and DB writes and only reports what
 *     WOULD happen. Safe to run repeatedly.
 *   - Non-dry runs default to `--skip-existing`: sessions whose (owner, slug)
 *     already exist are left alone. Pass `--replace` to delete and re-import.
 *   - Asset uploads are deduped by (owner, key), so re-running is cheap.
 */

import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import mongoose, { Types } from 'mongoose'
import {
	S3Client,
	PutObjectCommand,
	HeadObjectCommand,
} from '@aws-sdk/client-s3'

// This script lives under `server/scripts/` so Node's ESM resolver walks up
// to `server/node_modules/` when resolving `mongoose`, `@aws-sdk/client-s3`,
// etc. All disk paths are computed relative to the repo root (two dirs up).
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.resolve(SCRIPT_DIR, '..')
const REPO_ROOT = path.resolve(SERVER_DIR, '..')
const PUBLIC_DIR = path.join(REPO_ROOT, 'public')

// Load env from server/.env without a dotenv dependency. Script lives at
// repo root where dotenv isn't installed; the server has its own copy but
// isn't resolvable from this cwd reliably across tsx versions. Just parse
// the file ourselves.
loadEnvFile(path.join(SERVER_DIR, '.env'))

function loadEnvFile(file: string): void {
	let raw: string
	try {
		raw = fsSync.readFileSync(file, 'utf-8')
	} catch {
		console.warn(`[import] warning: ${file} not found, relying on process.env`)
		return
	}
	for (const line of raw.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eq = trimmed.indexOf('=')
		if (eq === -1) continue
		const key = trimmed.slice(0, eq).trim()
		let value = trimmed.slice(eq + 1).trim()
		// Strip paired surrounding quotes.
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		if (!(key in process.env)) process.env[key] = value
	}
}

// ──────────────────────────────────────────────────────────────────────────
// CLI args
// ──────────────────────────────────────────────────────────────────────────
interface Args {
	dryRun: boolean
	only: string | null
	ownerEmail: string | null
	ownerUsername: string | null
	replace: boolean
	verbose: boolean
}

function parseArgs(): Args {
	const argv = process.argv.slice(2)
	const out: Args = {
		dryRun: false,
		only: null,
		ownerEmail: null,
		ownerUsername: null,
		replace: false,
		verbose: false,
	}
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]!
		if (a === '--dry-run') out.dryRun = true
		else if (a === '--replace') out.replace = true
		else if (a === '--verbose' || a === '-v') out.verbose = true
		else if (a === '--only') out.only = argv[++i] ?? null
		else if (a === '--owner-email') out.ownerEmail = argv[++i] ?? null
		else if (a === '--owner-username') out.ownerUsername = argv[++i] ?? null
		else if (a === '--help' || a === '-h') {
			printHelp()
			process.exit(0)
		} else {
			console.error(`Unknown arg: ${a}`)
			printHelp()
			process.exit(1)
		}
	}
	return out
}

function printHelp() {
	console.log(`\nUsage: npx tsx scripts/import-legacy-sessions.ts [flags]\n
Flags:
  --dry-run                 Don't upload or write to DB, just report.
  --only <legacy-id>        Import only one program (e.g. prog_council_fire).
  --owner-email <email>     Owner user lookup key. Default: first user in DB.
  --owner-username <name>   Alternative owner lookup by username.
  --replace                 Delete existing SessionDoc with matching (owner, slug).
  --verbose, -v             Print every file upload.
  --help, -h                Show this message.\n`)
}

// ──────────────────────────────────────────────────────────────────────────
// S3 client (built from the same env vars the server uses)
// ──────────────────────────────────────────────────────────────────────────
const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT || undefined,
	region: process.env.S3_REGION || 'us-east-1',
	forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
	credentials: {
		accessKeyId: required('S3_ACCESS_KEY_ID'),
		secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
	},
})
const S3_BUCKET = required('S3_BUCKET')

function required(name: string): string {
	const v = process.env[name]
	if (!v) throw new Error(`Missing env var: ${name}`)
	return v
}

// ──────────────────────────────────────────────────────────────────────────
// Types mirroring the legacy Session shape (minimum fields we touch)
// ──────────────────────────────────────────────────────────────────────────
interface LegacySoundboardSample {
	id: string
	path: string
	volume?: number
	loop?: boolean
	fadeInDuration?: number
	fadeOutDuration?: number
}
interface LegacyAudio {
	musicTrack?: string
	binaural?: { hertz?: number; volume?: number }
	soundboard?: LegacySoundboardSample[]
}
interface LegacyScene {
	id?: string
	text?: string | string[]
	voice?: string | string[]
	audio?: {
		binaural?: { hertz?: number; volume?: number }
		fx?: { path?: string; volume?: number; loop?: boolean }
		soundboard?: Array<{ event: 'start' | 'stop'; id: string }>
	}
	behavior?: unknown
	duration?: number
	fadeInDuration?: number
	fadeOutDuration?: number
	cooldown?: number
	theme?: unknown
	elevenlabsVoiceId?: string
}
interface LegacySession {
	id: string
	title: string
	description: string
	isAdult?: boolean
	skipIntro?: boolean
	tags?: string[]
	audio?: LegacyAudio
	videoBackground?: string
	spiralBackground?: string
	scenes: LegacyScene[]
	theme?: unknown
}

// ──────────────────────────────────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────────────────────────────────
interface Report {
	sessionsCreated: string[]
	sessionsSkipped: string[]
	sessionsFailed: Array<{ id: string; reason: string }>
	sessionsReplaced: string[]
	assetsUploaded: number
	assetsDeduped: number
	bytesUploaded: number
	missingFiles: Set<string>
	errors: string[]
}
const report: Report = {
	sessionsCreated: [],
	sessionsSkipped: [],
	sessionsFailed: [],
	sessionsReplaced: [],
	assetsUploaded: 0,
	assetsDeduped: 0,
	bytesUploaded: 0,
	missingFiles: new Set(),
	errors: [],
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────
async function main() {
	const args = parseArgs()

	console.log('[import] connecting to mongo…')
	await mongoose.connect(required('MONGODB_URI'))

	// Load models AFTER mongoose is connected so they bind to the right connection.
	// Use dynamic import so top-of-file parse doesn't fail if server deps
	// haven't been built.
	const { User } = await import(
		pathToFileURL(path.join(SERVER_DIR, 'src/models/User.ts')).href
	)
	const { Session } = await import(
		pathToFileURL(path.join(SERVER_DIR, 'src/models/Session.ts')).href
	)
	const { Asset } = await import(
		pathToFileURL(path.join(SERVER_DIR, 'src/models/Asset.ts')).href
	)

	// Resolve owner
	const owner = await resolveOwner(User, args)
	console.log(
		`[import] owner: ${owner.username} (${owner._id}) ${owner.email ?? '(no email)'}`,
	)

	// Load legacy programs
	const programsIndex = pathToFileURL(
		path.join(REPO_ROOT, 'src/programs/index.ts'),
	).href
	const { ALL_SESSIONS } = (await import(programsIndex)) as {
		ALL_SESSIONS: LegacySession[]
	}

	// Filter: skip the duplicate initial_training (we keep initial_training_short from tutorial.ts).
	// Also skip TEST_SESSIONS — they're development stubs, not legacy content.
	const TEST_IDS = new Set([
		'test_close_eyes',
		'test_open_eyes',
		'test_blink_many',
		'test_nod',
		'test_shake',
		'test_still',
		'test_relax',
		'test_tongue',
		'test_gaze_left',
		'test_gaze_right',
		'test_gaze_up',
		'test_gaze_down',
		'test_motion_move',
		'test_motion_impact',
		'test_speech',
		'test_type',
		'test_form',
	])
	const SKIP_IDS = new Set([
		'initial_training', // duplicate — keep initial_training_short instead
	])

	const toImport = ALL_SESSIONS.filter((s) => {
		if (args.only) return s.id === args.only
		if (SKIP_IDS.has(s.id)) return false
		if (TEST_IDS.has(s.id)) return false
		if (s.id.startsWith('test_')) return false
		return true
	})

	console.log(
		`[import] importing ${toImport.length} session${toImport.length === 1 ? '' : 's'}${args.dryRun ? ' (dry-run)' : ''}`,
	)

	for (const legacy of toImport) {
		try {
			await importSession(legacy, { args, owner, Session, Asset })
		} catch (e) {
			const msg = (e as Error).message
			console.error(`[import] ${legacy.id} FAILED: ${msg}`)
			report.sessionsFailed.push({ id: legacy.id, reason: msg })
		}
	}

	await mongoose.disconnect()
	printReport()
	printFollowupReminder()
}

// ──────────────────────────────────────────────────────────────────────────
// Owner resolution
// ──────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveOwner(User: any, args: Args): Promise<any> {
	if (args.ownerEmail) {
		const u = await User.findOne({ email: args.ownerEmail.toLowerCase() })
		if (!u) throw new Error(`No user found with email ${args.ownerEmail}`)
		return u
	}
	if (args.ownerUsername) {
		const u = await User.findOne({ username: args.ownerUsername })
		if (!u) throw new Error(`No user found with username ${args.ownerUsername}`)
		return u
	}
	// Default: first user in the DB. The current app has a single admin user.
	const u = await User.findOne({}).sort({ createdAt: 1 })
	if (!u)
		throw new Error(
			'No users in database. Register one first, then rerun with --owner-username or --owner-email.',
		)
	return u
}

// ──────────────────────────────────────────────────────────────────────────
// Session import
// ──────────────────────────────────────────────────────────────────────────
interface ImportCtx {
	args: Args
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	owner: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Session: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Asset: any
}

async function importSession(legacy: LegacySession, ctx: ImportCtx) {
	const { args, owner, Session } = ctx
	const slug = slugify(legacy.id)

	console.log(`\n[import] ${legacy.id} → slug=${slug}`)

	// Check existing
	const existing = await Session.findOne({ owner: owner._id, slug })
	if (existing) {
		if (args.replace) {
			if (!args.dryRun) await Session.deleteOne({ _id: existing._id })
			report.sessionsReplaced.push(legacy.id)
			console.log(`[import] ${legacy.id} replacing existing ${existing._id}`)
		} else {
			report.sessionsSkipped.push(legacy.id)
			console.log(`[import] ${legacy.id} already exists — skipping`)
			return
		}
	}

	// Collect + upload assets
	const referencedPaths = collectAssetPaths(legacy)
	const voicePaths = await listVoiceCacheFiles(legacy.id)
	const allPaths = [...referencedPaths, ...voicePaths]

	console.log(
		`[import] ${legacy.id} referenced=${referencedPaths.length} voice-cache=${voicePaths.length}`,
	)

	// Upload each path + build an entry for the session's embedded assets[]
	// subdocument. Dedupe within this session by key so the same file isn't
	// double-listed even if referenced from multiple places.
	const sessionAssetsByKey = new Map<
		string,
		{
			id: string
			kind: 'audio' | 'image' | 'video'
			key: string
			label: string
			contentType: string
			size: number
			meta: Record<string, unknown>
		}
	>()

	for (const p of allPaths) {
		const entry = await uploadAndRegister(p, legacy.id, ctx)
		if (!entry) continue
		if (!sessionAssetsByKey.has(entry.key)) {
			sessionAssetsByKey.set(entry.key, entry)
		}
	}

	// Build the SessionDoc
	const doc = {
		owner: owner._id as Types.ObjectId,
		slug,
		title: legacy.title,
		description: legacy.description || '',
		status: 'draft' as const,
		visibility: 'private' as const,
		audience: 'unspecified',
		tags: legacy.tags ?? [],
		isAdult: legacy.isAdult ?? false,
		theme: legacy.theme ?? {},
		audio: legacy.audio ?? {},
		scenes: legacy.scenes.map((cfg) => ({
			id: cfg.id ?? crypto.randomUUID(),
			type: 'scene',
			label: '',
			config: cfg,
		})),
		assets: Array.from(sessionAssetsByKey.values()),
		settings: {},
	}

	if (args.dryRun) {
		console.log(
			`[import] ${legacy.id} DRY-RUN would create: title="${doc.title}" scenes=${doc.scenes.length} assets=${doc.assets.length}`,
		)
	} else {
		await Session.create(doc)
		console.log(
			`[import] ${legacy.id} CREATED: scenes=${doc.scenes.length} assets=${doc.assets.length}`,
		)
	}
	report.sessionsCreated.push(legacy.id)
}

// ──────────────────────────────────────────────────────────────────────────
// Path collection
// ──────────────────────────────────────────────────────────────────────────
function collectAssetPaths(s: LegacySession): string[] {
	const paths = new Set<string>()
	const add = (p: unknown) => {
		if (typeof p === 'string' && p.length > 0) paths.add(p)
	}

	add(s.audio?.musicTrack)
	for (const sb of s.audio?.soundboard ?? []) add(sb.path)
	add(s.spiralBackground)
	add(s.videoBackground)

	for (const scene of s.scenes ?? []) {
		add(scene.audio?.fx?.path)
	}

	return Array.from(paths)
}

async function listVoiceCacheFiles(programId: string): Promise<string[]> {
	const dir = path.join(PUBLIC_DIR, 'sessions', programId, 'audio', 'voice')
	try {
		const entries = await fs.readdir(dir)
		return entries
			.filter((f) => f.endsWith('.mp3'))
			.map((f) => `/sessions/${programId}/audio/voice/${f}`)
	} catch {
		return []
	}
}

// ──────────────────────────────────────────────────────────────────────────
// Upload + Asset registration
// ──────────────────────────────────────────────────────────────────────────
interface UploadEntry {
	id: string
	kind: 'audio' | 'image' | 'video'
	key: string
	label: string
	contentType: string
	size: number
	meta: Record<string, unknown>
}

async function uploadAndRegister(
	relPath: string,
	programId: string,
	ctx: ImportCtx,
): Promise<UploadEntry | null> {
	const { args, owner, Asset } = ctx

	// Resolve on disk. Legacy paths are absolute-rooted (/audio/…, /sessions/…)
	// that map into public/…
	const onDisk = path.join(PUBLIC_DIR, relPath.replace(/^\//, ''))
	let stat
	try {
		stat = await fs.stat(onDisk)
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			report.missingFiles.add(relPath)
			return null
		}
		throw e
	}

	// S3 key = relative path without leading slash, so files keep their
	// original locations inside the bucket. This lets the existing runtime
	// fetch them via a base-URL prefix without any path rewriting.
	const key = relPath.replace(/^\//, '')
	const contentType = guessContentType(relPath)
	const kind = kindForContentType(contentType)

	// Check existing Asset doc
	const existing = await Asset.findOne({ owner: owner._id, key })

	// Build meta: for voice-cache files, merge the sidecar JSON and tag
	// with the programId + voice hash so later lookups can find them.
	const meta: Record<string, unknown> = {}
	if (relPath.endsWith('.mp3')) {
		const sidecarOnDisk = onDisk.replace(/\.mp3$/, '.json')
		try {
			const raw = await fs.readFile(sidecarOnDisk, 'utf-8')
			Object.assign(meta, JSON.parse(raw))
		} catch {
			/* no sidecar — fine */
		}
		const basename = path.basename(relPath, '.mp3')
		if (/^[a-f0-9]{64}$/.test(basename)) {
			meta.kind = 'voice'
			meta.programId = programId
			meta.voiceHash = basename
		}
	}

	if (existing) {
		report.assetsDeduped++
		if (args.verbose) console.log(`  dedupe ${key}`)
		return {
			id: existing.id,
			kind: existing.kind as UploadEntry['kind'],
			key: existing.key,
			label: existing.label ?? path.basename(relPath),
			contentType: existing.contentType ?? contentType,
			size: existing.size ?? stat.size,
			meta: (existing.meta as Record<string, unknown>) ?? meta,
		}
	}

	// Check S3 too in case we uploaded earlier but the Asset doc is missing
	// (partial previous run). If the object exists, skip re-uploading bytes.
	let alreadyInS3 = false
	if (!args.dryRun) {
		try {
			await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }))
			alreadyInS3 = true
		} catch {
			/* not present */
		}
	}

	if (!args.dryRun && !alreadyInS3) {
		const body = await fs.readFile(onDisk)
		await s3.send(
			new PutObjectCommand({
				Bucket: S3_BUCKET,
				Key: key,
				Body: body,
				ContentType: contentType,
				ACL: 'public-read',
			}),
		)
	}

	const id = crypto.randomUUID()
	const entry: UploadEntry = {
		id,
		kind,
		key,
		label: path.basename(relPath),
		contentType,
		size: stat.size,
		meta,
	}

	if (!args.dryRun) {
		await Asset.create({
			owner: owner._id,
			kind,
			key,
			label: entry.label,
			contentType,
			size: stat.size,
			meta,
		})
	}

	report.assetsUploaded++
	report.bytesUploaded += stat.size
	if (args.verbose)
		console.log(
			`  upload ${key} (${contentType}, ${(stat.size / 1024).toFixed(1)}KB)`,
		)

	return entry
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────
function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/^prog_/, '') // prog_council_fire → council-fire
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64)
}

function guessContentType(p: string): string {
	const ext = path.extname(p).toLowerCase()
	switch (ext) {
		case '.mp3':
			return 'audio/mpeg'
		case '.wav':
			return 'audio/wav'
		case '.ogg':
			return 'audio/ogg'
		case '.m4a':
			return 'audio/mp4'
		case '.png':
			return 'image/png'
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg'
		case '.webp':
			return 'image/webp'
		case '.gif':
			return 'image/gif'
		case '.svg':
			return 'image/svg+xml'
		case '.mp4':
			return 'video/mp4'
		case '.webm':
			return 'video/webm'
		case '.mov':
			return 'video/quicktime'
		default:
			return 'application/octet-stream'
	}
}

function kindForContentType(ct: string): 'audio' | 'image' | 'video' {
	if (ct.startsWith('audio/')) return 'audio'
	if (ct.startsWith('image/')) return 'image'
	if (ct.startsWith('video/')) return 'video'
	// Fallback — assume audio since the vast majority of legacy assets are.
	return 'audio'
}

// ──────────────────────────────────────────────────────────────────────────
// Reporting
// ──────────────────────────────────────────────────────────────────────────
function printReport() {
	console.log('\n══ import report ════════════════════════════════════════')
	console.log(
		`sessions created : ${report.sessionsCreated.length} ${
			report.sessionsCreated.length ? '(' + report.sessionsCreated.join(', ') + ')' : ''
		}`,
	)
	if (report.sessionsReplaced.length) {
		console.log(
			`sessions replaced: ${report.sessionsReplaced.length} (${report.sessionsReplaced.join(', ')})`,
		)
	}
	if (report.sessionsSkipped.length) {
		console.log(
			`sessions skipped : ${report.sessionsSkipped.length} (${report.sessionsSkipped.join(', ')})`,
		)
	}
	if (report.sessionsFailed.length) {
		console.log(`sessions failed  : ${report.sessionsFailed.length}`)
		for (const f of report.sessionsFailed) {
			console.log(`  ${f.id}: ${f.reason}`)
		}
	}
	console.log(`assets uploaded  : ${report.assetsUploaded}`)
	console.log(`assets deduped   : ${report.assetsDeduped}`)
	console.log(
		`bytes uploaded   : ${(report.bytesUploaded / (1024 * 1024)).toFixed(2)} MB`,
	)
	if (report.missingFiles.size > 0) {
		console.log(`\nmissing files referenced (${report.missingFiles.size}):`)
		for (const f of report.missingFiles) console.log(`  - ${f}`)
	}
	if (report.errors.length > 0) {
		console.log(`\nerrors:`)
		for (const e of report.errors) console.log(`  - ${e}`)
	}
	console.log('══════════════════════════════════════════════════════════')
}

function printFollowupReminder() {
	console.log(`
Next steps (not automated):
  1. In the Vue client, add a helper that rewrites absolute-rooted asset
     paths (/sessions, /audio, /img) to ${process.env.S3_PUBLIC_BASE_URL || '$S3_PUBLIC_BASE_URL'}.
     Call it from audioSession.loadBuffer() and any <img :src> bound to a
     legacy path so imported sessions actually resolve.
  2. Set VITE_S3_PUBLIC_BASE_URL in your .env if you want the helper to
     be tweakable per-environment.
  3. Once the runtime lookup is wired, add an /api/assets route and
     refactor SceneAudioPanel to pick by asset id rather than path. That's
     Phase 2 — the Asset collection is already populated and ready.
`)
}

// ──────────────────────────────────────────────────────────────────────────
// Go
// ──────────────────────────────────────────────────────────────────────────
main().catch((e) => {
	console.error(e)
	process.exit(1)
})
