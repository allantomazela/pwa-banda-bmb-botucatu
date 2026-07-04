import { MOCK_VIDEOS } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayCircle } from 'lucide-react'

export default function Videos() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Videoaulas</h1>
        <p className="text-muted-foreground">Tutoriais, coreografias e fundamentos práticos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_VIDEOS.map((video) => (
          <Card key={video.id} className="bg-card border-white/5 overflow-hidden group">
            <div className="aspect-video relative bg-black flex items-center justify-center border-b border-white/10">
              {/* For production, this would be an actual iframe. Mocking with thumbnail for better visual. */}
              <img
                src={`https://img.usecurling.com/p/800/450?q=music%20lesson&color=blue&seed=${video.id}`}
                alt="Thumbnail"
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
              />
              <PlayCircle className="w-12 h-12 text-white z-10 group-hover:scale-110 transition-transform cursor-pointer" />
              <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground pointer-events-none">
                {video.category}
              </Badge>
            </div>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg text-white mb-2 leading-tight">{video.title}</h3>
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
