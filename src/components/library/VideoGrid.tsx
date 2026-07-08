import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, PlayCircle } from 'lucide-react'
import type { VideoItem } from '@/services/videos'

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
      {videos.map((video) => (
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
                  src={`https://img.usecurling.com/p/800/450?q=music%20lesson&color=blue&seed=${video.id}`}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                />
                <button
                  className="absolute inset-0 flex items-center justify-center z-10"
                  onClick={() => setPlayingId(video.id)}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-primary-foreground ml-1" />
                  </div>
                </button>
                {video.category && (
                  <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground pointer-events-none">
                    {video.category}
                  </Badge>
                )}
              </>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-white mb-1 leading-tight">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
