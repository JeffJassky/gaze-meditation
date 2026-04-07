import crypto from 'node:crypto';
import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Sessions are stored as a single document with an embedded `scenes` array.
 *
 * Why embedded?
 *   - Scenes are always loaded/edited together with their session.
 *   - The block editor mutates the full scene array on save (reorders, paste-imports, etc).
 *   - Mongo's 16MB doc cap is comfortably larger than any realistic session payload.
 *
 * Why `Schema.Types.Mixed` for `scene.config`?
 *   - The block editor needs to evolve (new visual/audio/behavior block types, new settings)
 *     without a schema migration each time.
 *   - We still enforce `id`, `type`, and `label` at the top of the subdoc so the editor has
 *     stable keys for drag/drop, undo, and reordering.
 *   - Callers must `markModified('scenes')` when mutating nested `config` fields in-place;
 *     replacing the whole `scenes` array (which is how the editor will save) is fine.
 */

// --- Enums / constants --------------------------------------------------------

export const SESSION_STATUS = ['draft', 'published'] as const;
export const SESSION_VISIBILITY = ['private', 'public'] as const;
/**
 * Audience categorization. `f4a` = "female for all", etc.
 * Kept loose — add values here as the taxonomy grows.
 */
export const SESSION_AUDIENCE = [
  'f4a',
  'm4a',
  'm4f',
  'm4m',
  'f4f',
  'f4m',
  't4a',
  't4f',
  't4m',
  'unspecified',
] as const;

export const ASSET_KINDS = ['audio', 'image', 'video'] as const;

// --- Asset subdocument --------------------------------------------------------

/**
 * An asset uploaded by the session author. The `key` is the S3 object key returned
 * by POST /uploads/sign. Scenes reference assets by `id` (not raw URL) so that a
 * re-upload under a new key doesn't break scene wiring.
 */
const assetSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    kind: { type: String, enum: ASSET_KINDS, required: true },
    key: { type: String, required: true },
    label: { type: String, default: '' },
    contentType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

// --- Scene subdocument --------------------------------------------------------

const sceneSchema = new Schema(
  {
    // Stable client-generated id (UUID). Used by the editor for drag/drop, undo,
    // targeting a scene for patch updates, and for scene-level branching/jumps.
    id: { type: String, required: true, default: () => crypto.randomUUID() },
    // e.g. 'scene', 'form', 'intro', 'outro' — free-form string so the editor can
    // introduce new block types without a schema change.
    type: { type: String, required: true, default: 'scene' },
    // Editor-facing display name; does not affect runtime behavior.
    label: { type: String, default: '' },
    // The full scene payload: text, voice, audio, behavior suggestions, theme, etc.
    // Shape tracks the client-side SceneConfig interface and may evolve freely.
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

// --- Session --------------------------------------------------------

const sessionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // URL-safe handle, unique per owner so two users can both have /sessions/morning.
    slug: { type: String, required: true, trim: true, lowercase: true },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 4000 },

    status: { type: String, enum: SESSION_STATUS, default: 'draft', index: true },
    visibility: { type: String, enum: SESSION_VISIBILITY, default: 'private', index: true },
    publishedAt: { type: Date, default: null },

    // Categorization
    audience: { type: String, enum: SESSION_AUDIENCE, default: 'unspecified', index: true },
    tags: { type: [String], default: [], index: true },
    isAdult: { type: Boolean, default: false, index: true },

    // Presentation defaults (session-level; individual scenes may override)
    theme: { type: Schema.Types.Mixed, default: {} },
    coverAssetId: { type: String, default: null },

    // Session-level audio config (music track, binaural base, soundboard samples, etc).
    // Kept Mixed so the editor can add new fields without migrations.
    audio: { type: Schema.Types.Mixed, default: {} },

    // Default ElevenLabs voice id for this session's spoken text.
    // Individual scenes may override via scene.config.elevenlabsVoiceId.
    elevenlabsVoiceId: { type: String, default: null },

    // All file assets the session references. Scenes link to these by asset.id.
    assets: { type: [assetSchema], default: [] },

    // Ordered scene list.
    scenes: { type: [sceneSchema], default: [] },

    // Freeform extension point for future editor features (e.g. per-session
    // flags, experiment configs) without touching the schema.
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Per-owner slug uniqueness. Two owners can reuse the same slug.
sessionSchema.index({ owner: 1, slug: 1 }, { unique: true });
// Public discovery listings — filter by status+visibility, sort by publishedAt.
sessionSchema.index({ status: 1, visibility: 1, publishedAt: -1 });
// Full-text search across title/description/tags for the public catalog.
sessionSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } },
);

export type SessionDoc = HydratedDocument<InferSchemaType<typeof sessionSchema>>;
export const Session = model<SessionDoc>('Session', sessionSchema);

// --- Helpers --------------------------------------------------------

/**
 * Public-safe projection of a session. Excludes nothing sensitive today, but
 * gives us one place to adjust what the API exposes.
 */
export function publicSession(s: SessionDoc) {
  return {
    id: s.id,
    owner: s.owner instanceof Types.ObjectId ? s.owner.toString() : s.owner,
    slug: s.slug,
    title: s.title,
    description: s.description,
    status: s.status,
    visibility: s.visibility,
    publishedAt: s.publishedAt,
    audience: s.audience,
    tags: s.tags,
    isAdult: s.isAdult,
    theme: s.theme,
    coverAssetId: s.coverAssetId,
    audio: s.audio,
    elevenlabsVoiceId: s.elevenlabsVoiceId,
    assets: s.assets,
    scenes: s.scenes,
    settings: s.settings,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
