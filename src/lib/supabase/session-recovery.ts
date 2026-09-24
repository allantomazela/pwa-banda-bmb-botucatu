/**
 * Recupera o app quando o JWT da sessão está expirado ou corrompido.
 * Sintoma típico: REST 401 PGRST301.
 *
 * Estratégia: tenta renovar a sessão (refresh) antes de deslogar.
 * Só limpa o localStorage se o refresh for definitivamente inválido.
 */

let clearing = false
let refreshInFlight: Promise<RefreshAttemptResult> | null = null

export type RefreshAttemptResult = {
  accessToken: string | null
  /** true = refresh token inválido/revogado — seguro limpar sessão local */
  fatal: boolean
}

export function isInvalidJwtResponse(status: number, body: unknown): boolean {
  if (status !== 401) return false
  if (!body || typeof body !== 'object') return false

  const record = body as Record<string, unknown>
  const code = String(record.code ?? '')
  const message = `${record.message ?? ''} ${record.details ?? ''}`

  return (
    code === 'PGRST301' ||
    /jwt|wrong key type|expected 3 parts|no suitable key|expired/i.test(message)
  )
}

/** Erros em que a sessão local não pode ser recuperada (usuário precisa logar de novo). */
export function isFatalAuthError(error: { message?: string; status?: number } | null | undefined): boolean {
  if (!error) return false
  const msg = (error.message ?? '').toLowerCase()
  return /invalid refresh token|refresh token not found|refresh token revoked|session not found|user not found|invalid jwt|jwt expired|token is expired/i.test(
    msg,
  )
}

export async function clearInvalidLocalSession(
  signOut: () => Promise<unknown>,
): Promise<boolean> {
  if (clearing) return false
  clearing = true
  try {
    await signOut()
    return true
  } catch {
    return false
  } finally {
    clearing = false
  }
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url
  return String(input)
}

export function createSessionRecoveryFetch(options: {
  publishableKey: string
  refreshSession: () => Promise<RefreshAttemptResult>
  signOut: () => Promise<unknown>
}): typeof fetch {
  const { publishableKey, refreshSession, signOut } = options

  async function refreshOnce(): Promise<RefreshAttemptResult> {
    if (!refreshInFlight) {
      refreshInFlight = refreshSession().finally(() => {
        refreshInFlight = null
      })
    }
    return refreshInFlight
  }

  return async (input, init) => {
    const response = await fetch(input, init)

    if (response.status !== 401) return response

    const url = resolveRequestUrl(input)
    // Evita loop: endpoints de auth já são a renovação/login
    if (/\/auth\/v1\//i.test(url)) return response

    let body: unknown = null
    try {
      body = await response.clone().json()
    } catch {
      return response
    }

    if (!isInvalidJwtResponse(401, body)) return response

    const incoming = new Headers(init?.headers)
    // Uma única tentativa de refresh+retry por request (evita loop)
    if (incoming.get('x-bmb-auth-retry') === '1') return response

    const refreshed = await refreshOnce()

    if (refreshed.accessToken) {
      const headers = new Headers(init?.headers)
      headers.set('apikey', publishableKey)
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
      headers.set('x-bmb-auth-retry', '1')
      return fetch(input, { ...init, headers })
    }

    // Rede/instabilidade: não desloga — deixa a request falhar e o autoRefresh tentar depois
    if (!refreshed.fatal) return response

    await clearInvalidLocalSession(signOut)

    const headers = new Headers(init?.headers)
    headers.set('apikey', publishableKey)
    headers.set('Authorization', `Bearer ${publishableKey}`)
    headers.set('x-bmb-auth-retry', '1')

    return fetch(input, { ...init, headers })
  }
}
