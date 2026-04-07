import { Router } from 'express';
import crypto from 'node:crypto';
import passport from 'passport';
import { User, hashPassword, publicUser, type UserDoc } from '../models/User.js';
import { sendMail } from '../services/mail.js';
import { config } from '../config.js';
import { requireAuth } from '../auth/middleware.js';

export const authRouter = Router();

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** POST /auth/register — username + password; email optional */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username_and_password_required' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;

    if (await User.findOne({ username: cleanUsername })) {
      return res.status(409).json({ error: 'username_taken' });
    }
    if (cleanEmail && (await User.findOne({ email: cleanEmail }))) {
      return res.status(409).json({ error: 'email_taken' });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: await hashPassword(password),
    });

    // If email was provided, send a verification email (non-blocking to sign-in).
    if (cleanEmail) {
      const token = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = token;
      await user.save();
      await sendMail({
        to: cleanEmail,
        subject: `Verify your ${config.mail.appName} email`,
        template: 'transactional',
        data: {
          heading: `Welcome, ${cleanUsername}`,
          body: 'Confirm your email address so we can reach you for account-related notices.',
          ctaLabel: 'Verify email',
          ctaUrl: `${config.mail.appUrl}/verify-email?token=${token}`,
        },
      });
    }

    // Auto sign-in after registration
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(publicUser(user));
    });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/login */
authRouter.post('/login', (req, res, next) => {
  passport.authenticate(
    'local',
    (err: Error | null, user: UserDoc | false, info?: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'invalid_credentials' });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(publicUser(user));
      });
    },
  )(req, res, next);
});

/** POST /auth/logout */
authRouter.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie(config.session.name);
      res.json({ ok: true });
    });
  });
});

/** GET /auth/me */
authRouter.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'unauthorized' });
  res.json(publicUser(req.user as UserDoc));
});

/**
 * POST /auth/verify-email — confirms a token for either:
 *   (a) initial email verification (user.emailVerificationToken)
 *   (b) a pending email change   (user.pendingEmailToken)
 */
authRouter.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body ?? {};
    if (!token) return res.status(400).json({ error: 'token_required' });

    // Pending change takes priority (more specific match)
    const pendingUser = await User.findOne({
      pendingEmailToken: token,
      pendingEmailExpiresAt: { $gt: new Date() },
    });
    if (pendingUser) {
      pendingUser.email = pendingUser.pendingEmail;
      pendingUser.emailVerifiedAt = new Date();
      pendingUser.pendingEmail = null;
      pendingUser.pendingEmailToken = null;
      pendingUser.pendingEmailExpiresAt = null;
      await pendingUser.save();
      return res.json({ ok: true, email: pendingUser.email });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ error: 'invalid_or_expired_token' });
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    await user.save();
    res.json({ ok: true, email: user.email });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/password/forgot — accepts { username } or { email }
 * Always responds 200 to avoid account enumeration.
 */
authRouter.post('/password/forgot', async (req, res, next) => {
  try {
    const { username, email } = req.body ?? {};
    const query = username
      ? { username: String(username).trim() }
      : email
        ? { email: String(email).toLowerCase().trim() }
        : null;
    if (!query) return res.status(400).json({ error: 'username_or_email_required' });

    const user = await User.findOne(query);
    if (user && user.email) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = token;
      user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();
      await sendMail({
        to: user.email,
        subject: `Reset your ${config.mail.appName} password`,
        template: 'transactional',
        data: {
          heading: 'Password reset',
          body: 'We received a request to reset your password. This link expires in 30 minutes. If this wasn’t you, you can safely ignore this email.',
          ctaLabel: 'Reset password',
          ctaUrl: `${config.mail.appUrl}/reset-password?token=${token}`,
        },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/password/reset */
authRouter.post('/password/reset', async (req, res, next) => {
  try {
    const { token, password } = req.body ?? {};
    if (!token || !password) return res.status(400).json({ error: 'token_and_password_required' });
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'invalid_or_expired_token' });
    user.passwordHash = await hashPassword(password);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
