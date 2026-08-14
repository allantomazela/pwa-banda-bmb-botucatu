import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Autoplay from 'embla-carousel-autoplay'
import { Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useFetch } from '@/hooks/use-fetch'
import { getVisibleSponsors, toExternalUrl, type Sponsor } from '@/services/sponsors'
import {
  isLightColor,
  sponsorCardBackground,
  type SponsorBgType,
} from '@/lib/sponsor-style'

const KIND_LABELS = {
  patrocinador: 'Patrocinador',
  apoiador: 'Apoiador',
} as const

const MIN_SLIDES = 6

type Slide =
  | { key: string; kind: 'logo'; sponsor: Sponsor }
  | { key: string; kind: 'empty' }

function buildSlides(items: Sponsor[]): Slide[] {
  const logos = items.filter((item) => item.logo_url)
  const slides: Slide[] = logos.map((sponsor) => ({
    key: sponsor.id,
    kind: 'logo',
    sponsor,
  }))
  const missing = Math.max(0, MIN_SLIDES - slides.length)
  for (let i = 0; i < missing; i += 1) {
    slides.push({ key: `empty-${i}`, kind: 'empty' })
  }
  return slides
}

function LogoSlide({ sponsor }: { sponsor: Sponsor }) {
  const href = toExternalUrl(sponsor.website_url)
  const kindLabel = KIND_LABELS[sponsor.kind as keyof typeof KIND_LABELS] ?? 'Parceiro'
  const style = {
    bg_type: (sponsor.bg_type as SponsorBgType) || 'solid',
    bg_color: sponsor.bg_color || '#ffffff',
    bg_color_end: sponsor.bg_color_end || sponsor.bg_color || '#ffffff',
  }
  const light = isLightColor(style.bg_color)
  const content = (
    <div
      className="relative flex h-full min-h-[240px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl px-6 py-8 ring-2 ring-primary/50 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.03]"
      style={{ background: sponsorCardBackground(style) }}
    >
      <span
        className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          light ? 'bg-slate-900/80 text-white' : 'bg-primary text-primary-foreground'
        }`}
      >
        {kindLabel}
      </span>
      <img
        src={sponsor.logo_url}
        alt={sponsor.name}
        className="max-h-32 w-auto max-w-[240px] object-contain drop-shadow-lg md:max-h-36 md:max-w-[280px]"
        loading="lazy"
      />
      <p
        className={`text-center text-sm font-semibold ${light ? 'text-slate-800' : 'text-white'}`}
      >
        {sponsor.name}
      </p>
    </div>
  )

  if (!href) return content

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full" title={sponsor.name}>
      {content}
    </a>
  )
}

function EmptySlide() {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-white/5 px-5 py-6">
      <span className="text-3xl font-display text-primary/50">+</span>
      <p className="text-center text-xs font-medium text-muted-foreground">Sua marca aqui</p>
    </div>
  )
}

type Props = {
  showCta?: boolean
}

export function SponsorLogos({ showCta = false }: Props) {
  const autoplay = useRef(Autoplay({ delay: 3200, stopOnInteraction: true }))
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const slides = buildSlides(sponsors ?? [])

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(42,96%,58%,0.16),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="container relative z-10 space-y-10">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Handshake className="h-4 w-4" />
            Quem apoia a BMB
          </p>
          <h2 className="text-3xl font-display font-bold md:text-5xl">
            Patrocinadores e Apoiadores
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Marcas que fortalecem a banda com apoio ao caixa. Todas juntas, no mesmo palco.
          </p>
        </div>

        <div className="rounded-3xl border border-primary/30 bg-card/70 p-4 shadow-[0_0_80px_hsla(42,96%,58%,0.12)] backdrop-blur-sm md:p-8">
          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Carregando marcas...</p>
          ) : (
            <Carousel
              opts={{ align: 'start', loop: true }}
              plugins={[autoplay.current]}
              className="w-full"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {slides.map((slide) => (
                  <CarouselItem
                    key={slide.key}
                    className="group basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-[38%]"
                  >
                    {slide.kind === 'logo' ? <LogoSlide sponsor={slide.sponsor} /> : <EmptySlide />}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-1 border-primary/40 bg-background/90 text-primary hover:bg-primary hover:text-primary-foreground md:left-2" />
              <CarouselNext className="right-1 border-primary/40 bg-background/90 text-primary hover:bg-primary hover:text-primary-foreground md:right-2" />
            </Carousel>
          )}
        </div>

        {showCta ? (
          <div className="flex justify-center">
            <Button asChild size="lg" className="h-12 px-8 shadow-glow">
              <Link to="/patrocinadores">Quero patrocinar a banda</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
