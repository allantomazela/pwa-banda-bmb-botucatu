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
import { cn } from '@/lib/utils'
import { Images, Loader2, Play, Sparkles, Video } from 'lucide-react'

type SelectedMedia =
  | { kind: 'photo'; list: GalleryPhoto[]; index: number }
  | { kind: 'video'; item: VideoItem }
  | null

const VALID_TABS = new Set(['fotos', 'eventos', 'videos'])

const TAB_META = [
  { value: 'fotos', label: 'Fotos', icon: Images },
  { value: 'eventos', label: 'Eventos', icon: Sparkles },
  { value: 'videos', label: 'Vídeos', icon: Video },
] as const

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

  const photoCount = photos?.length ?? 0
  const eventCount = eventPhotos?.length ?? 0
  const videoCount = videos?.length ?? 0

  return (
    <div className="gallery-moments-mesh relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />

      <section className="relative border-b border-white/5 py-10 sm:py-14 lg:py-16">
        <div className="container relative z-10 px-4">
          <header className="mx-auto max-w-2xl text-center">
            <div className="ornate-rule mx-auto mb-4 max-w-[14rem]">
              <span className="inline-flex items-center gap-1.5 font-crest text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                Acervo
              </span>
            </div>
            <h1 className="font-crest text-fluid-section font-bold leading-tight tracking-[0.06em] text-white">
              Galeria de
              <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
                mídia
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Fotos, memórias de eventos e vídeos da Banda Marcial de Botucatu — toque para
              ampliar e sentir cada instante.
            </p>
          </header>

          <Tabs value={tab} onValueChange={handleTabChange} className="mx-auto mt-8 max-w-xl">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-card/50 p-1.5 backdrop-blur-md">
              {TAB_META.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    'flex min-h-11 flex-col gap-0.5 rounded-xl px-2 py-2 text-xs data-[state=active]:text-primary sm:flex-row sm:gap-2 sm:text-sm',
                    'data-[state=active]:media-tab-active data-[state=active]:shadow-none',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <p className="mt-4 text-center font-crest text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {tab === 'fotos' && `${photoCount} foto${photoCount === 1 ? '' : 's'}`}
            {tab === 'eventos' && `${eventCount} memória${eventCount === 1 ? '' : 's'}`}
            {tab === 'videos' && `${videoCount} vídeo${videoCount === 1 ? '' : 's'}`}
          </p>
        </div>
      </section>

      <div className="container relative z-10 px-4 py-8 sm:py-10 lg:py-12">
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
            <div className="ornate-rule mx-auto max-w-md">
              <p className="px-2 text-center text-sm text-muted-foreground">
                Memórias dos eventos — categoria <span className="text-primary">Eventos</span>
              </p>
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
              <div className="rounded-3xl border border-dashed border-primary/25 bg-card/30 px-6 py-16 text-center">
                <Video className="mx-auto mb-4 h-10 w-10 text-primary/50" />
                <p className="font-display text-lg font-semibold text-white">
                  Nenhum vídeo público no momento
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-4 sm:gap-5">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setSelected({ kind: 'video', item: video })}
                    className="media-mosaic-tile group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <img
                        src={getVideoThumbnail(
                          video.video_url,
                          'https://img.usecurling.com/p/800/450?q=marching%20band&color=blue',
                        )}
                        alt=""
                        className="h-full w-full object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/95 text-primary-foreground shadow-glow transition-transform duration-300 group-hover:scale-110">
                          <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="font-crest text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">
                        Assistir
                      </p>
                      <h2 className="line-clamp-2 font-display font-semibold text-white">
                        {video.title}
                      </h2>
                      {video.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
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

        <div className="mt-12 sm:mt-16">
          <CmsSections slug="media" />
        </div>
      </div>

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
    </div>
  )
}
