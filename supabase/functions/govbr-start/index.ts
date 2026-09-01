import {
  getGovBrConfig,
  isGovBrConfigured,
  jsonResponse,
  randomString,
  sha256Base64Url,
} from '../_shared/govbr.ts'
import { createServiceClient, createUserClient, isGovBrSigningEnabled } from '../_shared/supabase.ts'

const GOVBR_SCOPE =
  'openid email profile govbr_confiabilidades govbr_confiabilidades_idtoken'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405)
  }

  if (!isGovBrConfigured()) {
    return jsonResponse(
      {
        error:
          'Integração Gov.br ainda não configurada. Configure GOVBR_CLIENT_ID, GOVBR_CLIENT_SECRET e GOVBR_REDIRECT_URI no Supabase.',
      },
      503,
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  let authorizationId = ''
  try {
    const body = (await req.json()) as { authorizationId?: string }
    authorizationId = body.authorizationId?.trim() ?? ''
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400)
  }

  if (!authorizationId) {
    return jsonResponse({ error: 'Informe authorizationId' }, 400)
  }

  const userClient = createUserClient(authHeader)
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Sessão inválida' }, 401)
  }

  const service = createServiceClient()

  const enabled = await isGovBrSigningEnabled(service)
  if (!enabled) {
    return jsonResponse({ error: 'Assinatura Gov.br desativada pelo administrador.' }, 403)
  }

  const { data: authRow, error: authError } = await service
    .from('travel_authorizations')
    .select('id, member_id, status')
    .eq('id', authorizationId)
    .maybeSingle()

  if (authError || !authRow) {
    return jsonResponse({ error: 'Autorização não encontrada' }, 404)
  }

  if (authRow.status !== 'pending') {
    return jsonResponse({ error: 'Esta autorização já foi processada' }, 409)
  }

  const { data: canSign, error: rpcError } = await userClient.rpc('is_active_guardian_of', {
    p_student_id: authRow.member_id,
  })

  if (rpcError || !canSign) {
    return jsonResponse({ error: 'Sem permissão para assinar esta autorização' }, 403)
  }

  const { clientId, redirectUri, baseUrl } = getGovBrConfig()
  const state = randomString(32)
  const nonce = randomString(32)
  const codeVerifier = randomString(64)
  const codeChallenge = await sha256Base64Url(codeVerifier)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  await service.from('govbr_oauth_states').delete().lt('expires_at', new Date().toISOString())

  const { error: stateError } = await service.from('govbr_oauth_states').insert({
    state,
    code_verifier: codeVerifier,
    nonce,
    authorization_id: authorizationId,
    user_id: user.id,
    expires_at: expiresAt,
  })

  if (stateError) {
    return jsonResponse({ error: 'Não foi possível iniciar fluxo Gov.br' }, 500)
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    scope: GOVBR_SCOPE,
    redirect_uri: redirectUri!,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const redirectUrl = `${baseUrl}/authorize?${params.toString()}`

  return jsonResponse({ redirectUrl })
})
