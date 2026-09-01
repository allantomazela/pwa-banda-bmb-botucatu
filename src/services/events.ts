import { supabase } from '@/lib/supabase/client'

export interface EventItem {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  image_url: string
  created_at: string
}

export async function getUpcomingEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(normalizeEvent)
}

export async function getPastEvents(limit = 8): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(normalizeEvent)
}

export async function getNextEvent(): Promise<EventItem | null> {
  const events = await getUpcomingEvents()
  return events[0] ?? null
}

function normalizeEvent(row: {
  id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  image_url?: string | null
  created_at: string
}): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    event_date: row.event_date,
    location: row.location || '',
    image_url: row.image_url?.trim() || '',
    created_at: row.created_at,
  }
}
