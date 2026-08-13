import { supabase } from '@/lib/supabase/client'

export interface ContactInquiry {
  id: string
  name: string
  phone: string
  instrument: string
  message: string
  status: string
  created_at: string
}

export async function createContactInquiry(data: {
  name: string
  phone: string
  instrument: string
  message?: string
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('contact_inquiries').insert({
    name: data.name.trim(),
    phone: data.phone.trim(),
    instrument: data.instrument,
    message: data.message?.trim() || '',
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function getContactInquiries(): Promise<ContactInquiry[]> {
  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateContactInquiryStatus(
  id: string,
  status: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('contact_inquiries').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteContactInquiry(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('contact_inquiries').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
