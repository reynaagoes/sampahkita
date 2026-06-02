import { v4 as uuidv4 } from "uuid"
import { BADGES, getNextBadge } from "@/lib/points"

type DbConnection = {
  execute: (...args: any[]) => Promise<any>
}

export async function awardBadgesForTotal(db: DbConnection, userId: string, totalEarnedPoints: number) {
  const earned = BADGES.filter((badge) => totalEarnedPoints >= badge.threshold)
  for (const badge of earned) {
    await db.execute(
      `INSERT INTO user_badges (id, userId, badgeName, thresholdPoints, earnedAt)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE badgeName = badgeName`,
      [uuidv4(), userId, badge.name, badge.threshold]
    )
  }
  return earned
}

export function getBadgeProgress(totalEarnedPoints: number) {
  const nextBadge = getNextBadge(totalEarnedPoints)
  if (!nextBadge) return null
  return {
    name: nextBadge.name,
    current: totalEarnedPoints,
    target: nextBadge.threshold,
    remaining: Math.max(nextBadge.threshold - totalEarnedPoints, 0),
  }
}
