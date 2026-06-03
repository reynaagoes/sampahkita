import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, context: RouteContext<"/api/admin/users/[id]/verify">) {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await context.params
  const { action, message } = await req.json()
  const normalizedAction = String(action || "").toUpperCase()
  if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
    return NextResponse.json({ error: "Action verifikasi tidak valid" }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [admins] = await connection.execute("SELECT id FROM users WHERE email = ?", [session.user.email]) as any[]
    const adminId = admins[0]?.id || null

    const [users] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
      [id]
    ) as any[]
    const user = users[0]
    if (!user) {
      await connection.rollback()
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const role = String(user.role || "").toUpperCase()
    if (!["COLLECTOR", "RECYCLER"].includes(role)) {
      await connection.rollback()
      return NextResponse.json({ error: "User ini tidak memerlukan verifikasi admin" }, { status: 400 })
    }

    const verificationStatus = normalizedAction === "APPROVE" ? "APPROVED" : "REJECTED"
    const isVerified = normalizedAction === "APPROVE"
    const note = String(message || "").trim() || null

    const [existingVerification] = await connection.execute(
      "SELECT id FROM collector_verifications WHERE collectorId = ?",
      [id]
    ) as any[]

    if (existingVerification[0]?.id) {
      await connection.execute(
        "UPDATE collector_verifications SET status = ?, reviewedBy = ?, notes = ?, updatedAt = NOW() WHERE collectorId = ?",
        [verificationStatus, adminId, note, id]
      )
    } else {
      await connection.execute(
        "INSERT INTO collector_verifications (id, collectorId, status, reviewedBy, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [uuidv4(), id, verificationStatus, adminId, note]
      )
    }

    await connection.execute(
      "UPDATE users SET isVerified = ?, updatedAt = NOW() WHERE id = ?",
      [isVerified, id]
    )

    await connection.commit()
    return NextResponse.json({ message: `User berhasil ${normalizedAction === "APPROVE" ? "disetujui" : "ditolak"}` })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    connection.release()
  }
}
