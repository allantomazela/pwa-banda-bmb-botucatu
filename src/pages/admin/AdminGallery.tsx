import { GalleryManager } from '@/components/admin/GalleryManager'

export default function AdminGallery() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Galeria de Fotos</h1>
        <p className="text-muted-foreground">Gerencie fotos para banners e galeria do site.</p>
      </header>
      <GalleryManager />
    </div>
  )
}
