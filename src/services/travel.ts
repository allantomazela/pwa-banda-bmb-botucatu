import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'
import { isMinor } from '@/lib/formatters'

export type TravelTrip = Tables<'travel_trips'>
export type TravelAuthorization = Tables<'travel_authorizations'>

export type TravelAuthorizationWithTrip = TravelAuthorization & {
  travel_trips: Pick<
    TravelTrip,
    'id' | 'title' | 'destination' | 'departure_at' | 'return_at' | 'description' | 'is_active'
  > | null
}

export type TravelAuthorizationWithMember = TravelAuthorization & {
  profiles: {
    id: string
    full_name: string
    registration_number: string
    birth_date: string | null
  } | null
}

export async function listTravelTrips(): Promise<TravelTrip[]> {
  const { data, error } = await supabase
    .from('travel_trips')
    .select('*')
    .order('departure_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTravelTrip(
  input: Pick<
    TablesInsert<'travel_trips'>,
    'title' | 'destination' | 'departure_at' | 'return_at' | 'description' | 'is_active'
  >,
): Promise<{ error: string | null; trip: TravelTrip | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('travel_trips')
    .insert({
      title: input.title.trim(),
      destination: input.destination?.trim() || '',
      departure_at: input.departure_at,
      return_at: input.return_at || null,
      description: input.description?.trim() || '',
      is_active: input.is_active ?? true,
      created_by: user?.id ?? null,
    })
    .select('*')
    .single()
  if (error) return { error: error.message, trip: null }
  return { error: null, trip: data }
}

export async function updateTravelTrip(
  id: string,
  input: TablesUpdate<'travel_trips'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('travel_trips').update(input).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteTravelTrip(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('travel_trips').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function listAuthorizationsForTrip(
  tripId: string,
): Promise<TravelAuthorizationWithMember[]> {
  const { data, error } = await supabase
    .from('travel_authorizations')
    .select(
      '*, profiles:member_id ( id, full_name, registration_number, birth_date )',
    )
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as TravelAuthorizationWithMember[]
}

export async function generateAuthorizationsForMinors(
  tripId: string,
): Promise<{ error: string | null; created: number }> {
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, birth_date, guardian_name, guardian_phone, approval_status')
    .eq('approval_status', 'approved')
  if (membersError) return { error: membersError.message, created: 0 }

  const minors = (members ?? []).filter((m) => isMinor(m.birth_date))
  if (minors.length === 0) return { error: null, created: 0 }

  const { data: existing } = await supabase
    .from('travel_authorizations')
    .select('member_id')
    .eq('trip_id', tripId)
  const existingIds = new Set((existing ?? []).map((row) => row.member_id))

  const payload = minors
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      trip_id: tripId,
      member_id: m.id,
      guardian_name: m.guardian_name || '',
      guardian_phone: m.guardian_phone || '',
      status: 'pending' as const,
      signature_method: 'canvas' as const,
    }))

  if (payload.length === 0) return { error: null, created: 0 }

  const { error, data } = await supabase
    .from('travel_authorizations')
    .insert(payload)
    .select('id')
  if (error) return { error: error.message, created: 0 }
  return { error: null, created: data?.length ?? payload.length }
}

export async function revokeAuthorization(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('travel_authorizations')
    .update({
      status: 'revoked',
      signature_data: null,
      signed_at: null,
      signature_method: 'canvas',
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function listMyAuthorizations(): Promise<TravelAuthorizationWithTrip[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('travel_authorizations')
    .select(
      '*, travel_trips ( id, title, destination, departure_at, return_at, description, is_active )',
    )
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TravelAuthorizationWithTrip[]
}

export async function signTravelAuthorization(input: {
  authorizationId: string
  guardianName: string
  guardianPhone: string
  guardianDocument: string
  signatureData: string
}): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const { error } = await supabase
    .from('travel_authorizations')
    .update({
      guardian_name: input.guardianName.trim(),
      guardian_phone: input.guardianPhone.trim(),
      guardian_document: input.guardianDocument.trim(),
      signature_data: input.signatureData,
      signature_method: 'canvas',
      status: 'signed',
      signed_at: new Date().toISOString(),
      signer_user_id: user.id,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
    })
    .eq('id', input.authorizationId)
    .eq('member_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  return { error: null }
}

export function authorizationStatusLabel(status: string) {
  if (status === 'signed') return 'Assinada'
  if (status === 'revoked') return 'Revogada'
  return 'Pendente'
}
