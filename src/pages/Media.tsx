import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFetch } from '@/hooks/use-fetch'
import { getEventPhotos, getGalleryPhotos, type GalleryPhoto } from '@/services/gallery'
import { getPublicVideos, type VideoItem } from '@/services/videos'
import { getVideoThumbnail } from '@/lib/video-embed'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import { PhotoMasonryGrid } from '@/components/media/PhotoMasonryGrid'
import { CmsSections } from '@/components/cms/CmsSections'
import { Loader2, Play, Video } from 'lucide-react'

type SelectedMedia =
  | { kind: 'photo'; list: GalleryPhoto[]; index: number }
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
    if (fromUrl && VALID_TABS.has(fromUrl) && fromUrl !== tab) setTab(fromUrl)
  }, [searchParams, tab])

  useEffect(() => {
    if (selected?.kind !== 'photo') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelected((prev) =>
          prev?.kind === 'photo'
            ? {
                ...prev,
                index: (prev.index - 1 + prev.list.length) % prev.list.length,
              }
            : prev,
        )
      }
      if (e.key === 'ArrowRight') {
        setSelected((prev) =>
          prev?.kind === 'photo'
            ? { ...prev, index: (prev.index + 1) % prev.list.length }
            : prev,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected?.kind])

  const handleTabChange = (value: string) => {
    setTab(value)
    setSearchParams(value === 'fotos' ? {} : { tab: value }, { replace: true })
  }

  const activePhoto = useMemo(() => {
    if (selected?.kind !== 'photo') return null
    return selected.list[selected.index] ?? null
  }, [selected])

  const lightboxTitle =
    selected?.kind === 'photo'
      ? activePhoto?.title || 'Foto da galeria'
      : selected?.kind === 'video'
        ? selected.item.title
        : 'Mídia'

  return (
    <div className="container animate-fade-in px-4 py-8 sm:py-12 lg:py-20">
      <div className="mb-8 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-fluid-section mb-3 font-bold">
            Galeria de <span className="text-primary">Mídia</span>
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Explore as fotos e vídeos da Banda Marcial de Botucatu em um mosaico visual — toque para
            ampliar e navegue com as setas.
          </p>
        </div>
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList className="grid h-auto min-h-11 w-full grid-cols-3 md:w-[min(100%,22.5rem)]">
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsContent value="fotos" className="mt-0">
          <PhotoMasonryGrid
            loading={photosLoading}
            error={photosError}
            photos={photos}
            emptyText="Nenhuma foto publicada no momento."
            onSelect={(_photo, index) =>
              setSelected({ kind: 'photo', list: photos ?? [], index })
            }
          />
        </TabsContent>

        <TabsContent value="eventos" className="mt-0 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Memórias dos eventos realizados. Novas fotos com categoria{' '}
            <strong className="text-primary">Eventos</strong> aparecem automaticamente.
          </div>
          <PhotoMasonryGrid
            loading={eventsLoading}
            error={eventsError}
            photos={eventPhotos}
            emptyText="Ainda não há fotos de eventos. Em breve novas memórias aparecerão."
            onSelect={(_photo, index) =>
              setSelected({ kind: 'photo', list: eventPhotos ?? [], index })
            }
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          {videosLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videosError ? (
            <p className="py-16 text-center text-muted-foreground">
              Não foi possível carregar os vídeos.
            </p>
          ) : !videos?.length ? (
            <div className="py-16 text-center text-muted-foreground">
              <Video className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>Nenhum vídeo público publicado no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-4">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setSelected({ kind: 'video', item: video })}
                  className="group overflow-hidden rounded-2xl border border-white/5 bg-card/50 text-left transition-colors hover:border-primary/30"
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
        title={lightboxTitle}
        imageUrl={selected?.kind === 'photo' ? activePhoto?.image_url : null}
        videoUrl={selected?.kind === 'video' ? selected.item.video_url : null}
        counter={
          selected?.kind === 'photo'
            ? `${selected.index + 1} / ${selected.list.length}`
            : undefined
        }
        onPrev={
          selected?.kind === 'photo'
            ? () =>
                setSelected((prev) =>
                  prev?.kind === 'photo'
                    ? {
                        ...prev,
                        index: (prev.index - 1 + prev.list.length) % prev.list.length,
                      }
                    : prev,
                )
            : undefined
        }
        onNext={
          selected?.kind === 'photo'
            ? () =>
                setSelected((prev) =>
                  prev?.kind === 'photo'
                    ? { ...prev, index: (prev.index + 1) % prev.list.length }
                    : prev,
                )
            : undefined
        }
        onClose={() => setSelected(null)}
      />

      <div className="mt-12 sm:mt-16">
        <CmsSections slug="media" />
      </div>
    </div>
  )
}
