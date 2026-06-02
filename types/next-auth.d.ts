import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "HOUSEHOLD" | "COLLECTOR" | "RECYCLER" | "ADMIN"
    }
  }
  interface User {
    role: "HOUSEHOLD" | "COLLECTOR" | "RECYCLER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "HOUSEHOLD" | "COLLECTOR" | "RECYCLER" | "ADMIN"
    id: string
  }
}
