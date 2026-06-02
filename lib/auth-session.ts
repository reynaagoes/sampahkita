import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export function getAppSession() {
  return getServerSession(authOptions)
}

export function getSessionRole(role?: unknown) {
  return String(role || "").toUpperCase()
}
