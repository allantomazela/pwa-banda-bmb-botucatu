import { supabase } from '@/lib/supabase/client'

export interface VideoItem {
  id: string
  title: string
  video_url: string
  description: string
  category: string
  created_at: string
}

export async function getVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
