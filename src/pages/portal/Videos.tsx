import { useFetch } from '@/hooks/use-fetch'
import { getVideos, type VideoItem } from '@/services/videos'
import { VideoGrid } from '@/components/library/VideoGrid'
import { PlayCircle, Loader2 } from 'lucide-react'

export default function Videos() {
  const { data: videos, loading } = useFetch<VideoItem[]>(getVideos)

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Videoaulas</h1>
        <p className="text-muted-foreground">Tutoriais, coreografias e fundamentos práticos.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Nenhum vídeo disponível no momento.</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  )
}
