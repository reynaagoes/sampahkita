const fs = require('fs');

const available = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.status = ? ORDER BY mb.createdAt DESC",
      ["AVAILABLE"]
    ) as any[]

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("AVAILABLE BATCHES ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

const myPurchases = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const recyclerId = users[0]?.id

    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.recyclerId = ? ORDER BY mb.updatedAt DESC",
      [recyclerId]
    ) as any[]

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("MY PURCHASES ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

fs.writeFileSync('app/api/batches/available/route.ts', available, {encoding:'utf8'});
fs.writeFileSync('app/api/batches/my-purchases/route.ts', myPurchases, {encoding:'utf8'});
console.log('batches routes OK');
