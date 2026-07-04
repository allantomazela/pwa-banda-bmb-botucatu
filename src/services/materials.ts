import { supabase } from '@/lib/supabase/client'

export interface Material {
  id: string
  title: string
  file_path: string
  category: string
  created_at: string
}

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMaterialDownloadUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('band-materials')
    .createSignedUrl(filePath, 3600)
  if (error) return null
  return data.signedUrl
}
