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
