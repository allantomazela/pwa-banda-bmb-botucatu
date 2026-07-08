import { useState, useMemo } from 'react'
import { useFetch } from '@/hooks/use-fetch'
import { getMaterials, type Material } from '@/services/materials'
import { getVideos, type VideoItem } from '@/services/videos'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search, Loader2, FileText, Video } from 'lucide-react'
import { MaterialList } from '@/components/library/MaterialList'
import { VideoGrid } from '@/components/library/VideoGrid'

const METHODS = ['Método I', 'Método II'] as const

export default function Library() {
  const [search, setSearch] = useState('')
  const { data: materials, loading: materialsLoading } = useFetch<Material[]>(getMaterials)
  const { data: videos, loading: videosLoading } = useFetch<VideoItem[]>(getVideos)

  const loading = materialsLoading || videosLoading

  const filteredByMethod = useMemo(() => {
    const q = search.toLowerCase()
    return METHODS.map((method) => {
      const mats = (materials ?? []).filter(
        (m) => m.category === method && m.title.toLowerCase().includes(q),
      )
      const vids = (videos ?? []).filter(
        (v) =>
          v.category === method &&
          (v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)),
      )
      return { method, materials: mats, videos: vids }
    })
  }, [materials, videos, search])

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Biblioteca Didática</h1>
        <p className="text-muted-foreground">
          Acesse partituras, métodos e videoaulas organizados por método de estudo.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar material ou vídeo..."
          className="pl-10 bg-card border-white/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue={METHODS[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {METHODS.map((method) => (
              <TabsTrigger key={method} value={method}>
                {method}
              </TabsTrigger>
            ))}
          </TabsList>
          {filteredByMethod.map(({ method, materials: mats, videos: vids }) => (
            <TabsContent key={method} value={method} className="space-y-8 mt-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Materiais</h2>
                  <span className="text-sm text-muted-foreground">({mats.length})</span>
                </div>
                <MaterialList materials={mats} />
              </section>
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Vídeos</h2>
                  <span className="text-sm text-muted-foreground">({vids.length})</span>
                </div>
                <VideoGrid videos={vids} />
              </section>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
