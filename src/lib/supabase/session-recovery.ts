/**
 * Recupera o app quando o browser guarda um JWT inválido/corrompido.
 * Sintoma típico: REST 401 PGRST301 com apikey válida.
 */

let clearing = false

export function isInvalidJwtResponse(status: number, body: unknown): boolean {
  if (status !== 401) return false
  if (!body || typeof body !== 'object') return false

  const record = body as Record<string, unknown>
  const code = String(record.code ?? '')
  const message = `${record.message ?? ''} ${record.details ?? ''}`

  return (
    code === 'PGRST301' ||
    /jwt|wrong key type|expected 3 parts|no suitable key/i.test(message)
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

export function createSessionRecoveryFetch(options: {
  publishableKey: string
  signOut: () => Promise<unknown>
}): typeof fetch {
  const { publishableKey, signOut } = options

  return async (input, init) => {
    const response = await fetch(input, init)

    if (response.status !== 401) return response

    let body: unknown = null
    try {
      body = await response.clone().json()
    } catch {
      return response
    }

    if (!isInvalidJwtResponse(401, body)) return response

    await clearInvalidLocalSession(signOut)

    const headers = new Headers(init?.headers)
    headers.set('apikey', publishableKey)
    headers.set('Authorization', `Bearer ${publishableKey}`)

    return fetch(input, { ...init, headers })
  }
}
