import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await pool.execute("UPDATE notifications SET isRead = true WHERE id = ?", [id])
    return NextResponse.json({ message: "Marked as read" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
