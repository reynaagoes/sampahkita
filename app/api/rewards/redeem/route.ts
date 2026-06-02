import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { REWARDS } from "@/lib/points"

export async function POST(req: Request) {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { rewardCode } = await req.json()
  const reward = REWARDS.find((item) => item.code === rewardCode)
  if (!reward) return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 })

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [users] = await connection.execute("SELECT id FROM users WHERE email = ? FOR UPDATE", [session.user.email]) as any[]
    const userId = users[0]?.id
    const [rows] = await connection.execute(
      `SELECT COALESCE(SUM(CASE WHEN type = "EARNED" THEN amount ELSE -amount END), 0) AS total
       FROM points_ledger WHERE userId = ? FOR UPDATE`,
      [userId]
    ) as any[]
    const total = Number(rows[0]?.total || 0)
    if (total < reward.points) {
      await connection.rollback()
      return NextResponse.json({ error: "Poin tidak cukup untuk menukar reward ini" }, { status: 409 })
    }

    const redemptionId = uuidv4()
    await connection.execute(
      "INSERT INTO reward_redemptions (id, userId, rewardCode, rewardName, pointsCost, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [redemptionId, userId, reward.code, reward.name, reward.points, "PENDING"]
    )
    await connection.execute(
      "INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [uuidv4(), userId, reward.points, "REDEEMED", null, "Redeem " + reward.name]
    )
    await connection.commit()
    return NextResponse.json({ message: "Reward berhasil ditukar", redemptionId })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    connection.release()
  }
}
