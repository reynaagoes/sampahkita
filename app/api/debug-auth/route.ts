import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function maskDatabaseUrl(value?: string | null) {
  if (!value) return null;
  return value.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const nextauthUrl = process.env.NEXTAUTH_URL;
    const nextauthSecret = process.env.NEXTAUTH_SECRET;

    if (!databaseUrl) {
      return NextResponse.json({
        ok: false,
        error: "DATABASE_URL tidak terbaca di runtime Vercel",
      });
    }

    const db = await mysql.createConnection(databaseUrl);

    const [users] = await db.query<any[]>(
      "SELECT email, password, fullName, role, isVerified FROM users WHERE email = ? LIMIT 1",
      ["demo.household1@cuansampah.test"]
    );

    const user = users[0] ?? null;

    const passwordMatchesDemo123 = user
      ? await bcrypt.compare("Demo123!", user.password)
      : false;

    await db.end();

    return NextResponse.json({
      ok: true,
      databaseUrlMasked: maskDatabaseUrl(databaseUrl),
      nextauthUrl,
      hasNextauthSecret: Boolean(nextauthSecret),
      userFound: Boolean(user),
      user: user
        ? {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isVerified: user.isVerified,
          }
        : null,
      passwordMatchesDemo123,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
