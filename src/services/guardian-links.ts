import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

export type GuardianLink = Tables<'guardian_links'>

export type GuardianLinkWithStudent = GuardianLink & {
  profiles: {
    id: string
    full_name: string
    registration_number: string
    birth_date: string | null
    guardian_name: string | null
    guardian_phone: string | null
    email: string
  } | null
}

export async function inviteGuardianForStudent(input: {
  studentId: string
  email: string
  relationship?: string
}): Promise<{ error: string | null; id: string | null }> {
  const { data, error } = await supabase.rpc('invite_guardian_for_student', {
    p_student_id: input.studentId,
    p_email: input.email.trim(),
    p_relationship: input.relationship?.trim() || 'Responsável',
  })
  if (error) return { error: error.message, id: null }
  return { error: null, id: data as string }
}

export async function activateGuardianInvites(): Promise<{ error: string | null; count: number }> {
  const { data, error } = await supabase.rpc('activate_guardian_invites')
  if (error) return { error: error.message, count: 0 }
  return { error: null, count: (data as number) ?? 0 }
}

export async function listLinksForStudent(studentId: string): Promise<GuardianLink[]> {
  const { data, error } = await supabase
    .from('guardian_links')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function revokeGuardianLink(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('guardian_links')
    .update({ status: 'revoked' })
    .eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function listMyLinkedStudents(): Promise<GuardianLinkWithStudent[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('guardian_links')
    .select(
      '*, profiles:student_id ( id, full_name, registration_number, birth_date, guardian_name, guardian_phone, email )',
    )
    .eq('guardian_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as GuardianLinkWithStudent[]
}

export function linkStatusLabel(status: string) {
  if (status === 'active') return 'Ativo'
  if (status === 'revoked') return 'Revogado'
  return 'Aguardando cadastro'
}
