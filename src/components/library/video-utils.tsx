import { GraduationCap, Award, Footprints, Wind, Music, Video, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { VideoItem } from '@/services/videos'

export function getCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case 'Método I':
      return GraduationCap
    case 'Método II':
      return Award
    case 'Marcha':
      return Footprints
    case 'Coreografia':
      return Wind
    case 'Instrumento':
      return Music
    default:
      return Video
  }
}

export function getCategoryThumbnail(video: VideoItem): string {
  const queryMap: Record<string, string> = {
    'Método I': 'music%20lesson%20beginner',
    'Método II': 'music%20lesson%20advanced',
    Marcha: 'marching%20band',
    Coreografia: 'dance%20performance',
    Instrumento: 'musical%20instrument',
  }
  const query = queryMap[video.category] ?? 'music%20lesson'
  return `https://img.usecurling.com/p/800/450?q=${query}&color=blue&dpr=2`
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Método I':
      return 'bg-blue-500/90'
    case 'Método II':
      return 'bg-purple-500/90'
    case 'Marcha':
      return 'bg-orange-500/90'
    case 'Coreografia':
      return 'bg-pink-500/90'
    case 'Instrumento':
      return 'bg-green-500/90'
    default:
      return 'bg-primary/90'
  }
}
