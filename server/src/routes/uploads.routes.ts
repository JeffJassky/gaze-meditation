import { Router } from 'express';
import crypto from 'node:crypto';
import { requireAuth } from '../auth/middleware.js';
import { createPresignedUploadUrl, publicUrlForKey } from '../services/storage.js';
import type { UserDoc } from '../models/User.js';

export const uploadsRouter = Router();

uploadsRouter.post('/sign', requireAuth, async (req, res, next) => {
  try {
    const { contentType, ext } = req.body ?? {};
    if (!contentType) return res.status(400).json({ error: 'content_type_required' });

    const user = req.user as UserDoc;
    const safeExt = typeof ext === 'string' ? ext.replace(/[^a-z0-9.]/gi, '').slice(0, 8) : '';
    const key = `u/${user.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt ? `.${safeExt.replace(/^\./, '')}` : ''}`;

    const url = await createPresignedUploadUrl(key, contentType);
    res.json({ key, uploadUrl: url, publicUrl: publicUrlForKey(key) });
  } catch (err) {
    next(err);
  }
});
