import { API_BASE, apiRequest } from './api'

export interface PresignResponse {
	key: string
	uploadUrl: string
	publicUrl: string
}

export interface UploadProgress {
	loaded: number
	total: number
	percent: number
}

/**
 * Ask the server for a presigned S3 upload URL. Returns the object key plus
 * the URL the client should PUT the file to directly.
 */
export async function signUpload(contentType: string, ext?: string): Promise<PresignResponse> {
	return apiRequest<PresignResponse>('/uploads/sign', {
		method: 'POST',
		body: JSON.stringify({ contentType, ext }),
	})
}

/**
 * PUT a file directly to a presigned URL using XMLHttpRequest so we can
 * report upload progress (fetch() doesn't expose it in browsers today).
 * Resolves when the upload completes; rejects on any error or non-2xx.
 */
export function putToPresignedUrl(
	url: string,
	file: File,
	onProgress?: (p: UploadProgress) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open('PUT', url)
		xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable && onProgress) {
				onProgress({
					loaded: e.loaded,
					total: e.total,
					percent: Math.round((e.loaded / e.total) * 100),
				})
			}
		}
		xhr.onerror = () => reject(new Error('upload_network_error'))
		xhr.onabort = () => reject(new Error('upload_aborted'))
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve()
			else reject(new Error(`upload_http_${xhr.status}`))
		}
		xhr.send(file)
	})
}

/**
 * End-to-end helper: sign → PUT. Returns the asset metadata the caller can
 * drop straight into `session.assets`.
 */
export async function uploadFile(
	file: File,
	onProgress?: (p: UploadProgress) => void,
): Promise<{ key: string; publicUrl: string; contentType: string; size: number }> {
	const ext = file.name.includes('.') ? file.name.split('.').pop() : undefined
	const { key, uploadUrl, publicUrl } = await signUpload(
		file.type || 'application/octet-stream',
		ext,
	)
	await putToPresignedUrl(uploadUrl, file, onProgress)
	return { key, publicUrl, contentType: file.type, size: file.size }
}

/** Best-effort kind inference from MIME type. */
export function inferAssetKind(mime: string): 'audio' | 'image' | 'video' | 'audio' {
	if (mime.startsWith('image/')) return 'image'
	if (mime.startsWith('video/')) return 'video'
	return 'audio'
}

// Re-export for convenience in callers that only import one module.
export { API_BASE }
