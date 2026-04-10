import { Router } from 'express';
import crypto from 'node:crypto';
import { requireAuth } from '../auth/middleware.js';
import { createPresignedUploadUrl, publicUrlForKey } from '../services/storage.js';
import { ASSET_KINDS, isValidMimeForKind, type AssetKind } from '@shared/constants/assets.js';
import type { UserDoc } from '../models/User.js';

export const uploadsRouter = Router();

uploadsRouter.post('/sign', requireAuth, async (req, res, next) => {
  try {
    const { contentType, ext, kind } = req.body ?? {};
    if (!contentType) return res.status(400).json({ error: 'content_type_required' });
    if (!kind) return res.status(400).json({ error: 'kind_required' });
    if (!(ASSET_KINDS as readonly string[]).includes(kind)) {
      return res.status(400).json({ error: 'invalid_kind' });
    }

    // Validate MIME type against the declared asset kind.
    if (!isValidMimeForKind(kind as AssetKind, contentType)) {
      return res.status(400).json({
        error: 'invalid_content_type',
        message: `Content type "${contentType}" is not allowed for asset kind "${kind}"`,
      });
    }

    const user = req.user as UserDoc;
    const safeExt = typeof ext === 'string' ? ext.replace(/[^a-z0-9.]/gi, '').slice(0, 8) : '';
    const key = `u/${user.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt ? `.${safeExt.replace(/^\./, '')}` : ''}`;

    const url = await createPresignedUploadUrl(key, contentType);
    res.json({ key, uploadUrl: url, publicUrl: publicUrlForKey(key) });
  } catch (err) {
    next(err);
  }
});
