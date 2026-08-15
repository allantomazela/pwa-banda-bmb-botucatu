import { useEffect, useState } from 'react'
import { getMemberVideos, type VideoItem } from '@/services/videos'
import { VideoGrid } from '@/components/library/VideoGrid'
import { Video, Loader2 } from 'lucide-react'

export default function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getMemberVideos()
        setVideos(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="container max-w-6xl animate-fade-in px-4 py-6 sm:py-8 lg:py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-white flex items-center gap-4 mb-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-sm">
            <Video className="w-7 h-7" />
          </div>
          Videoaulas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Videoaulas exclusivas para membros: tutoriais, coreografias e fundamentos práticos.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card/20 rounded-xl border border-white/5">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
          <p className="text-lg">Carregando acervo de vídeos...</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  )
}
