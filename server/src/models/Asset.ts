import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A user-owned media asset stored in S3 (DigitalOcean Spaces in practice).
 *
 * Assets live in their own collection — separate from any one session — so
 * that the same file (spiral background, drum loop, voice cache file) can
 * be referenced by multiple sessions without being uploaded twice and
 * without surviving any single session's lifetime on its own.
 *
 * The `meta` field is Mixed so callers can stash arbitrary sidecar data
 * alongside the file itself. For voice-cache files the migration script
 * stores the ElevenLabs sidecar JSON here; the runtime will later use it
 * to skip regeneration.
 */

export const ASSET_KINDS = ['audio', 'image', 'video'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

const assetSchema = new Schema(
  {
    /**
     * Owning user. Assets are per-user scoped: lookups are always
     * `{ owner, ... }`. Two different users can have files at the same
     * S3 key without colliding in this collection (though they'd collide
     * in S3 — callers are expected to namespace their keys by `u/{userId}/…`
     * or similar).
     */
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    /** Broad media category for filtering and validation. */
    kind: { type: String, enum: ASSET_KINDS, required: true, index: true },

    /**
     * S3 object key (path within the bucket). Unique per owner so re-uploads
     * of the same logical file just refresh the same row instead of creating
     * duplicates.
     */
    key: { type: String, required: true },

    /** Human-friendly label shown in the editor's asset picker. */
    label: { type: String, default: '' },

    /** MIME type, e.g. `audio/mpeg`. */
    contentType: { type: String, default: '' },

    /** Size in bytes at upload time. */
    size: { type: Number, default: 0 },

    /**
     * Free-form sidecar metadata. For voice-cache files this holds the
     * ElevenLabs generation response (voice id, model, content hash) so
     * the runtime can skip regeneration; for other kinds it's whatever
     * the uploader wants to preserve.
     *
     * Known conventions used today:
     *   - voice files: `{ kind: 'voice', programId, voiceHash, ...sidecarJson }`
     */
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// One row per (owner, key). Re-uploading the same file is idempotent.
assetSchema.index({ owner: 1, key: 1 }, { unique: true });

// Support lookups like "find all voice-cache entries for this program".
assetSchema.index({ owner: 1, 'meta.kind': 1, 'meta.programId': 1 });
// Lookup by voice hash — the runtime will use this to skip ElevenLabs
// regeneration when a matching cached voice exists.
assetSchema.index({ owner: 1, 'meta.voiceHash': 1 });

export type AssetDoc = HydratedDocument<InferSchemaType<typeof assetSchema>>;
export const Asset = model<AssetDoc>('Asset', assetSchema);

/** Public-safe projection of an asset for API responses. */
export function publicAsset(a: AssetDoc) {
  return {
    id: a.id,
    kind: a.kind,
    key: a.key,
    label: a.label,
    contentType: a.contentType,
    size: a.size,
    meta: a.meta,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
