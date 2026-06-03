import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email || "").trim().toLowerCase()
          const password = String(credentials?.password || "")
          if (!email || !password) return null

          const [rows] = await pool.execute(
            "SELECT id, email, password, fullName, role, isVerified FROM users WHERE email = ? LIMIT 1",
            [email]
          ) as any[]

          const user = rows[0]
          if (!user) return null

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) return null

          const role = String(user.role || "").toUpperCase()
          if (!["HOUSEHOLD", "COLLECTOR", "RECYCLER", "ADMIN"].includes(role)) return null

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: role as User["role"],
            isVerified: Boolean(user.isVerified),
          }
        } catch (error) {
          console.error("NEXTAUTH AUTHORIZE ERROR:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = String((user as any).role || "").toUpperCase() as typeof token.role
        token.id = user.id
        token.isVerified = Boolean((user as any).isVerified)
        if (user.name) token.name = user.name
        if (user.email) token.email = user.email
      }
      if ((!token.id || !token.role || typeof token.isVerified !== "boolean") && token.email) {
        const [rows] = await pool.execute(
          "SELECT id, role, isVerified, fullName, email FROM users WHERE email = ? LIMIT 1",
          [token.email]
        ) as any[]
        if (rows[0]) {
          token.id = rows[0].id
          token.role = String(rows[0].role || "").toUpperCase() as typeof token.role
          token.isVerified = Boolean(rows[0].isVerified)
          token.name = rows[0].fullName
          token.email = rows[0].email
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "")
        session.user.role = String(token.role || "").toUpperCase() as typeof session.user.role
        session.user.isVerified = Boolean(token.isVerified)
        session.user.name = String(token.name || session.user.name || "")
        session.user.email = String(token.email || session.user.email || "")
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
