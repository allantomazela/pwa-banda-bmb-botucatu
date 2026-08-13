import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { getGalleryPhotos, type GalleryPhoto } from '@/services/gallery'
import { ImageIcon, Loader2, Lock, Play } from 'lucide-react'

export default function Media() {
  const [activeTab, setActiveTab] = useState('fotos')
  const [selected, setSelected] = useState<GalleryPhoto | null>(null)
  const { data: photos, loading, error } = useFetch<GalleryPhoto[]>(getGalleryPhotos)

  return (
    <div className="container py-12 lg:py-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Galeria de <span className="text-primary">Mídia</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Reviva os melhores momentos de nossas apresentações e ensaios.
          </p>
        </div>

        <Tabs defaultValue="fotos" className="w-full md:w-auto" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="fotos" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Não foi possível carregar a galeria.</p>
            </div>
          ) : !photos || photos.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma foto publicada no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelected(photo)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-card border border-white/5 hover:border-primary/30 transition-colors text-left"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title || 'Foto da galeria Banda BMB'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {photo.title || 'Ampliar'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          <div className="max-w-xl mx-auto text-center py-16 px-6 rounded-xl border border-white/5 bg-card/40">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Vídeos exclusivos para membros</h2>
            <p className="text-muted-foreground mb-8">
              Ensaios, métodos e apresentações completas ficam disponíveis no portal do membro após
              o login.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/login">
                  <Play className="w-4 h-4 mr-2" />
                  Acessar portal
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/contato">Quero me juntar</Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-white/10">
          {selected && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle>{selected.title || 'Foto da galeria'}</DialogTitle>
              </DialogHeader>
              <img
                src={selected.image_url}
                alt={selected.title || 'Foto da galeria Banda BMB'}
                className="w-full max-h-[75vh] object-contain bg-black"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
