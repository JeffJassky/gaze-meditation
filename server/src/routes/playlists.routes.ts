import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../auth/middleware.js';
import {
  Playlist,
  publicPlaylist,
  PLAYLIST_VISIBILITY,
  type PlaylistDoc,
} from '../models/Playlist.js';
import { Session, publicSession } from '../models/Session.js';
import { uniqueOwnerSlug } from '../lib/slug.js';
import type { UserDoc } from '../models/User.js';

export const playlistsRouter = Router();

// ---------- helpers ----------

function currentUserId(req: Express.Request): string | null {
  const u = req.user as UserDoc | undefined;
  return u ? u.id : null;
}

function isOwner(p: PlaylistDoc, userId: string | null): boolean {
  return !!userId && String(p.owner) === userId;
}

function canRead(p: PlaylistDoc, userId: string | null): boolean {
  if (isOwner(p, userId)) return true;
  return p.visibility === 'public';
}

const PATCHABLE_FIELDS = [
  'title',
  'description',
  'visibility',
  'coverImageKey',
  'sessions',
] as const;

/**
 * Given a list of session ids the client wants to put on a playlist, return
 * the sanitized ObjectId list. Any id the owner isn't allowed to place (not
 * theirs AND not published+public) is dropped.
 */
async function filterPlaceableSessions(
  ids: unknown,
  ownerId: string,
): Promise<Types.ObjectId[]> {
  if (!Array.isArray(ids)) return [];
  const objectIds = ids
    .map((id) => (typeof id === 'string' && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null))
    .filter((v): v is Types.ObjectId => v !== null);

  if (objectIds.length === 0) return [];

  // One query to fetch just enough info to permission-check each candidate.
  const sessions = await Session.find(
    { _id: { $in: objectIds } },
    { owner: 1, status: 1, visibility: 1 },
  );
  const allowed = new Set(
    sessions
      .filter(
        (s) =>
          String(s.owner) === ownerId ||
          (s.status === 'published' && s.visibility === 'public'),
      )
      .map((s) => s.id),
  );

  // Preserve the caller's ordering while filtering out disallowed ids.
  return objectIds.filter((id) => allowed.has(id.toString()));
}

// ---------- list ----------

/**
 * GET /playlists
 *
 * Query params:
 *   mine=1      → caller's own playlists (requires auth)
 *   owner=<id>  → a specific owner's playlists
 *   limit, page
 *
 * Non-owners can only see public playlists.
 */
playlistsRouter.get('/', async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const { mine, owner, limit: limitRaw, page: pageRaw } = req.query as Record<
      string,
      string | undefined
    >;

    const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);
    const page = Math.max(Number(pageRaw) || 1, 1);

    const filter: Record<string, unknown> = {};

    if (mine === '1' || mine === 'true') {
      if (!userId) return res.status(401).json({ error: 'unauthorized' });
      filter.owner = new Types.ObjectId(userId);
    } else if (owner) {
      if (!Types.ObjectId.isValid(owner))
        return res.status(400).json({ error: 'invalid_owner' });
      filter.owner = new Types.ObjectId(owner);
      if (owner !== userId) filter.visibility = 'public';
    } else {
      filter.visibility = 'public';
    }

    const [items, total] = await Promise.all([
      Playlist.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Playlist.countDocuments(filter),
    ]);

    res.json({
      items: items.map(publicPlaylist),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- read one ----------

/**
 * GET /playlists/:id?populate=1
 *
 * With `populate=1`, returns an extra `sessionDocs` array of full session
 * objects (filtered to the ones the current viewer is allowed to see).
 */
playlistsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'not_found' });
    const userId = currentUserId(req);
    if (!canRead(playlist, userId)) return res.status(403).json({ error: 'forbidden' });

    const body: Record<string, unknown> = publicPlaylist(playlist);

    if (req.query.populate === '1' || req.query.populate === 'true') {
      const sessions = await Session.find({ _id: { $in: playlist.sessions } });
      const visible = sessions.filter(
        (s) =>
          (userId && String(s.owner) === userId) ||
          (s.status === 'published' && s.visibility === 'public'),
      );
      // Preserve playlist ordering when returning populated docs.
      const byId = new Map(visible.map((s) => [s.id, s]));
      body.sessionDocs = playlist.sessions
        .map((id) => byId.get(id.toString()))
        .filter(Boolean)
        .map((s) => publicSession(s!));
    }

    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------- create ----------

playlistsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'title_required' });

    const desiredSlug =
      typeof body.slug === 'string' && body.slug.trim() ? body.slug : title;
    const slug = await uniqueOwnerSlug(Playlist, user._id, desiredSlug);

    const doc: Record<string, unknown> = { owner: user._id, title, slug };
    if (typeof body.description === 'string') doc.description = body.description;
    if (
      typeof body.visibility === 'string' &&
      PLAYLIST_VISIBILITY.includes(body.visibility as typeof PLAYLIST_VISIBILITY[number])
    ) {
      doc.visibility = body.visibility;
    }
    if (typeof body.coverImageKey === 'string') doc.coverImageKey = body.coverImageKey;
    if (Array.isArray(body.sessions)) {
      doc.sessions = await filterPlaceableSessions(body.sessions, user.id);
    }

    const playlist = await Playlist.create(doc);
    res.status(201).json(publicPlaylist(playlist));
  } catch (err) {
    next(err);
  }
});

// ---------- update ----------

playlistsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'not_found' });
    const userId = currentUserId(req);
    if (!isOwner(playlist, userId)) return res.status(403).json({ error: 'forbidden' });

    const body = (req.body ?? {}) as Record<string, unknown>;

    for (const field of PATCHABLE_FIELDS) {
      if (body[field] === undefined) continue;
      if (
        field === 'visibility' &&
        !PLAYLIST_VISIBILITY.includes(body[field] as typeof PLAYLIST_VISIBILITY[number])
      ) {
        return res.status(400).json({ error: 'invalid_visibility' });
      }
      if (field === 'sessions') {
        playlist.sessions = await filterPlaceableSessions(body.sessions, userId!);
        continue;
      }
      (playlist as unknown as Record<string, unknown>)[field] = body[field];
    }

    if (typeof body.slug === 'string' && body.slug.trim() && body.slug !== playlist.slug) {
      playlist.slug = await uniqueOwnerSlug(Playlist, playlist.owner, body.slug, playlist._id);
    }

    await playlist.save();
    res.json(publicPlaylist(playlist));
  } catch (err) {
    next(err);
  }
});

// ---------- delete ----------

playlistsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(playlist, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });
    await playlist.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- add / remove single session (convenience) ----------

/**
 * POST /playlists/:id/sessions
 * body: { sessionId, position? }  (position = 0-indexed; default = end)
 */
playlistsRouter.post('/:id/sessions', requireAuth, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'not_found' });
    const userId = currentUserId(req);
    if (!isOwner(playlist, userId)) return res.status(403).json({ error: 'forbidden' });

    const { sessionId, position } = req.body ?? {};
    if (!sessionId || !Types.ObjectId.isValid(sessionId))
      return res.status(400).json({ error: 'invalid_session_id' });

    // Permission-check the add via the same helper used for bulk replace.
    const [allowed] = await filterPlaceableSessions([sessionId], userId!);
    if (!allowed) return res.status(403).json({ error: 'session_not_placeable' });

    const at =
      typeof position === 'number' && position >= 0 && position <= playlist.sessions.length
        ? position
        : playlist.sessions.length;
    playlist.sessions.splice(at, 0, allowed);
    await playlist.save();
    res.json(publicPlaylist(playlist));
  } catch (err) {
    next(err);
  }
});

/** DELETE /playlists/:id/sessions/:sessionId — removes the first occurrence. */
playlistsRouter.delete('/:id/sessions/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(playlist, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });

    const idx = playlist.sessions.findIndex((s) => String(s) === req.params.sessionId);
    if (idx === -1) return res.status(404).json({ error: 'session_not_in_playlist' });
    playlist.sessions.splice(idx, 1);
    await playlist.save();
    res.json(publicPlaylist(playlist));
  } catch (err) {
    next(err);
  }
});
