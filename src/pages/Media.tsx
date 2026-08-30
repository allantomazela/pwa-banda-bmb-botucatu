import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFetch } from '@/hooks/use-fetch'
import { getEventPhotos, getGalleryPhotos, type GalleryPhoto } from '@/services/gallery'
import { getPublicVideos, type VideoItem } from '@/services/videos'
import { getVideoThumbnail } from '@/lib/video-embed'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import { CmsSections } from '@/components/cms/CmsSections'
import { ImageIcon, Loader2, Play, Video } from 'lucide-react'

type SelectedMedia =
  | { kind: 'photo'; item: GalleryPhoto }
  | { kind: 'video'; item: VideoItem }
  | null

const VALID_TABS = new Set(['fotos', 'eventos', 'videos'])

export default function Media() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = VALID_TABS.has(searchParams.get('tab') || '')
    ? (searchParams.get('tab') as string)
    : 'fotos'
  const [tab, setTab] = useState(initialTab)
  const [selected, setSelected] = useState<SelectedMedia>(null)
  const { data: photos, loading: photosLoading, error: photosError } =
    useFetch<GalleryPhoto[]>(getGalleryPhotos)
  const { data: eventPhotos, loading: eventsLoading, error: eventsError } =
    useFetch<GalleryPhoto[]>(getEventPhotos)
  const { data: videos, loading: videosLoading, error: videosError } =
    useFetch<VideoItem[]>(getPublicVideos)

  useEffect(() => {
    const fromUrl = searchParams.get('tab')
    if (fromUrl && VALID_TABS.has(fromUrl) && fromUrl !== tab) {
      setTab(fromUrl)
    }
  }, [searchParams, tab])

  const handleTabChange = (value: string) => {
    setTab(value)
    setSearchParams(value === 'fotos' ? {} : { tab: value }, { replace: true })
  }

  const selectedTitle =
    selected?.kind === 'photo'
      ? selected.item.title || 'Foto da galeria'
      : selected?.kind === 'video'
        ? selected.item.title
        : 'Mídia'

  return (
    <div className="container animate-fade-in px-4 py-8 sm:py-12 lg:py-20">
      <div className="mb-8 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Galeria de <span className="text-primary">Mídia</span>
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Fotos, memórias de eventos e vídeos públicos das apresentações da Banda Marcial de
            Botucatu.
          </p>
        </div>
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3 md:w-[360px]">
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsContent value="fotos" className="mt-0">
          <PhotoGrid
            loading={photosLoading}
            error={photosError}
            photos={photos}
            emptyText="Nenhuma foto publicada no momento."
            onSelect={(item) => setSelected({ kind: 'photo', item })}
          />
        </TabsContent>

        <TabsContent value="eventos" className="mt-0">
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Espaço atualizado com registros fotográficos dos eventos já realizados. Novas fotos
            publicadas no admin (categoria <strong className="text-primary">Eventos</strong>)
            aparecem automaticamente aqui.
          </div>
          <PhotoGrid
            loading={eventsLoading}
            error={eventsError}
            photos={eventPhotos}
            emptyText="Ainda não há fotos de eventos. Em breve novas memórias aparecerão."
            onSelect={(item) => setSelected({ kind: 'photo', item })}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          {videosLoading ? (
            <LoadingState />
          ) : videosError ? (
            <p className="py-16 text-center text-muted-foreground">
              Não foi possível carregar os vídeos.
            </p>
          ) : !videos?.length ? (
            <EmptyState icon={Video} text="Nenhum vídeo público publicado no momento." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setSelected({ kind: 'video', item: video })}
                  className="group overflow-hidden rounded-xl border border-white/5 bg-card/50 text-left transition-colors hover:border-primary/30"
                >
                  <div className="relative aspect-video bg-black">
                    <img
                      src={getVideoThumbnail(
                        video.video_url,
                        'https://img.usecurling.com/p/800/450?q=marching%20band&color=blue',
                      )}
                      alt=""
                      className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/95 shadow-lg">
                        <Play className="ml-0.5 h-6 w-6 text-primary-foreground" fill="currentColor" />
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h2 className="line-clamp-2 font-semibold text-white">{video.title}</h2>
                    {video.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {video.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MediaLightbox
        open={!!selected}
        title={selectedTitle}
        imageUrl={selected?.kind === 'photo' ? selected.item.image_url : null}
        videoUrl={selected?.kind === 'video' ? selected.item.video_url : null}
        onClose={() => setSelected(null)}
      />

      <div className="mt-12 sm:mt-16">
        <CmsSections slug="media" />
      </div>
    </div>
  )
}

function PhotoGrid({
  loading,
  error,
  photos,
  emptyText,
  onSelect,
}: {
  loading: boolean
  error: string | null
  photos: GalleryPhoto[] | null
  emptyText: string
  onSelect: (photo: GalleryPhoto) => void
}) {
  if (loading) return <LoadingState />
  if (error) {
    return <p className="py-16 text-center text-muted-foreground">Não foi possível carregar as fotos.</p>
  }
  if (!photos?.length) return <EmptyState icon={ImageIcon} text={emptyText} />

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo)}
          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-card text-left transition-colors hover:border-primary/30"
        >
          <img
            src={photo.image_url}
            alt={photo.title || 'Foto da galeria'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <span className="line-clamp-1 text-sm font-medium text-white">
              {photo.title || 'Ampliar'}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof ImageIcon; text: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Icon className="mx-auto mb-4 h-12 w-12 opacity-20" />
      <p>{text}</p>
    </div>
  )
}
