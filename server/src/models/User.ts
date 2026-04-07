import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
      match: /^[a-zA-Z0-9_.-]+$/,
      index: true,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: { unique: true, sparse: true },
    },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },

    // Pending email change (not yet confirmed)
    pendingEmail: { type: String, default: null, lowercase: true, trim: true },
    pendingEmailToken: { type: String, default: null },
    pendingEmailExpiresAt: { type: Date, default: null },

    passwordHash: { type: String, required: true },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },

    // Free-form user preferences — updated via dot-notation PATCH
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

userSchema.methods.verifyPassword = function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>> & {
  verifyPassword(password: string): Promise<boolean>;
};

export const User = model<UserDoc>('User', userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Scrub sensitive fields out of a user's freeform settings blob before it
 * leaves the server. Currently strips the ElevenLabs API key and replaces
 * it with a `hasElevenlabsApiKey` boolean so the client can still render
 * "configured/not configured" UI without ever seeing the raw key.
 */
export function redactSettings(
  settings: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const clone: Record<string, unknown> = settings
    ? JSON.parse(JSON.stringify(settings))
    : {};
  const studio =
    (clone.studio && typeof clone.studio === 'object'
      ? (clone.studio as Record<string, unknown>)
      : {});
  const rawKey = studio.elevenlabsApiKey;
  delete studio.elevenlabsApiKey;
  studio.hasElevenlabsApiKey = typeof rawKey === 'string' && rawKey.length > 0;
  clone.studio = studio;
  return clone;
}

/**
 * Public-safe projection of a user for API responses.
 * Email is only surfaced here — callers choose whether to expose it to the client.
 * Settings are always redacted so sensitive keys never leak.
 */
export function publicUser(user: UserDoc) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    pendingEmail: user.pendingEmail,
    settings: redactSettings(user.settings as Record<string, unknown> | null),
  };
}
