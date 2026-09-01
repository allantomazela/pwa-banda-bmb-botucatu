import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useFetch } from '@/hooks/use-fetch'
import { getShowcasePhotos, type GalleryPhoto } from '@/services/gallery'
import { cn } from '@/lib/utils'

export function HomeGalleryShowcase() {
  const { data: photos, loading } = useFetch<GalleryPhoto[]>(getShowcasePhotos)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setCurrent(carouselApi.selectedScrollSnap())
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

  if (loading || !photos?.length) return null

  const active = photos[current] ?? photos[0]
  const total = photos.length

  return (
    <section className="relative z-20 -mt-4 pb-2 lg:-mt-8">
      <div className="container px-4">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Momentos da banda
            </p>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              A força da marcha em imagem
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Deslize as fotos — toque na imagem para abrir a galeria completa.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/media">
              Ver galeria completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:rounded-3xl">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'center',
              loop: true,
              dragFree: false,
              containScroll: false,
            }}
            plugins={[
              Autoplay({
                delay: 4500,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-3">
              {photos.map((photo, index) => (
                <CarouselItem
                  key={photo.id}
                  className="basis-[88%] pl-2 sm:basis-[85%] sm:pl-3 md:basis-[70%] lg:basis-[62%]"
                >
                  <Link
                    to="/media"
                    className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-2xl"
                    aria-label={`Abrir galeria — ${photo.title || 'foto da banda'}`}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900 sm:aspect-[16/10] lg:aspect-[2/1]">
                      <img
                        src={photo.image_url}
                        alt={photo.title || 'Foto da Banda Marcial'}
                        className={cn(
                          'h-full w-full object-cover object-center transition-transform duration-500 ease-out',
                          index === current ? 'scale-100' : 'scale-[1.03]',
                          'group-active:scale-[1.01]',
                        )}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                      />
                      <div
                        className={cn(
                          'pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-300',
                          index === current ? 'opacity-100' : 'opacity-70',
                        )}
                      />
                      {index === current ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <p className="line-clamp-2 font-display text-base font-bold text-white drop-shadow sm:text-xl">
                            {photo.title || 'Banda Marcial de Botucatu'}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {total > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <p className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  <span className="text-primary">{current + 1}</span>
                  <span className="mx-1 text-white/30">/</span>
                  {total}
                </p>
                <div className="hidden h-1 max-w-[10rem] flex-1 overflow-hidden rounded-full bg-white/10 sm:block">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${((current + 1) / total) * 100}%` }}
                  />
                </div>
                <p className="truncate text-xs text-muted-foreground sm:hidden">
                  {active?.title || 'Deslize'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-primary hover:text-primary-foreground"
                  onClick={() => api?.scrollPrev()}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-primary hover:text-primary-foreground"
                  onClick={() => api?.scrollNext()}
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
