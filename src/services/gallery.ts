import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/lib/supabase/types'

export type GalleryPhoto = Tables<'gallery_photos'>

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createGalleryPhoto(
  data: Pick<TablesInsert<'gallery_photos'>, 'title' | 'image_url' | 'category'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gallery_photos').insert(data)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteGalleryPhoto(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function uploadGalleryImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('gallery').upload(fileName, file)
  if (error) return null
  const { data } = supabase.storage.from('gallery').getPublicUrl(fileName)
  return data.publicUrl
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
      error: kind === 'hero' ? 'Arquivo muito grande (máx 5MB).' : 'Arquivo muito grande (máx 2MB).',
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
