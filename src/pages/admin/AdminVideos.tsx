import { VideosManager } from '@/components/admin/VideosManager'

export default function AdminVideos() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Gestão de Vídeos</h1>
        <p className="text-muted-foreground">
          Publique vídeos na galeria pública do site ou marque como exclusivos para o portal dos
          membros.
        </p>
      </header>
      <VideosManager />
    </div>
  )
}
