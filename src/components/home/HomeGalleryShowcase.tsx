import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { getShowcasePhotos, type GalleryPhoto } from '@/services/gallery'
import { cn } from '@/lib/utils'

const INTERVAL_MS = 5000

export function HomeGalleryShowcase() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const { data: photos, loading } = useFetch<GalleryPhoto[]>(getShowcasePhotos)
  const total = photos?.length ?? 0

  useEffect(() => {
    if (!total || paused) return
    const id = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % total)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [total, paused])

  useEffect(() => {
    if (current >= total && total > 0) setCurrent(0)
  }, [current, total])

  if (loading || !photos?.length) return null

  const active = photos[current] ?? photos[0]

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((prev) => (prev + 1) % photos.length)
  }

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
              Ensaios, desfiles e apresentações — toque no destaque para ver toda a galeria.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/media">
              Ver galeria completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Link
          to="/media"
          className="group relative block overflow-hidden rounded-3xl border border-primary/25 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.45)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-label="Abrir galeria completa de mídia"
        >
          <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top,hsla(42,96%,58%,0.12),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[2/1]">
            {photos.map((photo, index) => (
              <img
                key={photo.id}
                src={photo.image_url}
                alt={photo.title || 'Foto da Banda Marcial'}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out',
                  index === current ? 'opacity-100' : 'opacity-0',
                )}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                  <Images className="h-3.5 w-3.5" />
                  {current + 1} / {photos.length}
                </span>
                <p className="line-clamp-2 max-w-xl font-display text-lg font-bold text-white drop-shadow sm:text-2xl">
                  {active?.title || 'Banda Marcial de Botucatu'}
                </p>
                <p className="mt-1 text-xs text-primary/90 sm:text-sm">
                  Clique para ver todas as fotos →
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full border border-white/15 bg-black/45 text-white backdrop-blur hover:bg-primary hover:text-primary-foreground"
                  onClick={goPrev}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full border border-white/15 bg-black/45 text-white backdrop-blur hover:bg-primary hover:text-primary-foreground"
                  onClick={goNext}
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`Ir para foto ${index + 1}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrent(index)
                  }}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index === current
                      ? 'w-8 bg-primary'
                      : 'w-1.5 bg-white/35 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
