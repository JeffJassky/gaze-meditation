/**
 * Leveling system — maps (totalSessions, totalMinutes) → level + progress.
 *
 * The XP formula and threshold table are intentionally opaque so users
 * experience progression as a gamified mystery rather than a spreadsheet.
 */

// XP thresholds to REACH each level. Index = level number.
// Generated from a tuned exponential curve with hand-adjusted jitter.
const THRESHOLDS: number[] = [
  0,       // 0  (floor)
  20,      // 1  ~1–2 sessions
  58,      // 2
  112,     // 3
  185,     // 4
  278,     // 5
  392,     // 6
  530,     // 7
  694,     // 8
  886,     // 9
  1108,    // 10
  1362,    // 11
  1652,    // 12
  1980,    // 13
  2348,    // 14
  2760,    // 15
  3220,    // 16
  3730,    // 17
  4295,    // 18
  4920,    // 19
  5610,    // 20
  6370,    // 21
  7205,    // 22
  8120,    // 23
  9125,    // 24
  10225,   // 25
  11430,   // 26
  12750,   // 27
  14195,   // 28
  15775,   // 29
  17500,   // 30
  19385,   // 31
  21440,   // 32
  23680,   // 33
  26120,   // 34
  28775,   // 35
  31665,   // 36
  34805,   // 37
  38215,   // 38
  41915,   // 39
  45930,   // 40
  50285,   // 41
  55005,   // 42
  60120,   // 43
  65660,   // 44
  71660,   // 45
  78150,   // 46
  85170,   // 47
  92760,   // 48
  100960,  // 49
  109815,  // 50
]

/**
 * Extrapolate threshold for levels beyond the table.
 * Uses the same base curve: floor(18 * n^1.62 + 2*n).
 */
function thresholdAt(level: number): number {
  if (level < THRESHOLDS.length) return THRESHOLDS[level]!
  return Math.floor(18 * Math.pow(level, 1.62) + 2 * level)
}

/**
 * Compute raw XP from session totals. The mixing of three non-linear terms
 * makes the relationship between inputs and output non-obvious.
 */
export function computeXP(totalSessions: number, totalMinutes: number): number {
  const s = Math.max(0, totalSessions)
  const m = Math.max(0, totalMinutes)
  const sessionXP = s * 12
  const minuteXP = Math.pow(m, 0.77) * 3.7
  const synergy = Math.sqrt(s * m) * 1.4
  return Math.floor(sessionXP + minuteXP + synergy)
}

export interface LevelInfo {
  level: number
  /** 0.0–1.0 progress toward next level */
  progress: number
  xp: number
}

/**
 * Compute level + progress from session totals.
 */
export function computeLevel(totalSessions: number, totalMinutes: number): LevelInfo {
  const xp = computeXP(totalSessions, totalMinutes)

  // Walk thresholds to find current level.
  let level = 0
  while (thresholdAt(level + 1) <= xp) level++

  const currentThreshold = thresholdAt(level)
  const nextThreshold = thresholdAt(level + 1)
  const span = nextThreshold - currentThreshold
  const progress = span > 0 ? Math.min(1, (xp - currentThreshold) / span) : 0

  return { level, progress, xp }
}
