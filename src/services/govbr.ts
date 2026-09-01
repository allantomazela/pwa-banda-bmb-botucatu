import { supabase } from '@/lib/supabase/client'
import { getSiteSettings } from '@/services/site-settings'

export async function isGovBrSigningEnabled(): Promise<boolean> {
  const settings = await getSiteSettings()
  return settings.govbr_signing_enabled === 'true'
}

export async function startGovBrSign(
  authorizationId: string,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('govbr-start', {
    body: { authorizationId },
  })

  if (error) return { error: error.message }

  const payload = data as { error?: string; redirectUrl?: string } | null
  if (payload?.error) return { error: payload.error }
  if (payload?.redirectUrl) {
    window.location.href = payload.redirectUrl
    return { error: null }
  }

  return { error: 'Resposta inesperada ao iniciar assinatura Gov.br.' }
}

export function signatureMethodLabel(method: string | null | undefined): string {
  if (method === 'govbr') return 'Gov.br'
  return 'No aparelho'
}
