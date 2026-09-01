import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'
import { RESERVED_SLUGS, slugify } from '@/lib/cms'

export type SitePage = Tables<'site_pages'>
export type SiteSection = Tables<'site_sections'>

export async function getSitePages(): Promise<SitePage[]> {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getNavPages(): Promise<SitePage[]> {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('show_in_nav', true)
    .eq('is_system', false)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getPageBySlug(slug: string): Promise<SitePage | null> {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createSitePage(input: {
  title: string
  nav_label: string
  show_in_nav: boolean
}): Promise<{ error: string | null; page?: SitePage }> {
  const slug = slugify(input.title)
  if (!slug) return { error: 'Informe um título válido para gerar o endereço.' }
  if (RESERVED_SLUGS.includes(slug)) {
    return { error: 'Esse endereço já é usado por uma página do sistema.' }
  }

  const pages = await getSitePages()
  const sort_order = pages.reduce((max, page) => Math.max(max, page.sort_order), 0) + 1

  const payload: TablesInsert<'site_pages'> = {
    slug,
    title: input.title.trim(),
    nav_label: input.nav_label.trim() || input.title.trim(),
    show_in_nav: input.show_in_nav,
    is_system: false,
    sort_order,
  }

  const { data, error } = await supabase.from('site_pages').insert(payload).select('*').single()
  if (error) return { error: error.message }
  return { error: null, page: data }
}

export async function updateSitePage(
  id: string,
  patch: TablesUpdate<'site_pages'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_pages').update(patch).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteSitePage(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_pages').delete().eq('id', id).eq('is_system', false)
  if (error) return { error: error.message }
  return { error: null }
}

export async function getVisibleSections(pageId: string): Promise<SiteSection[]> {
  const { data, error } = await supabase
    .from('site_sections')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAllSections(pageId: string): Promise<SiteSection[]> {
  const { data, error } = await supabase
    .from('site_sections')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createSection(
  payload: TablesInsert<'site_sections'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_sections').insert(payload)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateSection(
  id: string,
  patch: TablesUpdate<'site_sections'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_sections').update(patch).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteSection(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_sections').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
