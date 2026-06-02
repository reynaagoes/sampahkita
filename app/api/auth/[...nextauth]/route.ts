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
        if (!credentials?.email || !credentials?.password) return null

        const [rows] = await pool.execute(
          "SELECT * FROM users WHERE email = ?",
          [credentials.email]
        ) as any[]

        const user = rows[0]
        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        const role = String(user.role || "").toUpperCase()
        if (!["HOUSEHOLD", "COLLECTOR", "RECYCLER", "ADMIN"].includes(role)) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: role as User["role"],
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = String((user as any).role || "").toUpperCase() as typeof token.role
        token.id = user.id
      }
      if ((!token.id || !token.role) && token.email) {
        const [rows] = await pool.execute(
          "SELECT id, role FROM users WHERE email = ?",
          [token.email]
        ) as any[]
        if (rows[0]) {
          token.id = rows[0].id
          token.role = String(rows[0].role || "").toUpperCase() as typeof token.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = String(token.role || "").toUpperCase()
        ;(session.user as any).id = token.id
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
