import { supabase } from '@/lib/supabase/client'

export interface Profile {
  id: string
  full_name: string
  instrument: string
  registration_number: string
  avatar_url: string | null
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
