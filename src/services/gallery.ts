import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/lib/supabase/types'
import { getSiteSettings, updateSiteSettings } from '@/services/site-settings'

export type GalleryPhoto = Tables<'gallery_photos'>

const SHOWCASE_KEY = 'home_showcase_photo_ids'
export const MAX_HOME_SHOWCASE = 12

export function parseShowcaseIds(raw?: string): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
    }
  } catch {
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  }
  return []
}

export async function getShowcasePhotoIds(): Promise<string[]> {
  const settings = await getSiteSettings()
  return parseShowcaseIds(settings[SHOWCASE_KEY])
}

export async function setShowcasePhotoIds(
  ids: string[],
): Promise<{ error: string | null }> {
  const unique = [...new Set(ids)].slice(0, MAX_HOME_SHOWCASE)
  return updateSiteSettings({ [SHOWCASE_KEY]: JSON.stringify(unique) })
}

export async function toggleShowcasePhoto(
  id: string,
): Promise<{ error: string | null; active: boolean; ids: string[] }> {
  const ids = await getShowcasePhotoIds()
  const active = ids.includes(id)
  if (active) {
    const next = ids.filter((item) => item !== id)
    const { error } = await setShowcasePhotoIds(next)
    return { error, active: false, ids: next }
  }
  if (ids.length >= MAX_HOME_SHOWCASE) {
    return {
      error: `Máximo de ${MAX_HOME_SHOWCASE} fotos no destaque da home.`,
      active: false,
      ids,
    }
  }
  const next = [...ids, id]
  const { error } = await setShowcasePhotoIds(next)
  return { error, active: true, ids: next }
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getEventPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('category', 'Eventos')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Fotos escolhidas no admin para o card principal da home. */
export async function getShowcasePhotos(): Promise<GalleryPhoto[]> {
  const ids = await getShowcasePhotoIds()
  if (ids.length === 0) return []

  const { data, error } = await supabase.from('gallery_photos').select('*').in('id', ids)
  if (error) throw error

  const byId = new Map((data ?? []).map((photo) => [photo.id, photo]))
  return ids.map((id) => byId.get(id)).filter((photo): photo is GalleryPhoto => Boolean(photo))
}

export async function createGalleryPhoto(
  data: Pick<TablesInsert<'gallery_photos'>, 'title' | 'image_url' | 'category'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gallery_photos').insert({
    title: data.title?.trim() || '',
    image_url: data.image_url,
    category: data.category || 'Galeria',
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function createGalleryPhotos(
  items: Array<Pick<TablesInsert<'gallery_photos'>, 'title' | 'image_url' | 'category'>>,
): Promise<{ error: string | null; count: number; ids: string[] }> {
  if (items.length === 0) return { error: 'Nenhuma imagem para salvar.', count: 0, ids: [] }
  const payload = items.map((item) => ({
    title: item.title?.trim() || '',
    image_url: item.image_url,
    category: item.category || 'Galeria',
  }))
  const { error, data } = await supabase.from('gallery_photos').insert(payload).select('id')
  if (error) return { error: error.message, count: 0, ids: [] }
  const ids = (data ?? []).map((row) => row.id)
  return { error: null, count: ids.length || payload.length, ids }
}

export async function deleteGalleryPhoto(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
  if (error) return { error: error.message }
  const showcaseIds = await getShowcasePhotoIds()
  if (showcaseIds.includes(id)) {
    await setShowcasePhotoIds(showcaseIds.filter((item) => item !== id))
  }
  return { error: null }
}

export async function uploadGalleryImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return { url: null, error: `${file.name}: arquivo muito grande (máx 5MB).` }
  }
  if (!file.type.startsWith('image/')) {
    return { url: null, error: `${file.name}: formato inválido.` }
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('gallery').upload(fileName, file)
  if (error) return { url: null, error: `${file.name}: falha no envio.` }
  const { data } = supabase.storage.from('gallery').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

const SITE_IMAGE_TYPES: Record<'logo' | 'hero' | 'sponsor', string[]> = {
  logo: ['image/webp', 'image/png', 'image/svg+xml', 'image/jpeg'],
  hero: ['image/webp', 'image/jpeg', 'image/png'],
  sponsor: ['image/webp', 'image/png', 'image/svg+xml', 'image/jpeg'],
}

const SITE_IMAGE_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
}

export async function uploadSiteImage(
  file: File,
  kind: 'logo' | 'hero' | 'sponsor',
): Promise<{ url: string | null; error: string | null }> {
  const allowed = SITE_IMAGE_TYPES[kind]
  if (!allowed.includes(file.type)) {
    const formats = kind === 'hero' ? 'WebP, JPEG ou PNG' : 'WebP, PNG, SVG ou JPEG'
    return { url: null, error: `Formato inválido. Use ${formats}.` }
  }
  const maxBytes = kind === 'hero' ? 5 * 1024 * 1024 : 2 * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      url: null,
      error:
        kind === 'hero' ? 'Arquivo muito grande (máx 5MB).' : 'Arquivo muito grande (máx 2MB).',
    }
  }
  const ext = SITE_IMAGE_EXT[file.type] || 'webp'
  const folder = kind === 'sponsor' ? 'sponsors' : kind
  const fileName = `site/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('gallery').upload(fileName, file)
  if (error) return { url: null, error: 'Falha no envio da imagem.' }
  const { data } = supabase.storage.from('gallery').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}
