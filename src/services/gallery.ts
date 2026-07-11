import { supabase } from '@/lib/supabase/client'

export interface GalleryPhoto {
  id: string
  title: string
  image_url: string
  category: string
  created_at: string
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('gallery_photos' as any)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as GalleryPhoto[]) ?? []
}

export async function createGalleryPhoto(data: {
  title: string
  image_url: string
  category: string
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gallery_photos' as any).insert(data)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteGalleryPhoto(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('gallery_photos' as any)
    .delete()
    .eq('id', id)
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
