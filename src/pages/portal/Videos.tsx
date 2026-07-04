import { useState } from 'react'
import { useFetch } from '@/hooks/use-fetch'
import { getVideos, type VideoItem } from '@/services/videos'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, Loader2, Play } from 'lucide-react'

export default function Videos() {
  const { data: videos, loading } = useFetch<VideoItem[]>(getVideos)
  const [playingId, setPlayingId] = useState<string | null>(null)

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Videoaulas</h1>
        <p className="text-muted-foreground">Tutoriais, coreografias e fundamentos praticos.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Nenhum video disponivel no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
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
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-white mb-2 leading-tight">{video.title}</h3>
                <p className="text-sm text-muted-foreground">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
