import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getMaterials, type Material } from '@/services/materials'
import { getMemberVideos, type VideoItem } from '@/services/videos'
import {
  MATERIAL_CATEGORIES,
  VIDEO_CATEGORIES,
  groupByCategory,
} from '@/lib/library'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { FileText, Loader2, Search, Video } from 'lucide-react'
import { MaterialList } from '@/components/library/MaterialList'
import { VideoGrid } from '@/components/library/VideoGrid'

const TAB_MATERIALS = 'materiais'
const TAB_VIDEOS = 'videoaulas'

export default function Library() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const tab = params.get('tab') === TAB_VIDEOS ? TAB_VIDEOS : TAB_MATERIALS
  const { data: materials, loading: materialsLoading } = useFetch<Material[]>(getMaterials)
  const { data: videos, loading: videosLoading } = useFetch<VideoItem[]>(getMemberVideos)
  const loading = materialsLoading || videosLoading

  const query = search.trim().toLowerCase()
  const materialGroups = useMemo(() => {
    const filtered = (materials ?? []).filter(
      (item) =>
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    )
    return groupByCategory(filtered, MATERIAL_CATEGORIES)
  }, [materials, query])

  const videoGroups = useMemo(() => {
    const filtered = (videos ?? []).filter(
      (item) =>
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    )
    return groupByCategory(filtered, VIDEO_CATEGORIES)
  }, [videos, query])

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="mb-2 font-display text-3xl font-bold">Biblioteca Digital</h1>
        <p className="text-muted-foreground">
          Material didático e videoaulas exclusivos para membros, organizados por categoria.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar partitura, método ou videoaula..."
          className="border-white/10 bg-card pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(next) => setParams(next === TAB_MATERIALS ? {} : { tab: next })}
          className="w-full"
        >
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value={TAB_MATERIALS} className="gap-2 py-2.5">
              <FileText className="h-4 w-4" />
              Material didático
            </TabsTrigger>
            <TabsTrigger value={TAB_VIDEOS} className="gap-2 py-2.5">
              <Video className="h-4 w-4" />
              Videoaulas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={TAB_MATERIALS} className="mt-6 space-y-8">
            {materialGroups.length === 0 ? (
              <EmptyLibrary text="Nenhum material didático encontrado." />
            ) : (
              materialGroups.map(({ category, items }) => (
                <section key={category}>
                  <h2 className="mb-4 text-lg font-semibold sm:text-xl">{category}</h2>
                  <MaterialList materials={items} />
                </section>
              ))
            )}
          </TabsContent>

          <TabsContent value={TAB_VIDEOS} className="mt-6 space-y-8">
            {videoGroups.length === 0 ? (
              <EmptyLibrary text="Nenhuma videoaula exclusiva encontrada." />
            ) : (
              videoGroups.map(({ category, items }) => (
                <section key={category}>
                  <h2 className="mb-4 text-lg font-semibold sm:text-xl">{category}</h2>
                  <VideoGrid videos={items} />
                </section>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function EmptyLibrary({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-card/20 py-16 text-center text-muted-foreground">
      <p>{text}</p>
    </div>
  )
}
