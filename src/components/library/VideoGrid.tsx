import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Video } from 'lucide-react'
import type { VideoItem } from '@/services/videos'
import {
  getCategoryIcon,
  getCategoryThumbnail,
  getCategoryColor,
} from '@/components/library/video-utils'
import { cn } from '@/lib/utils'
import { toEmbedUrl } from '@/lib/video-embed'

export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-muted-foreground bg-card/20 rounded-xl border border-white/5">
        <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg">Nenhuma videoaula encontrada.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {videos.map((video) => {
        const CategoryIcon = getCategoryIcon(video.category)
        const isPlaying = playingId === video.id

        return (
          <Card
            key={video.id}
            className={cn(
              'bg-card/40 border-white/5 transition-all duration-300 overflow-hidden group/card flex flex-col',
              isPlaying
                ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.15)] bg-card/60 ring-1 ring-primary/20'
                : 'hover:bg-card/60 hover:border-white/10',
            )}
          >
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="relative shrink-0 mt-0.5">
                <button
                  onClick={() => setPlayingId(isPlaying ? null : video.id)}
                  className={cn(
                    'w-24 h-16 sm:w-32 sm:h-20 rounded-xl bg-black/80 border border-white/10 overflow-hidden group/btn relative flex items-center justify-center transition-all duration-300 shadow-md',
                    isPlaying
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                      : 'hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]',
                  )}
                  aria-label={isPlaying ? `Parar ${video.title}` : `Reproduzir ${video.title}`}
                >
                  <img
                    src={getCategoryThumbnail(video)}
                    alt=""
                    className={cn(
                      'absolute inset-0 w-full h-full object-cover transition-all duration-500',
                      isPlaying
                        ? 'opacity-20 scale-110'
                        : 'opacity-40 group-hover/btn:opacity-30 group-hover/btn:scale-105',
                    )}
                  />

                  {isPlaying ? (
                    <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-200 shadow-lg">
                      <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
                    </div>
                  ) : (
                    <div className="relative z-10 w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform duration-300">
                      <Play
                        className="w-5 h-5 text-primary-foreground ml-0.5"
                        fill="currentColor"
                      />
                    </div>
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                  <h3
                    className={cn(
                      'font-bold text-base sm:text-lg truncate transition-colors pr-2',
                      isPlaying ? 'text-primary' : 'text-white group-hover/card:text-primary/90',
                    )}
                  >
                    {video.title}
                  </h3>
                  {video.category && (
                    <Badge
                      className={cn(
                        'shrink-0 self-start border-0 shadow-sm tracking-wider text-[10px] sm:text-xs uppercase font-bold py-0.5 px-2.5',
                        getCategoryColor(video.category),
                      )}
                    >
                      {video.category}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {video.description}
                </p>

                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground font-medium">
                  <CategoryIcon className="w-3.5 h-3.5 opacity-70" />
                  <span>{video.category || 'Geral'}</span>
                </div>
              </div>
            </div>

            {/* Expandable Video Area */}
            <div
              className={cn(
                'grid transition-all duration-500 ease-in-out bg-black',
                isPlaying ? 'grid-rows-[1fr] border-t border-white/10' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                {isPlaying && (
                  <div className="aspect-video relative w-full">
                    <iframe
                      src={toEmbedUrl(video.video_url)}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      title={video.title}
                    />
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                      <Badge
                        variant="outline"
                        className="bg-black/60 backdrop-blur-md border-white/10 text-white shadow-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                        Em reprodução
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
