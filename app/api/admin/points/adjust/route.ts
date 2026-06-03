import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request) {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId, type, amount, reason } = await req.json()
  const normalizedType = String(type || "").toUpperCase()
  const normalizedAmount = Math.round(Number(amount || 0))
  const normalizedReason = String(reason || "").trim()

  if (!userId || !["ADD", "DEDUCT"].includes(normalizedType) || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return NextResponse.json({ error: "Data penyesuaian poin tidak valid" }, { status: 400 })
  }
  if (!normalizedReason) {
    return NextResponse.json({ error: "Alasan wajib diisi" }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [users] = await connection.execute(
      "SELECT id, role, fullName FROM users WHERE id = ? FOR UPDATE",
      [userId]
    ) as any[]

    const user = users[0]
    if (!user) {
      await connection.rollback()
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }
    if (String(user.role).toUpperCase() !== "HOUSEHOLD") {
      await connection.rollback()
      return NextResponse.json({ error: "Adjustment poin hanya tersedia untuk household" }, { status: 400 })
    }

    if (normalizedType === "DEDUCT") {
      const [balances] = await connection.execute(
        `SELECT COALESCE(SUM(CASE WHEN type = 'EARNED' THEN amount ELSE -amount END), 0) AS total
         FROM points_ledger WHERE userId = ? FOR UPDATE`,
        [userId]
      ) as any[]
      const total = Number(balances[0]?.total || 0)
      if (total < normalizedAmount) {
        await connection.rollback()
        return NextResponse.json({ error: "Poin user tidak cukup untuk dikurangi" }, { status: 409 })
      }
    }

    await connection.execute(
      "INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [
        uuidv4(),
        userId,
        normalizedAmount,
        normalizedType === "ADD" ? "EARNED" : "REDEEMED",
        null,
        `Admin ${normalizedType === "ADD" ? "ADD" : "DEDUCT"}: ${normalizedReason}`,
      ]
    )

    await connection.commit()
    return NextResponse.json({ message: "Adjustment poin berhasil disimpan" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    connection.release()
  }
}
