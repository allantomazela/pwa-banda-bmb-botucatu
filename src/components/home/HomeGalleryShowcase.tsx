import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useFetch } from '@/hooks/use-fetch'
import { getShowcasePhotos, MAX_HOME_SHOWCASE, type GalleryPhoto } from '@/services/gallery'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 4500

export function HomeGalleryShowcase() {
  const { data: rawPhotos, loading } = useFetch<GalleryPhoto[]>(getShowcasePhotos)
  const photos = (rawPhotos ?? []).slice(0, MAX_HOME_SHOWCASE)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [progressKey, setProgressKey] = useState(0)

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_MS,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    [],
  )

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setCurrent(carouselApi.selectedScrollSnap())
    setProgressKey((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  if (loading || photos.length === 0) return null

  const active = photos[current] ?? photos[0]
  const total = photos.length

  return (
    <section className="gallery-moments-mesh relative z-20 overflow-hidden py-8 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="container relative px-4">
        <header className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
          <div className="ornate-rule mx-auto mb-4 max-w-[14rem]">
            <span className="inline-flex items-center gap-1.5 font-crest text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              Momentos
            </span>
          </div>
          <h2 className="font-crest text-fluid-section font-bold leading-tight tracking-[0.06em] text-white">
            A força da marcha
            <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
              em imagem
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ensaios, desfiles e apresentações — a emoção da Banda Marcial de Botucatu em cada
            quadro.
          </p>
        </header>

        <div className="relative mx-auto max-w-5xl">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'center',
              loop: true,
              dragFree: false,
              containScroll: false,
            }}
            plugins={[autoplay]}
            className="w-full"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {photos.map((photo, index) => {
                const isActive = index === current
                return (
                  <CarouselItem
                    key={photo.id}
                    className="basis-[86%] pl-3 sm:basis-[78%] sm:pl-4 md:basis-[68%] lg:basis-[58%]"
                  >
                    <Link
                      to="/media"
                      className={cn(
                        'group relative block overflow-hidden rounded-2xl transition-[transform,opacity,box-shadow] duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-3xl',
                        isActive
                          ? 'gallery-frame-glow z-10 scale-100 opacity-100'
                          : 'scale-[0.94] opacity-55 shadow-none',
                      )}
                      aria-label={`Abrir galeria — ${photo.title || 'foto da banda'}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950 sm:aspect-[4/5] md:aspect-[16/11]">
                        <img
                          src={photo.image_url}
                          alt={photo.title || 'Foto da Banda Marcial'}
                          className={cn(
                            'h-full w-full object-cover object-center',
                            isActive && 'gallery-ken-burns',
                          )}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          draggable={false}
                        />

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                        {isActive ? (
                          <div
                            key={`caption-${photo.id}-${progressKey}`}
                            className="gallery-caption-in pointer-events-none absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-6"
                          >
                            <p className="font-crest text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
                              Banda Marcial · Botucatu
                            </p>
                            <p className="line-clamp-2 font-display text-lg font-bold leading-snug text-white drop-shadow-md sm:text-2xl">
                              {photo.title || 'Tradição, disciplina e honra'}
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-white/70">
                              Toque para ver a galeria
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>

          {total > 1 ? (
            <div className="mt-5 flex flex-col gap-4 sm:mt-6">
              <div className="gallery-progress-track mx-auto h-1 w-full max-w-xs sm:max-w-sm">
                <div
                  key={progressKey}
                  className="gallery-progress-fill h-full"
                  style={{
                    animation: `gallery-progress-grow ${AUTOPLAY_MS}ms linear forwards`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="font-crest text-[10px] uppercase tracking-[0.24em] text-primary/80">
                    <span className="text-primary">{String(current + 1).padStart(2, '0')}</span>
                    <span className="mx-1.5 text-white/25">·</span>
                    {String(total).padStart(2, '0')}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground sm:hidden">
                    {active?.title || 'Deslize para sentir'}
                  </p>
                  <p className="gallery-swipe-hint mt-1 hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                    Deslize ou use as setas
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-11 w-11 rounded-full border border-primary/25 bg-card/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => api?.scrollPrev()}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-11 w-11 rounded-full border border-primary/25 bg-card/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => api?.scrollNext()}
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-center sm:mt-8">
            <Button
              asChild
              variant="outline"
              className="border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/media">
                Ver galeria completa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
