import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "HOUSEHOLD" | "COLLECTOR" | "ADMIN"
    }
  }
  interface User {
    role: "HOUSEHOLD" | "COLLECTOR" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "HOUSEHOLD" | "COLLECTOR" | "ADMIN"
    id: string
  }
}
