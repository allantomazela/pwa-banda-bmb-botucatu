import { supabase } from '@/lib/supabase/client'

export interface EventItem {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  created_at: string
}

export async function getUpcomingEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getNextEvent(): Promise<EventItem | null> {
  const events = await getUpcomingEvents()
  return events[0] ?? null
}
