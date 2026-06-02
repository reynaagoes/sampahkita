export const DASHBOARD_BY_ROLE: Record<string, string> = {
  HOUSEHOLD: "/household",
  COLLECTOR: "/collector",
  RECYCLER: "/recycler",
  ADMIN: "/admin",
}

export function getDashboardPath(role?: string | null) {
  return DASHBOARD_BY_ROLE[String(role || "")] || "/login"
}
