import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { getBadgeProgress } from "@/lib/badges"
import { REWARDS } from "@/lib/points"

export async function GET() {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const role = getSessionRole(session.user.role)
    if (role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const userId = users[0]?.id

    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN type = "EARNED" THEN amount ELSE -amount END), 0) as total,
              COALESCE(SUM(CASE WHEN type = "EARNED" THEN amount ELSE 0 END), 0) as totalEarned
       FROM points_ledger WHERE userId = ?`,
      [userId]
    ) as any[]
    const [history] = await pool.execute(
      "SELECT id, amount, type, description, createdAt FROM points_ledger WHERE userId = ? ORDER BY createdAt DESC LIMIT 20",
      [userId]
    ) as any[]

    const [badges] = await pool.execute(
      "SELECT id, badgeName, thresholdPoints, earnedAt FROM user_badges WHERE userId = ? ORDER BY thresholdPoints ASC",
      [userId]
    ) as any[]
    const [redemptions] = await pool.execute(
      "SELECT id, rewardCode, rewardName, pointsCost, status, createdAt FROM reward_redemptions WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    ) as any[]

    return NextResponse.json({
      total: rows[0]?.total || 0,
      totalEarned: rows[0]?.totalEarned || 0,
      history,
      badges,
      badgeProgress: getBadgeProgress(Number(rows[0]?.totalEarned || 0)),
      rewards: REWARDS,
      redemptions,
    })
  } catch (error) {
    return NextResponse.json({ total: 0 })
  }
}
