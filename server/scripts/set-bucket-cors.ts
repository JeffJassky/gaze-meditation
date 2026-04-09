#!/usr/bin/env tsx
/**
 * Sets the CORS configuration on the DigitalOcean Spaces bucket so the
 * Vue client at `http://localhost:5173` (and the future production
 * origin) can fetch audio + image assets directly.
 *
 * Run once after creating the bucket or whenever the allowed origins list
 * needs updating. Idempotent — overwrites whatever was there.
 *
 *   ./node_modules/.bin/tsx scripts/set-bucket-cors.ts
 */

import path from 'node:path'
import fsSync from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
	S3Client,
	PutBucketCorsCommand,
	GetBucketCorsCommand,
} from '@aws-sdk/client-s3'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.resolve(SCRIPT_DIR, '..')

// Load env from server/.env without a dotenv dependency.
loadEnvFile(path.join(SERVER_DIR, '.env'))

function loadEnvFile(file: string): void {
	let raw: string
	try {
		raw = fsSync.readFileSync(file, 'utf-8')
	} catch {
		console.warn(`[cors] warning: ${file} not found, relying on process.env`)
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

function required(name: string): string {
	const v = process.env[name]
	if (!v) throw new Error(`Missing env var: ${name}`)
	return v
}

// NOTE: DO Spaces sometimes rejects bucket-level operations like
// PutBucketCors unless path-style addressing is forced. Override whatever
// the server has configured for this one script.
const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT || undefined,
	region: process.env.S3_REGION || 'us-east-1',
	forcePathStyle: true,
	credentials: {
		accessKeyId: required('S3_ACCESS_KEY_ID'),
		secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
	},
})
const BUCKET = required('S3_BUCKET')

/**
 * Allowed origins. Locked to the known dev origin plus `*` as a sane
 * default. If you need to support additional production origins, add
 * them here and rerun. Wildcarding keeps hotlink / direct-fetch audio
 * working from anywhere, which is appropriate for public-read session
 * assets.
 */
const ALLOWED_ORIGINS = [
	'http://localhost:5173',
	'http://localhost:3000',
	'*',
]

async function main() {
	console.log(`[cors] bucket: ${BUCKET}`)
	console.log(`[cors] allowed origins:`, ALLOWED_ORIGINS)

	await s3.send(
		new PutBucketCorsCommand({
			Bucket: BUCKET,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedHeaders: ['*'],
						AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST'],
						AllowedOrigins: ALLOWED_ORIGINS,
						ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
						MaxAgeSeconds: 3600,
					},
				],
			},
		}),
	)
	console.log('[cors] PUT ok')

	// Read back for verification.
	const got = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }))
	console.log('[cors] current config:')
	console.log(JSON.stringify(got.CORSRules, null, 2))
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
