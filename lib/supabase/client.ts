type AuthError = { message: string }
type AuthResult = Promise<{ error: AuthError | null }>

type ResetPasswordOptions = {
  redirectTo?: string
}

type UpdateUserPayload = {
  password: string
}

function getConfig(): { error: AuthError } | { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return {
      error: {
        message: "Konfigurasi Supabase belum tersedia.",
      },
    }
  }

  return { url, anonKey }
}

async function readError(response: Response): Promise<AuthError> {
  try {
    const data = (await response.json()) as { msg?: string; message?: string; error_description?: string }
    return { message: data.error_description || data.message || data.msg || "Permintaan auth gagal." }
  } catch {
    return { message: "Permintaan auth gagal." }
  }
}

function getRecoveryToken() {
  if (typeof window === "undefined") return null

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const query = new URLSearchParams(window.location.search)

  return hash.get("access_token") || query.get("access_token")
}

export function createClient() {
  return {
    auth: {
      async resetPasswordForEmail(email: string, options?: ResetPasswordOptions): AuthResult {
        const config = getConfig()
        if ("error" in config) return { error: config.error }

        const endpoint = new URL(`${config.url}/auth/v1/recover`)
        if (options?.redirectTo) endpoint.searchParams.set("redirect_to", options.redirectTo)

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        return { error: response.ok ? null : await readError(response) }
      },

      async updateUser(payload: UpdateUserPayload): AuthResult {
        const config = getConfig()
        if ("error" in config) return { error: config.error }

        const token = getRecoveryToken()
        if (!token) {
          return { error: { message: "Token reset password tidak ditemukan." } }
        }

        const response = await fetch(`${config.url}/auth/v1/user`, {
          method: "PUT",
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: payload.password }),
        })

        return { error: response.ok ? null : await readError(response) }
      },
    },
  }
}
