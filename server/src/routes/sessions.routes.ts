import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../auth/middleware.js';
import {
  Session,
  publicSession,
  SESSION_AUDIENCE,
  SESSION_VISIBILITY,
  VOICE_ORIGIN,
  VOICE_STRUCTURE,
  type SessionDoc,
} from '../models/Session.js';
import { uniqueOwnerSlug } from '../lib/slug.js';
import type { UserDoc } from '../models/User.js';

export const sessionsRouter = Router();

// ---------- helpers ----------

function currentUserId(req: Express.Request): string | null {
  const u = req.user as UserDoc | undefined;
  return u ? u.id : null;
}

function isOwner(session: SessionDoc, userId: string | null): boolean {
  return !!userId && String(session.owner) === userId;
}

/** A non-owner can only read sessions that are both published AND public. */
function canRead(session: SessionDoc, userId: string | null): boolean {
  if (isOwner(session, userId)) return true;
  return session.status === 'published' && session.visibility === 'public';
}

/**
 * Whitelist of fields a client may PATCH on a session. Keeps owner/createdAt
 * untouchable and gives us one place to extend as the editor grows.
 */
const PATCHABLE_FIELDS = [
  'title',
  'description',
  'visibility',
  'audience',
  'tags',
  'isAdult',
  'theme',
  'coverAssetId',
  'audio',
  'elevenlabsVoiceId',
  'voiceOrigin',
  'voiceStructure',
  'masterAudio',
  'assets',
  'scenes',
  'settings',
] as const;

// ---------- list ----------

/**
 * GET /sessions
 *
 * Query params:
 *   mine=1         → only the caller's sessions (requires auth)
 *   owner=<id>     → sessions owned by a specific user
 *   audience=f4a   → filter by audience
 *   tag=foo        → filter by a single tag
 *   q=foo          → full-text search (title/description/tags)
 *   status=draft   → only meaningful with mine=1 (non-owners can't see drafts)
 *   limit, page
 *
 * Non-owners only ever see `{status: published, visibility: public}`.
 */
sessionsRouter.get('/', async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const {
      mine,
      owner,
      audience,
      tag,
      q,
      status,
      limit: limitRaw,
      page: pageRaw,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);
    const page = Math.max(Number(pageRaw) || 1, 1);

    const filter: Record<string, unknown> = {};

    if (mine === '1' || mine === 'true') {
      if (!userId) return res.status(401).json({ error: 'unauthorized' });
      filter.owner = new Types.ObjectId(userId);
      if (status) filter.status = status;
    } else if (owner) {
      if (!Types.ObjectId.isValid(owner))
        return res.status(400).json({ error: 'invalid_owner' });
      filter.owner = new Types.ObjectId(owner);
      // Non-owners viewing someone else's sessions only see published+public.
      if (owner !== userId) {
        filter.status = 'published';
        filter.visibility = 'public';
      } else if (status) {
        filter.status = status;
      }
    } else {
      filter.status = 'published';
      filter.visibility = 'public';
    }

    if (audience) filter.audience = audience;
    if (tag) filter.tags = tag;
    if (q) (filter as Record<string, unknown>).$text = { $search: q };

    const [items, total] = await Promise.all([
      Session.find(filter)
        .sort(q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Session.countDocuments(filter),
    ]);

    res.json({
      items: items.map(publicSession),
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

/** Resolve a session by slug or ObjectId for backward compat. */
sessionsRouter.get('/:idOrSlug', async (req, res, next) => {
  try {
    const param = String(req.params.idOrSlug);
    const session = Types.ObjectId.isValid(param)
      ? await Session.findById(param)
      : await Session.findOne({ slug: param });
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (!canRead(session, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });
    res.json(publicSession(session));
  } catch (err) {
    next(err);
  }
});

// ---------- create ----------

sessionsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'title_required' });

    // Slug: explicit if provided, else derived from title; always unique per owner.
    const desiredSlug =
      typeof body.slug === 'string' && body.slug.trim() ? body.slug : title;
    const slug = await uniqueOwnerSlug(Session, user._id, desiredSlug);

    const doc: Record<string, unknown> = { owner: user._id, title, slug };
    for (const field of PATCHABLE_FIELDS) {
      if (field === 'title') continue; // handled above
      if (body[field] !== undefined) doc[field] = body[field];
    }

    const session = await Session.create(doc);
    res.status(201).json(publicSession(session));
  } catch (err) {
    next(err);
  }
});

// ---------- update ----------

sessionsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(session, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });

    const body = (req.body ?? {}) as Record<string, unknown>;

    // Apply whitelisted top-level fields.
    for (const field of PATCHABLE_FIELDS) {
      if (body[field] === undefined) continue;
      if (field === 'visibility' && !SESSION_VISIBILITY.includes(body[field] as typeof SESSION_VISIBILITY[number]))
        return res.status(400).json({ error: 'invalid_visibility' });
      if (field === 'audience' && !SESSION_AUDIENCE.includes(body[field] as typeof SESSION_AUDIENCE[number]))
        return res.status(400).json({ error: 'invalid_audience' });
      if (field === 'voiceOrigin' && !VOICE_ORIGIN.includes(body[field] as typeof VOICE_ORIGIN[number]))
        return res.status(400).json({ error: 'invalid_voice_origin' });
      if (field === 'voiceStructure' && !VOICE_STRUCTURE.includes(body[field] as typeof VOICE_STRUCTURE[number]))
        return res.status(400).json({ error: 'invalid_voice_structure' });
      (session as unknown as Record<string, unknown>)[field] = body[field];
    }

    // Explicit slug change, re-uniquified per owner.
    if (typeof body.slug === 'string' && body.slug.trim() && body.slug !== session.slug) {
      session.slug = await uniqueOwnerSlug(Session, session.owner, body.slug, session._id);
    }

    // `scenes`, `assets`, `audio`, `theme`, `settings` are Mixed/array — marking
    // them modified ensures Mongoose serializes replacements and nested changes.
    for (const f of ['scenes', 'assets', 'audio', 'theme', 'settings', 'masterAudio'] as const) {
      if (body[f] !== undefined) session.markModified(f);
    }

    await session.save();
    res.json(publicSession(session));
  } catch (err) {
    next(err);
  }
});

// ---------- delete ----------

sessionsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(session, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });
    await session.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- publish / unpublish ----------

sessionsRouter.post('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(session, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });
    session.status = 'published';
    session.publishedAt = session.publishedAt ?? new Date();
    await session.save();
    res.json(publicSession(session));
  } catch (err) {
    next(err);
  }
});

sessionsRouter.post('/:id/unpublish', requireAuth, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (!isOwner(session, currentUserId(req)))
      return res.status(403).json({ error: 'forbidden' });
    session.status = 'draft';
    await session.save();
    res.json(publicSession(session));
  } catch (err) {
    next(err);
  }
});
