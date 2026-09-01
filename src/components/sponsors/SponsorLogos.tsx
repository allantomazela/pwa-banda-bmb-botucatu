import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { getVisibleSponsors, type Sponsor } from '@/services/sponsors'
import { InviteCard, SponsorCard } from '@/components/sponsors/SponsorShowcaseCards'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 4200

type TrackItem =
  | { key: string; type: 'logo'; sponsor: Sponsor }
  | { key: string; type: 'invite' }

/** Todos os patrocinadores visíveis com logo entram no carrossel (nenhum fica de fora). */
function buildTrackItems(sponsors: Sponsor[]): TrackItem[] {
  const logos = sponsors.filter((item) => item.logo_url)
  const items: TrackItem[] = logos.map((sponsor) => ({
    key: sponsor.id,
    type: 'logo',
    sponsor,
  }))
  items.push({ key: 'invite-main', type: 'invite' })
  return items
}

function goToSponsorContactForm(pathname: string, navigate: ReturnType<typeof useNavigate>) {
  if (pathname === '/patrocinadores') {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (window.location.hash !== '#formulario') {
      navigate('/patrocinadores#formulario', { replace: true })
    }
    return
  }
  navigate('/patrocinadores#formulario')
}

type Props = {
  showCta?: boolean
}

export function SponsorLogos({ showCta = false }: Props) {
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const location = useLocation()
  const navigate = useNavigate()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [progressKey, setProgressKey] = useState(0)

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_MS,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [],
  )

  const trackItems = useMemo(() => buildTrackItems(sponsors ?? []), [sponsors])

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

  const openContact = () => goToSponsorContactForm(location.pathname, navigate)
  const total = trackItems.length
  const activeItem = trackItems[current]

  return (
    <section
      className="sponsors-moments-mesh relative z-20 overflow-hidden py-10 sm:py-14 lg:py-20"
      aria-labelledby="sponsors-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-16 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="container relative z-10 px-4">
        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div className="ornate-rule mx-auto mb-4 max-w-[16rem]">
            <span className="inline-flex items-center gap-1.5 font-crest text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              Parceiros
            </span>
          </div>
          <h2
            id="sponsors-heading"
            className="font-crest text-fluid-section font-bold leading-tight tracking-[0.06em] text-white"
          >
            Marcas que elevam
            <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
              a tradição
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Empresas e apoiadores que mantêm instrumentos afinados, viagens possíveis e o sonho
            musical vivo em Botucatu.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center gap-4 overflow-hidden py-6" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[17rem] w-full max-w-[280px] shrink-0 animate-shimmer rounded-3xl border border-white/10"
              />
            ))}
          </div>
        ) : (
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
                {trackItems.map((item, index) => {
                  const isActive = index === current
                  return (
                    <CarouselItem
                      key={item.key}
                      className="basis-[86%] pl-3 sm:basis-[70%] sm:pl-4 md:basis-[52%] lg:basis-[42%]"
                    >
                      <div
                        className={cn(
                          'h-full transition-[transform,opacity] duration-500 ease-out',
                          isActive ? 'z-10 scale-100 opacity-100' : 'scale-[0.92] opacity-50',
                        )}
                      >
                        {item.type === 'logo' ? (
                          <SponsorCard sponsor={item.sponsor} active={isActive} />
                        ) : (
                          <InviteCard onContact={openContact} active={isActive} />
                        )}
                      </div>
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
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {activeItem?.type === 'logo'
                        ? activeItem.sponsor.name
                        : 'Seja um patrocinador'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-11 w-11 rounded-full border border-primary/25 bg-card/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => api?.scrollPrev()}
                      aria-label="Patrocinador anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-11 w-11 rounded-full border border-primary/25 bg-card/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => api?.scrollNext()}
                      aria-label="Próximo patrocinador"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="mx-auto mt-10 max-w-xl text-center sm:mt-12">
          <div className="ornate-rule mx-auto mb-5 max-w-[12rem]">
            <span className="font-crest text-[10px] uppercase tracking-[0.28em] text-primary/80">
              Apoie
            </span>
          </div>
          <p className="font-display text-xl font-bold text-white sm:text-2xl">
            Sua marca no mesmo palco da BMB
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            Prestígio, visibilidade e impacto cultural — apoie a banda e ganhe destaque neste
            espaço.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-12 w-full px-8 shadow-glow sm:w-auto"
              onClick={openContact}
            >
              Quero ser patrocinador
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            {showCta ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full border-primary/40 px-7 text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
              >
                <Link to="/patrocinadores">Ver oportunidades</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
