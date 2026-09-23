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
  profiles?: {
    full_name: string
    registration_number?: string | null
    birth_date?: string | null
    cpf?: string | null
  } | null
}

export type TravelAuthorizationWithMember = TravelAuthorization & {
  profiles: {
    id: string
    full_name: string
    registration_number: string
    birth_date: string | null
    cpf?: string | null
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
      '*, profiles:member_id ( id, full_name, registration_number, birth_date, cpf )',
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
      govbr_sub: null,
      govbr_name: null,
      govbr_email: null,
      govbr_assurance: null,
      signature_evidence: null,
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
      '*, travel_trips ( id, title, destination, departure_at, return_at, description, is_active ), profiles:member_id ( full_name, registration_number, birth_date, cpf )',
    )
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TravelAuthorizationWithTrip[]
}

/** Autorizações dos alunos vinculados ao responsável logado (RLS). */
export async function listGuardianAuthorizations(): Promise<TravelAuthorizationWithTrip[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: links, error: linksError } = await supabase
    .from('guardian_links')
    .select('student_id')
    .eq('guardian_id', user.id)
    .eq('status', 'active')
  if (linksError) throw linksError

  const studentIds = (links ?? []).map((l) => l.student_id)
  if (studentIds.length === 0) return []

  const { data, error } = await supabase
    .from('travel_authorizations')
    .select(
      '*, travel_trips ( id, title, destination, departure_at, return_at, description, is_active ), profiles:member_id ( full_name, registration_number, birth_date, cpf )',
    )
    .in('member_id', studentIds)
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

  // RLS: aluno não atualiza; guardian ativo ou admin pode assinar
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
    .eq('status', 'pending')

  if (error) return { error: error.message }
  return { error: null }
}

export async function listSignedAuthorizations(): Promise<TravelAuthorizationWithTrip[]> {
  const { data, error } = await supabase
    .from('travel_authorizations')
    .select(
      '*, travel_trips ( id, title, destination, departure_at, return_at, description, is_active ), profiles:member_id ( full_name, registration_number, birth_date, cpf )',
    )
    .eq('status', 'signed')
    .order('signed_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TravelAuthorizationWithTrip[]
}

export type TravelAuthVerification = {
  authorization_id: string
  status: string
  is_valid: boolean
  student_name: string
  registration_number: string
  trip_title: string
  destination: string
  departure_at: string | null
  return_at: string | null
  guardian_name: string
  signature_method: string
  signed_at: string | null
  govbr_name: string | null
  govbr_assurance: string | null
}

export async function verifyTravelAuthorization(
  authorizationId: string,
): Promise<TravelAuthVerification | null> {
  const { data, error } = await supabase.rpc('verify_travel_authorization', {
    authorization_id: authorizationId,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : null
  return (row as TravelAuthVerification | null) ?? null
}

export function authorizationStatusLabel(status: string) {
  return authorizationStatusMeta(status).label
}

export type AuthorizationStatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export function authorizationStatusMeta(status: string): {
  label: string
  tone: AuthorizationStatusTone
  studentHint: string
} {
  if (status === 'signed') {
    return {
      label: 'Assinada',
      tone: 'success',
      studentHint: 'Um responsável legal já autorizou esta viagem.',
    }
  }
  if (status === 'revoked') {
    return {
      label: 'Revogada',
      tone: 'danger',
      studentHint: 'Esta autorização foi revogada pela administração.',
    }
  }
  return {
    label: 'Pendente',
    tone: 'warning',
    studentHint: 'Aguardando assinatura de um responsável legal vinculado.',
  }
}

export function authorizationStatusBadgeClass(tone: AuthorizationStatusTone): string {
  if (tone === 'success') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (tone === 'danger') return 'bg-destructive/15 text-destructive border-destructive/30'
  if (tone === 'warning') return 'bg-amber-500/15 text-amber-200 border-amber-500/30'
  return 'bg-muted text-muted-foreground border-border'
}

/** Resumo para o aluno menor (1 assinatura de responsável já valida no sistema BMB). */
export function summarizeStudentAuthOverview(statuses: string[]): {
  tone: AuthorizationStatusTone
  title: string
  description: string
} {
  const pending = statuses.filter((s) => s === 'pending').length
  const signed = statuses.filter((s) => s === 'signed').length
  const revoked = statuses.filter((s) => s === 'revoked').length

  if (statuses.length === 0) {
    return {
      tone: 'neutral',
      title: 'Nenhuma viagem pendente',
      description:
        'Quando houver viagem, o responsável legal vinculado assina por você. Nesta conta você só acompanha o status.',
    }
  }

  if (pending === 0 && revoked === 0 && signed > 0) {
    return {
      tone: 'success',
      title: 'Tudo autorizado',
      description:
        'Todas as viagens listadas já foram assinadas por um responsável legal vinculado. Basta um responsável assinar — não é necessário os dois. Você não assina nesta conta.',
    }
  }

  if (pending > 0 && signed === 0 && revoked === 0) {
    return {
      tone: 'warning',
      title: pending === 1 ? '1 autorização pendente' : `${pending} autorizações pendentes`,
      description:
        'Aguarde a assinatura de um responsável legal vinculado no portal. Você acompanha o status aqui; a assinatura não é feita nesta conta.',
    }
  }

  if (revoked > 0 && pending === 0 && signed === 0) {
    return {
      tone: 'danger',
      title: 'Autorização revogada',
      description:
        'Há autorização revogada. Fale com a administração ou com o responsável vinculado.',
    }
  }

  const parts: string[] = []
  if (signed > 0) parts.push(`${signed} assinada${signed > 1 ? 's' : ''}`)
  if (pending > 0) parts.push(`${pending} pendente${pending > 1 ? 's' : ''}`)
  if (revoked > 0) parts.push(`${revoked} revogada${revoked > 1 ? 's' : ''}`)

  return {
    tone: pending > 0 ? 'warning' : revoked > 0 ? 'danger' : 'success',
    title: 'Status das autorizações',
    description: `${parts.join(' · ')}. No sistema da BMB, a viagem fica autorizada com a assinatura de um responsável legal vinculado (não precisa dos dois). Você só visualiza o status nesta conta.`,
  }
}

