import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Play, Video } from 'lucide-react'
import type { VideoItem } from '@/services/videos'
import {
  getCategoryIcon,
  getCategoryThumbnail,
  getCategoryColor,
} from '@/components/library/video-utils'
import { cn } from '@/lib/utils'
import { VideoPlayerOverlay } from '@/components/media/VideoPlayerOverlay'

export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = videos.find((v) => v.id === activeId) ?? null
  const closePlayer = useCallback(() => setActiveId(null), [])

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-card/20 px-4 py-16 text-center text-muted-foreground">
        <Video className="mx-auto mb-4 h-12 w-12 opacity-20" />
        <p className="text-lg">Nenhuma videoaula encontrada nesta categoria.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const CategoryIcon = getCategoryIcon(video.category)
          const thumb = getCategoryThumbnail(video)

          return (
            <button
              key={video.id}
              type="button"
              onClick={() => setActiveId(video.id)}
              className="group flex min-h-[44px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-card/40 text-left transition-all hover:border-primary/40 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Assistir ${video.title}`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14">
                    <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" aria-hidden />
                  </span>
                </div>
                {video.category ? (
                  <Badge
                    className={cn(
                      'pointer-events-none absolute left-2 top-2 border-0 text-[10px] font-bold uppercase tracking-wider shadow-sm',
                      getCategoryColor(video.category),
                    )}
                  >
                    {video.category}
                  </Badge>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
                  {video.title}
                </h3>
                {video.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {video.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] font-medium text-muted-foreground">
                  <CategoryIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">Toque para assistir</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {active?.video_url ? (
        <VideoPlayerOverlay
          open
          title={active.title || 'Videoaula'}
          videoUrl={active.video_url}
          onClose={closePlayer}
        />
      ) : null}
    </>
  )
}
