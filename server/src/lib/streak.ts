import { Types } from 'mongoose';
import { SessionRun } from '../models/SessionRun.js';

/**
 * Compute a user's current streak: consecutive days with at least one
 * completed session run, counting back from today (or yesterday if today
 * has no activity yet — the streak stays "alive" until the full day passes).
 *
 * Days are evaluated in UTC.
 */
export async function computeStreak(userId: string): Promise<number> {
  // Get distinct days (UTC) with completed runs, newest first.
  const pipeline = [
    {
      $match: {
        owner: new Types.ObjectId(userId),
        endTime: { $ne: null },
      },
    },
    {
      $project: {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
      },
    },
    { $group: { _id: '$day' } },
    { $sort: { _id: -1 as const } },
    { $limit: 400 },
  ]

  const days = (await SessionRun.aggregate(pipeline)).map(
    (d: { _id: string }) => d._id,
  )

  if (days.length === 0) return 0

  // Build a set for O(1) lookups.
  const daySet = new Set(days)

  // Start from today. If today has no run, try yesterday (streak is still alive).
  const now = new Date()
  const todayStr = fmtDate(now)
  let cursor = new Date(now)

  if (!daySet.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
    if (!daySet.has(fmtDate(cursor))) return 0
  }

  // Count consecutive days backward.
  let streak = 0
  while (daySet.has(fmtDate(cursor))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
