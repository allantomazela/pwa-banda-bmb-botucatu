import { supabase } from '@/lib/supabase/client'
import {
  IMAGE_CONSENT_VERSION,
  buildImageConsentText,
  type ImageConsentStatus,
} from '@/lib/image-consent'

export async function recordImageConsent(input: {
  profileId: string
  action: 'granted' | 'denied' | 'revoked'
  actorName: string
  actorRole: 'self' | 'guardian'
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('record_image_consent', {
    p_profile_id: input.profileId,
    p_action: input.action,
    p_actor_name: input.actorName.trim(),
    p_actor_role: input.actorRole,
    p_consent_version: IMAGE_CONSENT_VERSION,
    p_consent_text: buildImageConsentText(),
  })
  if (error) return { error: error.message }
  return { error: null }
}

export function isImageConsentGranted(status: string | null | undefined): boolean {
  return status === 'granted'
}

export type { ImageConsentStatus }
