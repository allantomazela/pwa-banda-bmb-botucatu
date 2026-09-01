import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/services/profiles'
import type { EventItem } from '@/services/events'
import type { Material } from '@/services/materials'
import type { VideoItem } from '@/services/videos'
import { addYearsToDate } from '@/lib/formatters'

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return (data as Profile[]) ?? []
}

export async function getAllEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
  if (error) throw error
  return ((data as EventItem[]) ?? []).map((row) => ({
    ...row,
    description: row.description || '',
    location: row.location || '',
    image_url: row.image_url?.trim() || '',
  }))
}

export async function updateProfileAdmin(
  userId: string,
  data: Partial<Omit<Profile, 'id' | 'updated_at'>>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update(data).eq('id', userId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function setMemberApproval(
  userId: string,
  status: 'approved' | 'rejected',
  adminId: string,
): Promise<{ error: string | null }> {
  const patch: {
    approval_status: 'approved' | 'rejected'
    approved_at: string | null
    approved_by: string | null
    valid_until?: string
  } = {
    approval_status: status,
    approved_at: status === 'approved' ? new Date().toISOString() : null,
    approved_by: status === 'approved' ? adminId : null,
  }

  if (status === 'approved') {
    const { data } = await supabase
      .from('profiles')
      .select('valid_until')
      .eq('id', userId)
      .maybeSingle()
    if (!data?.valid_until) {
      patch.valid_until = addYearsToDate(1)
    }
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function createEvent(data: {
  title: string
  description: string | null
  event_date: string
  location: string | null
  image_url?: string | null
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('events').insert({
    ...data,
    image_url: data.image_url?.trim() || '',
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    event_date: string
    location: string | null
    image_url: string | null
  }>,
): Promise<{ error: string | null }> {
  const payload = { ...data }
  if (payload.image_url !== undefined) {
    payload.image_url = payload.image_url?.trim() || ''
  }
  const { error } = await supabase.from('events').update(payload).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteEvent(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function createVideo(data: {
  title: string
  description: string
  video_url: string
  category: string
  is_public: boolean
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').insert(data)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateVideo(
  id: string,
  data: Partial<{
    title: string
    description: string
    video_url: string
    category: string
    is_public: boolean
  }>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteVideo(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function createMaterial(data: {
  title: string
  file_path: string
  category: string
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('materials').insert(data)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateMaterial(
  id: string,
  data: Partial<{ title: string; file_path: string; category: string }>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('materials').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteMaterial(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function uploadMaterialFile(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('band-materials').upload(fileName, file)
  if (error) return null
  return fileName
}

export async function getAllMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Material[]) ?? []
}

export async function getAllVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as VideoItem[]) ?? []
}

export async function getAdminStats(): Promise<{
  totalMembers: number
  totalLibrary: number
  pendingEvents: number
  totalPhotos: number
}> {
  const [profiles, materials, videos, eventsRes, photosRes] = await Promise.all([
    getAllProfiles(),
    getAllMaterials(),
    getAllVideos(),
    supabase.from('events').select('id').gte('event_date', new Date().toISOString()),
    supabase.from('gallery_photos').select('id'),
  ])
  return {
    totalMembers: profiles.length,
    totalLibrary: materials.length + videos.length,
    pendingEvents: eventsRes.data?.length ?? 0,
    totalPhotos: photosRes.data?.length ?? 0,
  }
}
