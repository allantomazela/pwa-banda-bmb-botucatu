export type GovBrEnv = 'staging' | 'production'

export function getGovBrConfig() {
  const clientId = Deno.env.get('GOVBR_CLIENT_ID')?.trim()
  const clientSecret = Deno.env.get('GOVBR_CLIENT_SECRET')?.trim()
  const redirectUri = Deno.env.get('GOVBR_REDIRECT_URI')?.trim()
  const env = (Deno.env.get('GOVBR_ENV')?.trim() || 'staging') as GovBrEnv
  const appOrigin = (Deno.env.get('GOVBR_APP_ORIGIN')?.trim() || 'https://bandabmb.com.br').replace(
    /\/$/,
    '',
  )

  const baseUrl =
    env === 'production'
      ? 'https://sso.acesso.gov.br'
      : 'https://sso.staging.acesso.gov.br'

  return { clientId, clientSecret, redirectUri, env, appOrigin, baseUrl }
}

export function isGovBrConfigured(): boolean {
  const { clientId, clientSecret, redirectUri } = getGovBrConfig()
  return Boolean(clientId && clientSecret && redirectUri)
}

export function randomString(length = 43): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes).slice(0, length)
}

export function base64UrlEncode(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(hash)
}

export function portalRedirect(path: string, params?: Record<string, string>): string {
  const { appOrigin } = getGovBrConfig()
  const url = new URL(path, appOrigin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function redirectResponse(url: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: url },
  })
}

type JwtHeader = { alg?: string; kid?: string }
type JwtPayload = Record<string, unknown> & {
  sub?: string
  email?: string
  name?: string
  nonce?: string
  iss?: string
  aud?: string | string[]
  exp?: number
}

function decodePart(part: string): unknown {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4))
  return JSON.parse(atob(pad))
}

export async function verifyGovBrIdToken(
  idToken: string,
  expectedNonce: string,
  baseUrl: string,
): Promise<{ payload: JwtPayload; error: string | null }> {
  const parts = idToken.split('.')
  if (parts.length !== 3) return { payload: {}, error: 'Token Gov.br inválido' }

  const header = decodePart(parts[0]) as JwtHeader
  const payload = decodePart(parts[1]) as JwtPayload
  const signature = parts[2]

  if (!header.kid) return { payload: {}, error: 'Token Gov.br sem kid' }
  if (payload.nonce !== expectedNonce) return { payload: {}, error: 'Nonce Gov.br inválido' }
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return { payload: {}, error: 'Token Gov.br expirado' }
  }

  const jwksRes = await fetch(`${baseUrl}/jwk`, { method: 'GET' })
  if (!jwksRes.ok) return { payload: {}, error: 'Não foi possível obter chaves Gov.br' }
  const jwks = (await jwksRes.json()) as { keys?: Array<Record<string, string>> }
  const jwk = jwks.keys?.find((k) => k.kid === header.kid)
  if (!jwk) return { payload: {}, error: 'Chave Gov.br não encontrada' }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const sigBytes = Uint8Array.from(
    atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  )
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, signedData)
  if (!valid) return { payload: {}, error: 'Assinatura Gov.br inválida' }

  return { payload, error: null }
}

export async function exchangeGovBrCode(input: {
  code: string
  codeVerifier: string
  baseUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<{ idToken: string | null; accessToken: string | null; error: string | null }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    code_verifier: input.codeVerifier,
  })

  const res = await fetch(`${input.baseUrl}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const json = (await res.json()) as {
    id_token?: string
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!res.ok) {
    return {
      idToken: null,
      accessToken: null,
      error: json.error_description || json.error || 'Falha ao trocar código Gov.br',
    }
  }

  if (!json.id_token) {
    return { idToken: null, accessToken: null, error: 'Resposta Gov.br sem id_token' }
  }

  return {
    idToken: json.id_token,
    accessToken: json.access_token ?? null,
    error: null,
  }
}

export function extractAssurance(payload: JwtPayload): string | null {
  const level = payload['govbr_assurance_level']
  if (typeof level === 'string') return level
  const conf = payload.govbr_confiabilidades
  if (typeof conf === 'string') return conf
  if (Array.isArray(conf)) return conf.join(',')
  const amr = payload.amr
  if (Array.isArray(amr)) return amr.join(',')
  return null
}
