<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile, inferAssetKind, type UploadProgress } from '@/services/uploads'
import type { SessionAsset } from '@/services/sessions'

/**
 * Tiny per-file uploader. Owns its own progress state and emits a finished
 * asset payload upward. Intentionally stateless across mounts — each upload
 * is a fire-and-forget row in the parent list.
 */
const props = defineProps<{ file: File }>()
const emit = defineEmits<{
	done: [asset: Omit<SessionAsset, 'id'>]
	error: [message: string]
}>()

const progress = ref<UploadProgress>({ loaded: 0, total: props.file.size, percent: 0 })
const status = ref<'uploading' | 'done' | 'error'>('uploading')
const errorMsg = ref('')

async function run() {
	try {
		const { key, contentType, size } = await uploadFile(props.file, (p) => {
			progress.value = p
		})
		status.value = 'done'
		emit('done', {
			kind: inferAssetKind(props.file.type || ''),
			key,
			label: props.file.name,
			contentType,
			size,
		})
	} catch (e) {
		status.value = 'error'
		errorMsg.value = (e as Error).message
		emit('error', errorMsg.value)
	}
}

// Auto-start on mount. Parent adds this row the moment a file is picked.
run()
</script>

<template>
	<div class="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
		<div class="flex-1 min-w-0">
			<div class="text-sm text-zinc-200 truncate">{{ file.name }}</div>
			<div class="mt-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
				<div
					class="h-full transition-all"
					:class="{
						'bg-zinc-300': status === 'uploading',
						'bg-emerald-500': status === 'done',
						'bg-red-500': status === 'error',
					}"
					:style="{ width: (status === 'done' ? 100 : progress.percent) + '%' }" />
			</div>
			<div class="text-xs mt-1" :class="status === 'error' ? 'text-red-400' : 'text-zinc-500'">
				<span v-if="status === 'uploading'">{{ progress.percent }}%</span>
				<span v-else-if="status === 'done'">Uploaded</span>
				<span v-else>Error: {{ errorMsg }}</span>
			</div>
		</div>
	</div>
</template>
