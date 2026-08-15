import { supabase } from '@/lib/supabase/client'

export interface VideoItem {
  id: string
  title: string
  video_url: string
  description: string
  category: string
  created_at: string
  is_public: boolean
}

export async function getPublicVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as VideoItem[]) ?? []
}

export async function getMemberVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_public', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as VideoItem[]) ?? []
}

export async function getVideos(): Promise<VideoItem[]> {
  return getMemberVideos()
}
