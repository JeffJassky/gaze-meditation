// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Model } from 'mongoose';

/** Convert an arbitrary string to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * Given a desired slug and an owner, returns a slug that is unique within
 * that owner's documents of the given model. Appends `-2`, `-3`, … on collision.
 */
// Generic `Model<any>` — callers pass concrete models (Session, Playlist) and
// we only ever read `.findOne({ owner, slug })`, so stronger typing here fights
// Mongoose's complex generics without adding real safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uniqueOwnerSlug(
  model: Model<any>,
  owner: unknown,
  desired: string,
  excludeId?: unknown,
): Promise<string> {
  const base = slugify(desired) || 'untitled';
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await model.findOne({
      owner,
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!found) return candidate;
    candidate = `${base}-${n++}`;
  }
}
