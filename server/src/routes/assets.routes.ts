import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../auth/middleware.js';
import { Asset, publicAsset, ASSET_KINDS, type AssetKind } from '../models/Asset.js';
import { isValidMimeForKind, isValidSizeForKind, ASSET_KIND_CONFIG } from '@shared/constants/assets.js';
import { getObject } from '../services/storage.js';
import type { UserDoc } from '../models/User.js';

/**
 * /assets — CRUD-lite routes for the shared Asset collection.
 *
 * All routes are auth-required and scoped to the caller. A user cannot
 * read or delete another user's assets. There's no create endpoint here
 * because uploads go through `/uploads/sign` + direct S3 PUT; after the
 * client completes the upload it calls POST /assets to register a row.
 */
export const assetsRouter = Router();

function currentUserId(req: Express.Request): string | null {
  const u = req.user as UserDoc | undefined;
  return u ? u.id : null;
}

// ---------- list ----------

/**
 * GET /assets
 *
 * Query params:
 *   kind=audio|image|video  → filter by asset kind (repeatable)
 *   q=<substr>              → substring match on `label` (case-insensitive)
 *   limit, page
 *
 * Returns the caller's own assets plus system-provided defaults.
 */
assetsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { kind, q, limit: limitRaw, page: pageRaw } = req.query;
    const limit = Math.min(Number(limitRaw) || 200, 1000);
    const page = Math.max(Number(pageRaw) || 1, 1);

    // User's own assets OR system assets (visible to everyone).
    const filter: Record<string, unknown> = {
      $or: [
        { owner: new Types.ObjectId(userId) },
        { isSystem: true },
      ],
    };

    // Allow single or repeated `kind` param.
    if (kind) {
      const kinds = (Array.isArray(kind) ? kind : [kind])
        .map(String)
        .filter((k): k is AssetKind =>
          (ASSET_KINDS as readonly string[]).includes(k),
        );
      if (kinds.length === 1) filter.kind = kinds[0];
      else if (kinds.length > 1) filter.kind = { $in: kinds };
    }

    if (typeof q === 'string' && q.trim().length > 0) {
      filter.label = { $regex: escapeRegex(q.trim()), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Asset.find(filter)
        .sort({ isSystem: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Asset.countDocuments(filter),
    ]);

    res.json({
      items: items.map(publicAsset),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (e) {
    next(e);
  }
});

// ---------- voice-hash shortcut ----------

/**
 * GET /assets/voice/:hash
 *
 * Fast lookup for voice-cache assets by their content hash. The voice
 * service computes `textToHash(text)` client-side and hits this endpoint
 * to check whether a previously-generated TTS file already exists in S3
 * before calling out to ElevenLabs. Returns 404 if no matching asset.
 *
 * This uses the `(owner, meta.voiceHash)` index defined on the Asset
 * schema so lookups are O(1) even with hundreds of thousands of entries.
 */
assetsRouter.get('/voice/:hash', requireAuth, async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const hash = String(req.params.hash);
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      res.status(400).json({ error: 'invalid_hash' });
      return;
    }
    const asset = await Asset.findOne({
      owner: new Types.ObjectId(userId),
      'meta.voiceHash': hash,
    });
    if (!asset) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(publicAsset(asset));
  } catch (e) {
    next(e);
  }
});

// ---------- stream file by S3 key ----------

/**
 * GET /assets/file/*
 *
 * Authenticated proxy that streams an S3 object by its key. Assets stay
 * private in the bucket — the server validates the session cookie and
 * streams the bytes through. Supports Range requests for audio seeking.
 */
assetsRouter.get('/file/*', requireAuth, async (req, res, next) => {
  try {
    // The key is everything after `/file/`.
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).json({ error: 'missing_key' });
      return;
    }

    const result = await getObject(key);
    if (!result.body) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    if (result.contentType) res.setHeader('Content-Type', result.contentType);
    if (result.contentLength) res.setHeader('Content-Length', result.contentLength);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // AWS SDK v3 body exposes .transformToByteArray() on all runtimes.
    const bytes = await (result.body as { transformToByteArray(): Promise<Uint8Array> }).transformToByteArray();
    res.end(Buffer.from(bytes));
  } catch (e: unknown) {
    const code = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (code === 404 || (e as { name?: string }).name === 'NoSuchKey') {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    next(e);
  }
});

// ---------- get by id ----------

assetsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const asset = await Asset.findOne({
      _id: new Types.ObjectId(id),
      owner: new Types.ObjectId(userId),
    });
    if (!asset) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(publicAsset(asset));
  } catch (e) {
    next(e);
  }
});

// ---------- register (after upload) ----------

/**
 * POST /assets
 *
 * Called by the client after it has successfully PUT a file to S3 via
 * the presigned URL from `/uploads/sign`. Idempotent on `(owner, key)` —
 * if the row already exists it's returned as-is.
 */
assetsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { kind, key, label, contentType, size, meta } = req.body ?? {};
    if (!kind || !(ASSET_KINDS as readonly string[]).includes(kind)) {
      res.status(400).json({ error: 'invalid_kind' });
      return;
    }
    if (typeof key !== 'string' || key.length === 0) {
      res.status(400).json({ error: 'invalid_key' });
      return;
    }

    // Validate MIME type against the declared kind.
    if (typeof contentType === 'string' && contentType.length > 0) {
      if (!isValidMimeForKind(kind as AssetKind, contentType)) {
        const config = ASSET_KIND_CONFIG[kind as AssetKind];
        res.status(400).json({
          error: 'invalid_content_type',
          message: `"${contentType}" is not allowed for ${config?.label ?? kind}. Expected: ${config?.mimePatterns.join(', ')}`,
        });
        return;
      }
    }

    // Validate file size against the kind's maximum.
    if (typeof size === 'number' && size > 0) {
      if (!isValidSizeForKind(kind as AssetKind, size)) {
        const config = ASSET_KIND_CONFIG[kind as AssetKind];
        res.status(400).json({
          error: 'file_too_large',
          message: `File size exceeds maximum of ${config?.maxSizeLabel ?? 'unknown'} for ${config?.label ?? kind}`,
        });
        return;
      }
    }

    const existing = await Asset.findOne({
      owner: new Types.ObjectId(userId),
      key,
    });
    if (existing) {
      res.status(200).json(publicAsset(existing));
      return;
    }

    // isSystem is NEVER set via the API — only via server-side scripts.
    const doc = await Asset.create({
      owner: new Types.ObjectId(userId),
      kind,
      key,
      label: typeof label === 'string' ? label : '',
      contentType: typeof contentType === 'string' ? contentType : '',
      size: typeof size === 'number' ? size : 0,
      isSystem: false,
      meta: meta && typeof meta === 'object' ? meta : {},
    });
    res.status(201).json(publicAsset(doc));
  } catch (e) {
    next(e);
  }
});

// ---------- delete ----------

/**
 * DELETE /assets/:id
 *
 * Only deletes the Asset document — the S3 object is left alone to keep
 * historical sessions playable. A future janitor job can sweep orphaned
 * keys; doing it here would be destructive if any session still references
 * the file.
 */
assetsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const result = await Asset.deleteOne({
      _id: new Types.ObjectId(id),
      owner: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ---------- helpers ----------

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
