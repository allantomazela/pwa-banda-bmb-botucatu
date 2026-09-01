import {
  exchangeGovBrCode,
  extractAssurance,
  getGovBrConfig,
  isGovBrConfigured,
  portalRedirect,
  redirectResponse,
  verifyGovBrIdToken,
} from '../_shared/govbr.ts'
import { createServiceClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')
  const oauthErrorDesc = url.searchParams.get('error_description')

  if (oauthError) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', {
        govbr: 'error',
        reason: oauthErrorDesc || oauthError,
      }),
    )
  }

  if (!code || !state) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'missing_code' }),
    )
  }

  if (!isGovBrConfigured()) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'not_configured' }),
    )
  }

  const service = createServiceClient()
  const { clientId, clientSecret, redirectUri, baseUrl } = getGovBrConfig()

  const { data: oauthState, error: stateError } = await service
    .from('govbr_oauth_states')
    .select('*')
    .eq('state', state)
    .maybeSingle()

  if (stateError || !oauthState) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'invalid_state' }),
    )
  }

  if (new Date(oauthState.expires_at).getTime() < Date.now()) {
    await service.from('govbr_oauth_states').delete().eq('state', state)
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'expired' }),
    )
  }

  const { idToken, error: tokenError } = await exchangeGovBrCode({
    code,
    codeVerifier: oauthState.code_verifier,
    baseUrl,
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!,
  })

  if (tokenError || !idToken) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', {
        govbr: 'error',
        reason: tokenError || 'token_failed',
      }),
    )
  }

  const { payload, error: verifyError } = await verifyGovBrIdToken(
    idToken,
    oauthState.nonce,
    baseUrl,
  )

  if (verifyError) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: verifyError }),
    )
  }

  const { data: authRow, error: authError } = await service
    .from('travel_authorizations')
    .select('id, member_id, status, guardian_phone')
    .eq('id', oauthState.authorization_id)
    .maybeSingle()

  if (authError || !authRow || authRow.status !== 'pending') {
    await service.from('govbr_oauth_states').delete().eq('state', state)
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'authorization_invalid' }),
    )
  }

  const { data: guardianLink } = await service
    .from('guardian_links')
    .select('id')
    .eq('guardian_id', oauthState.user_id)
    .eq('student_id', authRow.member_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!guardianLink) {
    await service.from('govbr_oauth_states').delete().eq('state', state)
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'forbidden' }),
    )
  }

  const { data: guardianProfile } = await service
    .from('profiles')
    .select('full_name, cpf, guardian_phone')
    .eq('id', oauthState.user_id)
    .maybeSingle()

  const govbrName =
    (typeof payload.name === 'string' && payload.name) ||
    (typeof payload.given_name === 'string' && payload.given_name) ||
    guardianProfile?.full_name ||
    ''
  const govbrEmail = typeof payload.email === 'string' ? payload.email : ''
  const govbrSub = typeof payload.sub === 'string' ? payload.sub : ''
  const govbrAssurance = extractAssurance(payload)
  const signedAt = new Date().toISOString()
  const guardianDocument = guardianProfile?.cpf || govbrSub
  const guardianPhone = guardianProfile?.guardian_phone || authRow.guardian_phone || ''

  const evidence = {
    method: 'govbr',
    signed_at: signedAt,
    sub: govbrSub,
    name: govbrName,
    email: govbrEmail,
    assurance: govbrAssurance,
  }

  const { error: updateError } = await service
    .from('travel_authorizations')
    .update({
      status: 'signed',
      signature_method: 'govbr',
      signature_data: null,
      signed_at: signedAt,
      signer_user_id: oauthState.user_id,
      guardian_name: govbrName,
      guardian_document: guardianDocument,
      guardian_phone: guardianPhone,
      govbr_sub: govbrSub,
      govbr_name: govbrName,
      govbr_email: govbrEmail,
      govbr_assurance: govbrAssurance,
      signature_evidence: evidence,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
    })
    .eq('id', oauthState.authorization_id)
    .eq('status', 'pending')

  await service.from('govbr_oauth_states').delete().eq('state', state)

  if (updateError) {
    return redirectResponse(
      portalRedirect('/portal/autorizacoes', { govbr: 'error', reason: 'update_failed' }),
    )
  }

  return redirectResponse(portalRedirect('/portal/autorizacoes', { govbr: 'ok' }))
})
