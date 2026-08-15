import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaterialsManager } from '@/components/admin/MaterialsManager'
import { VideosManager } from '@/components/admin/VideosManager'
import { FileText, Video } from 'lucide-react'

const TAB_MATERIALS = 'materiais'
const TAB_VIDEOS = 'videoaulas'

export default function AdminLibrary() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === TAB_VIDEOS ? TAB_VIDEOS : TAB_MATERIALS

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="mb-2 font-display text-3xl font-bold">Biblioteca Digital</h1>
        <p className="text-muted-foreground">
          Organize o acervo dos membros: material didático e videoaulas. Vídeos marcados como
          públicos também aparecem na galeria do site.
        </p>
      </header>

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
        <TabsContent value={TAB_MATERIALS} className="mt-6">
          <MaterialsManager />
        </TabsContent>
        <TabsContent value={TAB_VIDEOS} className="mt-6">
          <VideosManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
