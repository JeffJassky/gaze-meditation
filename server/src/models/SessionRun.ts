import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A SessionRun is one *playthrough* of a session by a user — i.e. a row of the
 * user's history. It is distinct from the `Session` model (which is the
 * author-facing session definition with scenes, assets, etc).
 *
 * Design notes:
 *  - `owner` is the authenticated user who played the session. All history
 *    queries are scoped to `owner === req.user.id`.
 *  - `programId` is a free-form string so it can reference either a Mongo
 *    `Session._id` or a built-in program id like `prog_somatic_reset_extended`.
 *    We do NOT use an ObjectId ref here for that reason.
 *  - `programTitle` is denormalized so history rows survive the underlying
 *    session being renamed or deleted.
 *  - `metrics`, `physiologicalData`, `biometrics`, `report` are `Mixed` so the
 *    player can evolve its telemetry shape without a schema migration. They
 *    are write-once at end-of-run in the current player, but the routes also
 *    support PATCH for future mid-run updates.
 */

const metricSchema = new Schema(
  {
    sceneId: { type: String, required: true },
    success: { type: Boolean, default: false },
    timestamp: { type: Number, default: 0 },
    reactionTime: { type: Number, default: 0 },
  },
  { _id: false },
);

const sessionRunSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    programId: { type: String, required: true, index: true },
    programTitle: { type: String, default: '' },

    startTime: { type: Date, required: true, default: () => new Date() },
    endTime: { type: Date, default: null },

    // Denormalized summary fields for cheap listing.
    totalScore: { type: Number, default: 0 },
    scenesCompleted: { type: Number, default: 0 },
    totalScenes: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 }, // 0-100
    durationMs: { type: Number, default: 0 },

    // Full telemetry payloads.
    metrics: { type: [metricSchema], default: [] },
    physiologicalData: { type: [Schema.Types.Mixed], default: [] },
    biometrics: { type: Schema.Types.Mixed, default: null },
    report: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

// Primary query: "my history, newest first".
sessionRunSchema.index({ owner: 1, startTime: -1 });

export type SessionRunDoc = HydratedDocument<InferSchemaType<typeof sessionRunSchema>>;
export const SessionRun = model<SessionRunDoc>('SessionRun', sessionRunSchema);

export function publicSessionRun(r: SessionRunDoc) {
  return {
    id: r.id,
    owner: r.owner instanceof Types.ObjectId ? r.owner.toString() : r.owner,
    programId: r.programId,
    programTitle: r.programTitle,
    startTime: r.startTime,
    endTime: r.endTime,
    totalScore: r.totalScore,
    scenesCompleted: r.scenesCompleted,
    totalScenes: r.totalScenes,
    completeness: r.completeness,
    durationMs: r.durationMs,
    metrics: r.metrics,
    physiologicalData: r.physiologicalData,
    biometrics: r.biometrics,
    report: r.report,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
