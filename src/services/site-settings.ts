import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

export type SiteSetting = Tables<'site_settings'>

export async function getSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_settings').select('*')
  if (error) throw error
  const map: Record<string, string> = {}
  for (const item of data ?? []) {
    map[item.key] = item.value
  }
  return map
}

export async function updateSiteSettings(
  settings: Record<string, string>,
): Promise<{ error: string | null }> {
  const entries = Object.entries(settings).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('site_settings').upsert(entries, { onConflict: 'key' })
  if (error) return { error: error.message }
  return { error: null }
}
