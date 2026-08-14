import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'

export type Sponsor = Tables<'sponsors'>
export type SponsorKind = 'patrocinador' | 'apoiador'
export type SponsorInquiry = Tables<'sponsor_inquiries'>

export async function getVisibleSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createSponsor(
  data: Pick<TablesInsert<'sponsors'>, 'name' | 'logo_url' | 'website_url' | 'kind' | 'is_visible' | 'sort_order'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsors').insert({
    name: data.name.trim(),
    logo_url: data.logo_url.trim(),
    website_url: data.website_url?.trim() || '',
    kind: data.kind,
    is_visible: data.is_visible ?? true,
    sort_order: data.sort_order ?? 0,
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateSponsor(
  id: string,
  data: TablesUpdate<'sponsors'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsors').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteSponsor(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function createSponsorInquiry(data: {
  name: string
  email: string
  phone: string
  company?: string
  message?: string
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsor_inquiries').insert({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    company: data.company?.trim() || '',
    message: data.message?.trim() || '',
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function getSponsorInquiries(): Promise<SponsorInquiry[]> {
  const { data, error } = await supabase
    .from('sponsor_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateSponsorInquiryStatus(
  id: string,
  status: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsor_inquiries').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteSponsorInquiry(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sponsor_inquiries').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export function toExternalUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
