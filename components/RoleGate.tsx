"use client"

import { getDashboardPath } from "@/lib/roles"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

export default function RoleGate({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = String(session?.user?.role || "")
  const allowed = status === "authenticated" && allow.includes(role)

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
    if (status === "authenticated" && !allow.includes(role)) router.replace(getDashboardPath(role))
  }, [allow, role, router, status])

  if (!allowed) return <div className="page-loader">Memeriksa akses...</div>

  return children
}
