import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../auth/middleware.js';
import { SessionRun, publicSessionRun } from '../models/SessionRun.js';
import type { UserDoc } from '../models/User.js';

/**
 * /history — per-user session playthrough logs (a.k.a. SessionRuns).
 *
 * All routes are auth-required and scoped to the current user. The player
 * (Theater.vue) POSTs a completed run at session end; the dashboard reads
 * them back for the History view.
 */
export const historyRouter = Router();

historyRouter.use(requireAuth);

function currentUserId(req: Express.Request): string {
  return (req.user as UserDoc).id;
}

// Fields a client may write on create/update.
const WRITABLE = [
  'programId',
  'programTitle',
  'startTime',
  'endTime',
  'totalScore',
  'scenesCompleted',
  'totalScenes',
  'completeness',
  'durationMs',
  'metrics',
  'physiologicalData',
  'biometrics',
  'report',
] as const;

function pickWritable(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of WRITABLE) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// ---------- list mine ----------

historyRouter.get('/', async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const { limit: limitRaw, page: pageRaw, programId } = req.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);
    const page = Math.max(Number(pageRaw) || 1, 1);

    const filter: Record<string, unknown> = { owner: new Types.ObjectId(userId) };
    if (programId) filter.programId = programId;

    const [items, total] = await Promise.all([
      SessionRun.find(filter)
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SessionRun.countDocuments(filter),
    ]);

    res.json({
      items: items.map(publicSessionRun),
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

historyRouter.get('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const run = await SessionRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'not_found' });
    if (String(run.owner) !== currentUserId(req))
      return res.status(403).json({ error: 'forbidden' });
    res.json(publicSessionRun(run));
  } catch (err) {
    next(err);
  }
});

// ---------- create ----------
//
// The player can POST a full, already-complete run here at end-of-session,
// or POST a partial run at start and PATCH it as telemetry accumulates.

historyRouter.post('/', async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const programId = typeof body.programId === 'string' ? body.programId.trim() : '';
    if (!programId) return res.status(400).json({ error: 'programId_required' });

    const doc: Record<string, unknown> = {
      owner: new Types.ObjectId(currentUserId(req)),
      ...pickWritable(body),
      programId,
    };
    if (!doc.startTime) doc.startTime = new Date();

    const run = await SessionRun.create(doc);
    res.status(201).json(publicSessionRun(run));
  } catch (err) {
    next(err);
  }
});

// ---------- update (e.g. complete, mid-run telemetry append) ----------

historyRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const run = await SessionRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'not_found' });
    if (String(run.owner) !== currentUserId(req))
      return res.status(403).json({ error: 'forbidden' });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch = pickWritable(body);
    for (const [k, v] of Object.entries(patch)) {
      (run as unknown as Record<string, unknown>)[k] = v;
    }
    for (const f of ['metrics', 'physiologicalData', 'biometrics', 'report'] as const) {
      if (body[f] !== undefined) run.markModified(f);
    }
    await run.save();
    res.json(publicSessionRun(run));
  } catch (err) {
    next(err);
  }
});

// ---------- delete ----------

historyRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params.id)))
      return res.status(404).json({ error: 'not_found' });
    const run = await SessionRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'not_found' });
    if (String(run.owner) !== currentUserId(req))
      return res.status(403).json({ error: 'forbidden' });
    await run.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
