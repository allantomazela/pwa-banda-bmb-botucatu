import { supabase } from '@/lib/supabase/client'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  instrument: string
  registration_number: string
  avatar_url: string | null
  birth_date: string | null
  valid_until: string | null
  city: string
  state: string
  cpf: string
  disability_info: string | null
  rg: string
  role: string
  email: string
  approval_status: ApprovalStatus
  approved_at: string | null
  approved_by: string | null
  updated_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<Profile, 'id' | 'updated_at'>>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update(data).eq('id', userId)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: error.message }
  }

  return { error: null }
}
