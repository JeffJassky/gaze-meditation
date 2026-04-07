import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Playlists are user-owned, ordered collections of sessions.
 *
 * Design notes:
 *   - One-way reference: playlist → sessions. The playlist document owns the
 *     ordering via a plain ObjectId[]. Sessions don't carry a back-reference,
 *     which avoids dual writes when a session is added/removed/reordered.
 *   - "Which playlists contain session X?" is a cheap `find({ sessions: X })`
 *     query with the index below.
 *   - Slugs are unique *per owner* so two users can both have /playlists/morning.
 */

export const PLAYLIST_VISIBILITY = ['private', 'public'] as const;

const playlistSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 4000 },

    visibility: { type: String, enum: PLAYLIST_VISIBILITY, default: 'private', index: true },

    // Optional cover. Kept as a plain asset key so we don't couple to the Session.assets model.
    coverImageKey: { type: String, default: null },

    // Ordered list of session ids. Duplicates are allowed (a session can appear twice
    // in a playlist if the owner really wants that); application code can de-dupe.
    sessions: { type: [Schema.Types.ObjectId], ref: 'Session', default: [] },
  },
  { timestamps: true },
);

// Per-owner slug uniqueness.
playlistSchema.index({ owner: 1, slug: 1 }, { unique: true });
// Enables "playlists containing session X" reverse lookups.
playlistSchema.index({ sessions: 1 });

export type PlaylistDoc = HydratedDocument<InferSchemaType<typeof playlistSchema>>;
export const Playlist = model<PlaylistDoc>('Playlist', playlistSchema);

export function publicPlaylist(p: PlaylistDoc) {
  return {
    id: p.id,
    owner: p.owner instanceof Types.ObjectId ? p.owner.toString() : p.owner,
    slug: p.slug,
    title: p.title,
    description: p.description,
    visibility: p.visibility,
    coverImageKey: p.coverImageKey,
    sessions: p.sessions.map((id) =>
      id instanceof Types.ObjectId ? id.toString() : id,
    ),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
