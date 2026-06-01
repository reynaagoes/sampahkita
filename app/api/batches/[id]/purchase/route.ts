import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const recyclerId = users[0]?.id
    await pool.execute(
      "UPDATE material_batches SET recyclerId = ?, status = ?, updatedAt = NOW() WHERE id = ? AND status = ?",
      [recyclerId, "SOLD", id, "AVAILABLE"]
    )
    return NextResponse.json({ message: "Pembelian berhasil" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
