<script setup lang="ts">
import { ref } from 'vue'
import { su } from '@/components/ui/studioUi'
import SessionAssetUploader from './SessionAssetUploader.vue'
import type { SessionAsset, Session } from '@/api/sessions'

const session = defineModel<Session>({ required: true })

/**
 * Local list of files currently uploading. Each one mounts a
 * SessionAssetUploader which drives its own progress; on completion we
 * merge the finished asset into session.assets (the parent editor will
 * then persist on Save).
 */
const inFlight = ref<{ id: string; file: File }[]>([])

function onPick(e: Event) {
	const input = e.target as HTMLInputElement
	if (!input.files) return
	for (const file of Array.from(input.files)) {
		inFlight.value.push({ id: crypto.randomUUID(), file })
	}
	input.value = ''
}

function onDone(
	rowId: string,
	asset: Omit<SessionAsset, 'id'> & { id?: string },
) {
	// Prefer the id returned by /api/assets so the embedded subdoc entry
	// and the shared Asset doc stay in lockstep. Fall back to a locally
	// generated UUID if registration failed so the editor still functions.
	const id = asset.id ?? crypto.randomUUID()
	const { id: _ignored, ...rest } = asset
	session.value.assets.push({ id, ...rest })
	inFlight.value = inFlight.value.filter((r) => r.id !== rowId)
}

function onError(rowId: string) {
	// Keep failed rows visible so the user can see the reason; they can
	// dismiss by re-picking or by hitting the X.
	setTimeout(() => {
		inFlight.value = inFlight.value.filter((r) => r.id !== rowId)
	}, 4000)
}

function removeAsset(assetId: string) {
	session.value.assets = session.value.assets.filter((a) => a.id !== assetId)
	if (session.value.coverAssetId === assetId) session.value.coverAssetId = null
}

function setCover(assetId: string) {
	session.value.coverAssetId = assetId
}

function kindIcon(kind: string): string {
	return kind === 'image' ? '🖼' : kind === 'video' ? '🎬' : '🎵'
}
</script>

<template>
	<section :class="su.card">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h2 :class="su.h2">Assets</h2>
				<p class="text-xs text-content-tertiary mt-1">
					Upload audio, images, or video. Scenes reference assets by id — re-uploads stay wired.
				</p>
			</div>
			<label :class="[su.btnSecondary, 'cursor-pointer']">
				+ Upload files
				<input type="file" multiple class="hidden" @change="onPick" />
			</label>
		</div>

		<div v-if="inFlight.length" class="grid gap-2 mb-4">
			<SessionAssetUploader
				v-for="row in inFlight"
				:key="row.id"
				:file="row.file"
				@done="(a) => onDone(row.id, a)"
				@error="() => onError(row.id)" />
		</div>

		<div
			v-if="session.assets.length === 0 && inFlight.length === 0"
			class="text-sm text-content-tertiary py-6 text-center border border-dashed border-edge rounded-lg">
			No assets yet.
		</div>

		<div v-else class="grid gap-2">
			<div
				v-for="asset in session.assets"
				:key="asset.id"
				class="flex items-center gap-3 bg-surface border border-edge rounded-lg px-3 py-2">
				<span class="text-xl">{{ kindIcon(asset.kind) }}</span>
				<div class="flex-1 min-w-0">
					<div class="text-sm text-content truncate">{{ asset.label || asset.key }}</div>
					<div class="text-xs text-content-tertiary truncate">
						{{ asset.contentType }} · {{ asset.kind }}
					</div>
				</div>
				<button
					v-if="asset.kind === 'image'"
					:class="su.btnGhost"
					@click="setCover(asset.id)">
					{{ session.coverAssetId === asset.id ? '★ Cover' : 'Set cover' }}
				</button>
				<button :class="su.btnDanger" @click="removeAsset(asset.id)">Remove</button>
			</div>
		</div>
	</section>
</template>
