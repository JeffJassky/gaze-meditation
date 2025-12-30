import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'

// Helper to normalize audio using ffmpeg
const normalizeAudio = (inputBuffer: Buffer): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const tempId = crypto.randomBytes(16).toString('hex')
		const tempInputPath = path.resolve(__dirname, `node_modules/.cache/temp_in_${tempId}.mp3`)
		const tempOutputPath = path.resolve(__dirname, `node_modules/.cache/temp_out_${tempId}.mp3`)
		
		// Ensure cache dir exists
		const cacheDir = path.dirname(tempInputPath)
		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true })
		}

		fs.writeFileSync(tempInputPath, inputBuffer)

		console.log(`[VoiceMiddleware] Normalizing audio...`)
		
		// ffmpeg -i input.mp3 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 -f mp3 output.mp3
		// Using -y to overwrite if exists
		const ffmpeg = spawn('ffmpeg', [
			'-y',
			'-i', tempInputPath,
			'-filter:a', 'loudnorm=I=-16:TP=-1.5:LRA=11',
			'-f', 'mp3',
			tempOutputPath
		])

		ffmpeg.stderr.on('data', (data) => {
			// ffmpeg logs to stderr
			// console.log(`ffmpeg: ${data}`)
		})

		ffmpeg.on('close', (code) => {
			// Cleanup input
			try { fs.unlinkSync(tempInputPath) } catch(e) {}

			if (code === 0 && fs.existsSync(tempOutputPath)) {
				const outputBuffer = fs.readFileSync(tempOutputPath)
				// Cleanup output
				try { fs.unlinkSync(tempOutputPath) } catch(e) {}
				console.log(`[VoiceMiddleware] Normalization complete. Size: ${outputBuffer.length}`)
				resolve(outputBuffer)
			} else {
				reject(new Error(`ffmpeg exited with code ${code}`))
			}
		})

		ffmpeg.on('error', (err) => {
			try { fs.unlinkSync(tempInputPath) } catch(e) {}
			reject(err)
		})
	})
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Load env variables
	const env = loadEnv(mode, process.cwd(), '')

	const voiceMiddleware = () => ({
		name: 'voice-middleware',
		configureServer(server) {
			// ... (keep existing GET middleware)
			// Middleware to serve generated voice files immediately or 404
			server.middlewares.use((req, res, next) => {
				if (
					req.method === 'GET' &&
					req.url &&
					/\/sessions\/.*\/audio\/voice\/.*\.mp3$/.test(req.url)
				) {
					const publicDir = path.resolve(__dirname, 'public')
					// Prevent directory traversal
					const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '')
					const filePath = path.join(publicDir, safePath)

					console.log(`[VoiceMiddleware] GET Request for: ${req.url}`)

					if (fs.existsSync(filePath)) {
						console.log(`[VoiceMiddleware] Serving existing file: ${filePath}`)
						const stat = fs.statSync(filePath)
						res.writeHead(200, {
							'Content-Type': 'audio/mpeg',
							'Content-Length': stat.size
						})
						fs.createReadStream(filePath).pipe(res)
						return
					} else {
						console.log(`[VoiceMiddleware] File not found (sending 404): ${filePath}`)
						res.statusCode = 404
						res.end('Not Found')
						return
					}
				}
				next()
			})

			server.middlewares.use('/api/voice/generate', async (req, res, next) => {
				if (req.method !== 'POST') {
					next()
					return
				}

				console.log('[VoiceMiddleware] POST /api/voice/generate received')

				let body = ''
				req.on('data', chunk => {
					body += chunk
				})
				req.on('end', async () => {
					try {
						const { text, programId, previousText, nextText } = JSON.parse(body)
						if (!text) {
							console.warn('[VoiceMiddleware] Missing text in request body')
							res.statusCode = 400
							res.end('Missing text')
							return
						}

						const pId = programId || 'default'
						console.log(
							`[VoiceMiddleware] Processing text length: ${text.length} chars for program: ${pId}`
						)

						// Hash logic
						const hash = crypto.createHash('sha256').update(text).digest('hex')
						const fileName = `${hash}.mp3`
						const metaName = `${hash}.json`
						const publicDir = path.resolve(__dirname, 'public')
						const targetDir = path.join(publicDir, 'sessions', pId, 'audio', 'voice')

						if (!fs.existsSync(targetDir)) {
							fs.mkdirSync(targetDir, { recursive: true })
						}

						const filePath = path.join(targetDir, fileName)
						const metaPath = path.join(targetDir, metaName)

						if (fs.existsSync(filePath)) {
							console.log(`[VoiceMiddleware] Serving CACHED file: ${filePath}`)
							const file = fs.readFileSync(filePath)
							res.setHeader('Content-Type', 'audio/mpeg')
							res.end(file)
							return
						}

						// Call ElevenLabs
						const apiKey = env.ELEVENLABS_API_KEY
						const voiceId = env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'

						if (!apiKey) {
							console.error(
								'[VoiceMiddleware] Missing ELEVENLABS_API_KEY in environment variables'
							)
							res.statusCode = 500
							res.end('ELEVENLABS_API_KEY not set')
							return
						}

						console.log(
							`[VoiceMiddleware] Generating voice for hash ${hash.substring(0, 8)}...`
						)

						// Try to find previous request ID if previousText is provided
						let previous_request_ids: string[] | undefined
						if (previousText) {
							try {
								console.log(
									`[VoiceMiddleware] Looking up ID for previousText (len=${
										previousText.length
									}): "${previousText.substring(0, 20)}..."`
								)
								const prevHash = crypto
									.createHash('sha256')
									.update(previousText)
									.digest('hex')
								const prevMetaPath = path.join(targetDir, `${prevHash}.json`)
								console.log(`[VoiceMiddleware] Checking meta path: ${prevMetaPath}`)

								if (fs.existsSync(prevMetaPath)) {
									const prevMetaContent = fs.readFileSync(prevMetaPath, 'utf-8')
									const prevMeta = JSON.parse(prevMetaContent)
									if (prevMeta.request_id) {
										previous_request_ids = [prevMeta.request_id]
										console.log(
											`[VoiceMiddleware] Found previous request ID: ${prevMeta.request_id}`
										)
									} else {
										console.warn(
											'[VoiceMiddleware] Meta file found but no request_id'
										)
									}
								} else {
									console.warn(
										`[VoiceMiddleware] Meta file not found for previous text hash: ${prevHash}`
									)
								}
							} catch (e) {
								console.warn(
									'[VoiceMiddleware] Failed to lookup previous request ID',
									e
								)
							}
						}

						const payload: any = {
							text: text,
							model_id: 'eleven_multilingual_v2',
							voice_settings: {
								stability: 0.75,
								similarity_boost: 0.75
							}
						}

						if (previous_request_ids) {
							payload.previous_request_ids = previous_request_ids
						}

						if (nextText) {
							payload.next_text = nextText
						}

						console.log(
							`[VoiceMiddleware] Calling ElevenLabs API (VoiceID: ${voiceId})`,
							payload
						)
						const startTime = Date.now()
						const elRes = await fetch(
							`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
							{
								method: 'POST',
								headers: {
									'xi-api-key': apiKey,
									'Content-Type': 'application/json'
								},
								body: JSON.stringify(payload)
							}
						)
						const duration = Date.now() - startTime
						console.log(
							`[VoiceMiddleware] ElevenLabs responded in ${duration}ms with status: ${elRes.status}`
						)

						if (!elRes.ok) {
							const err = await elRes.text()
							console.error('[VoiceMiddleware] ElevenLabs Error:', err)
							res.statusCode = 502
							res.end(err)
							return
						}

						// Extract Request ID
						const requestId = elRes.headers.get('request-id')
						if (requestId) {
							console.log(
								`[VoiceMiddleware] Saving metadata with Request ID: ${requestId}`
							)
							fs.writeFileSync(
								metaPath,
								JSON.stringify({ request_id: requestId, text: text })
							)
						}

						const arrayBuffer = await elRes.arrayBuffer()
						let buffer = Buffer.from(arrayBuffer)

						// Normalize Audio with ffmpeg
						try {
							buffer = await normalizeAudio(buffer)
						} catch (normErr) {
							console.error(
								'[VoiceMiddleware] Normalization failed, using raw audio:',
								normErr
							)
						}

						// Save to disk
						console.log(
							`[VoiceMiddleware] Saving audio file (${buffer.length} bytes) to: ${filePath}`
						)
						fs.writeFileSync(filePath, buffer)

						// Return audio
						console.log('[VoiceMiddleware] Returning audio content')
						res.setHeader('Content-Type', 'audio/mpeg')
						res.end(buffer)
					} catch (e) {
						console.error('[VoiceMiddleware] Internal Error:', e)
						res.statusCode = 500
						res.end('Internal Server Error')
					}
				})
			})
		}
	})

	return {
		base: '/',
		plugins: [vue(), voiceMiddleware()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@new': path.resolve(__dirname, './src-new')
			}
		},
		server: {
			headers: {
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp'
			}
		}
	}
})
