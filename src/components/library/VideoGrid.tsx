import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, PlayCircle } from 'lucide-react'
import type { VideoItem } from '@/services/videos'
import {
  getCategoryIcon,
  getCategoryThumbnail,
  getCategoryColor,
} from '@/components/library/video-utils'

export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  if (videos.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Nenhum vídeo encontrado para este método.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {videos.map((video) => {
        const CategoryIcon = getCategoryIcon(video.category)
        return (
          <Card key={video.id} className="bg-card border-white/5 overflow-hidden group">
            <div className="aspect-video relative bg-black border-b border-white/10">
              {playingId === video.id ? (
                <iframe
                  src={video.video_url}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title={video.title}
                />
              ) : (
                <>
                  <img
                    src={getCategoryThumbnail(video)}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity duration-300"
                  />
                  <button
                    className="absolute inset-0 flex items-center justify-center z-10"
                    onClick={() => setPlayingId(video.id)}
                    aria-label={`Reproduzir ${video.title}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </button>
                  <div className="absolute top-3 left-3">
                    <div className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {video.category && (
                    <Badge
                      className={`absolute top-3 right-3 ${getCategoryColor(video.category)} text-white pointer-events-none border-0`}
                    >
                      {video.category}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CategoryIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white mb-1 leading-tight">{video.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
