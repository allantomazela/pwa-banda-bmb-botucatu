import { supabase } from '@/lib/supabase/client'

export type IdCardVerification = {
  full_name: string
  registration_number: string
  instrument: string
  valid_until: string | null
  city: string
  state: string
  role: string
  is_valid: boolean
}

export async function verifyIdCard(memberId: string): Promise<IdCardVerification | null> {
  const { data, error } = await supabase.rpc('verify_id_card', { member_id: memberId })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : null
  return row ?? null
}
