import { Router } from 'express';
import crypto from 'node:crypto';
import { requireAuth } from '../auth/middleware.js';
import { User, hashPassword, publicUser, redactSettings, type UserDoc } from '../models/User.js';
import { sendMail } from '../services/mail.js';
import { config } from '../config.js';

export const usersRouter = Router();

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** GET /users/me */
usersRouter.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user as UserDoc));
});

/** PATCH /users/me — update username (only field changeable directly) */
usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const { username } = req.body ?? {};
    if (typeof username === 'string' && username.trim() && username.trim() !== user.username) {
      const clean = username.trim();
      if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(clean)) {
        return res.status(400).json({ error: 'invalid_username' });
      }
      if (await User.findOne({ username: clean, _id: { $ne: user._id } })) {
        return res.status(409).json({ error: 'username_taken' });
      }
      user.username = clean;
      await user.save();
    }
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users/me/email — request an email change (or set initial email).
 * Sends a verification link to the *new* address. Email is not live until verified.
 */
usersRouter.post('/me/email', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: 'email_required' });
    const clean = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    const taken = await User.findOne({ email: clean, _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ error: 'email_taken' });

    const token = crypto.randomBytes(32).toString('hex');

    if (!user.email) {
      // Initial email set: store directly but unverified, use emailVerificationToken path.
      user.email = clean;
      user.emailVerifiedAt = null;
      user.emailVerificationToken = token;
    } else {
      // Change flow: hold in pendingEmail until confirmed.
      user.pendingEmail = clean;
      user.pendingEmailToken = token;
      user.pendingEmailExpiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
    }
    await user.save();

    await sendMail({
      to: clean,
      subject: `Verify your ${config.mail.appName} email`,
      template: 'transactional',
      data: {
        heading: 'Confirm your email',
        body: `Confirm this address to ${user.pendingEmail ? 'complete your email change' : 'verify your account'}.`,
        ctaLabel: 'Verify email',
        ctaUrl: `${config.mail.appUrl}/verify-email?token=${token}`,
      },
    });

    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

/** DELETE /users/me/email/pending — cancel a pending email change */
usersRouter.delete('/me/email/pending', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    user.pendingEmail = null;
    user.pendingEmailToken = null;
    user.pendingEmailExpiresAt = null;
    await user.save();
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

/** POST /users/me/password — change password (requires currentPassword) */
usersRouter.post('/me/password', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'current_and_new_password_required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }
    const ok = await user.verifyPassword(currentPassword);
    if (!ok) return res.status(401).json({ error: 'invalid_current_password' });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** GET /users/me/settings */
usersRouter.get('/me/settings', requireAuth, (req, res) => {
  const user = req.user as UserDoc;
  res.json(redactSettings(user.settings as Record<string, unknown> | null));
});

/**
 * PATCH /users/me/settings — dot-notation merge.
 * Body: { "notifications.email": true, "ui.theme": "dark" }
 * A value of `null` deletes the key (Mongo $unset).
 */
usersRouter.patch('/me/settings', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const body = req.body ?? {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'body_must_be_object' });
    }

    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ''> = {};

    for (const [key, value] of Object.entries(body)) {
      // Safety: restrict to word chars + dots; prevents Mongo operator injection.
      if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
        return res.status(400).json({ error: `invalid_key:${key}` });
      }
      const path = `settings.${key}`;
      if (value === null) $unset[path] = '';
      else $set[path] = value;
    }

    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    if (Object.keys(update).length) {
      await User.updateOne({ _id: user._id }, update);
    }

    const fresh = await User.findById(user._id);
    res.json(redactSettings(fresh?.settings as Record<string, unknown> | null));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/me/elevenlabs/voices
 *
 * Proxies the ElevenLabs voices list using the caller's stored API key.
 * The key never leaves the server. Returns a compact shape suitable for
 * populating a voice picker in the UI.
 */
usersRouter.get('/me/elevenlabs/voices', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as UserDoc;
    const apiKey = (user.settings as Record<string, any> | null)?.studio
      ?.elevenlabsApiKey as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ error: 'elevenlabs_key_missing' });
    }
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(r.status === 401 ? 401 : 502).json({
        error: r.status === 401 ? 'elevenlabs_key_invalid' : 'elevenlabs_upstream_error',
        detail: text.slice(0, 300),
      });
    }
    const data = (await r.json()) as { voices?: Array<Record<string, unknown>> };
    const voices = (data.voices ?? []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description ?? null,
      labels: v.labels ?? null,
      preview_url: v.preview_url ?? null,
    }));
    res.json({ voices });
  } catch (err) {
    next(err);
  }
});
