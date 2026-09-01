import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, ChevronLeft, ChevronRight, Handshake, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useFetch } from '@/hooks/use-fetch'
import { getVisibleSponsors, toExternalUrl, type Sponsor } from '@/services/sponsors'
import {
  isLightColor,
  sponsorCardBackground,
  type SponsorBgType,
} from '@/lib/sponsor-style'
import { cn } from '@/lib/utils'

const MIN_TRACK_ITEMS = 4

type TrackItem =
  | { key: string; type: 'logo'; sponsor: Sponsor }
  | { key: string; type: 'invite' }

function buildTrackItems(sponsors: Sponsor[]): TrackItem[] {
  const logos = sponsors.filter((item) => item.logo_url)
  const items: TrackItem[] = logos.map((sponsor) => ({
    key: sponsor.id,
    type: 'logo',
    sponsor,
  }))
  items.push({ key: 'invite-main', type: 'invite' })
  let inviteIndex = 1
  while (items.length < MIN_TRACK_ITEMS) {
    items.push({ key: `invite-fill-${inviteIndex}`, type: 'invite' })
    inviteIndex += 1
  }
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

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const href = toExternalUrl(sponsor.website_url)
  const style = {
    bg_type: (sponsor.bg_type as SponsorBgType) || 'solid',
    bg_color: sponsor.bg_color || '#ffffff',
    bg_color_end: sponsor.bg_color_end || sponsor.bg_color || '#ffffff',
  }
  const light = isLightColor(style.bg_color)
  const hasCustomBg =
    style.bg_color.toLowerCase() !== '#ffffff' || style.bg_type === 'gradient'

  const card = (
    <article
      className={cn(
        /* min-h fluido: evita cards rígidos em telas baixas */
        'sponsor-card-glow group relative flex min-h-[11.5rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/10 px-4 py-6 sm:min-h-[230px] sm:px-6 sm:py-8',
        hasCustomBg
          ? 'shadow-[0_16px_48px_rgba(0,0,0,0.35)]'
          : 'bg-zinc-900/70 shadow-[0_16px_48px_rgba(0,0,0,0.3)] backdrop-blur-xl',
      )}
      style={hasCustomBg ? { background: sponsorCardBackground(style) } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,192,45,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <img
        src={sponsor.logo_url}
        alt={`Logo ${sponsor.name}`}
        className="relative z-10 max-h-[120px] w-auto max-w-[220px] object-contain drop-shadow-lg transition-[filter,transform] duration-300 group-hover:scale-[1.04]"
        loading="lazy"
        decoding="async"
      />
      <p
        className={cn(
          'relative z-10 line-clamp-2 text-center text-sm font-semibold tracking-tight',
          light ? 'text-slate-800' : 'text-white/90',
        )}
      >
        {sponsor.name}
      </p>
    </article>
  )

  if (!href) return card

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      title={`Visitar site de ${sponsor.name}`}
    >
      {card}
    </a>
  )
}

function InviteCard({ onContact }: { onContact: () => void }) {
  return (
    <button
      type="button"
      onClick={onContact}
      className="block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Quero ser patrocinador e entrar em contato"
    >
      <article className="sponsor-card-glow sponsor-invite-border group relative flex min-h-[11.5rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-zinc-900/55 px-4 py-6 backdrop-blur-xl sm:min-h-[230px] sm:px-6 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,192,45,0.2),transparent_60%)]" />
        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-300 group-hover:scale-110">
          <Handshake className="h-5 w-5" aria-hidden />
        </span>
        <p className="relative z-10 text-center font-display text-lg font-bold leading-snug text-primary">
          Seja um patrocinador
        </p>
        <p className="relative z-10 max-w-[210px] text-center text-sm text-muted-foreground">
          Sua marca no palco da tradição musical de Botucatu
        </p>
        <span className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary transition-transform duration-300 group-hover:translate-x-1">
          Entrar em contato
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </article>
    </button>
  )
}

function CarouselNav({ api }: { api: CarouselApi | undefined }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border-primary/40 bg-background/80 text-primary hover:bg-primary hover:text-primary-foreground"
        onClick={() => api?.scrollPrev()}
        aria-label="Patrocinador anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border-primary/40 bg-background/80 text-primary hover:bg-primary hover:text-primary-foreground"
        onClick={() => api?.scrollNext()}
        aria-label="Próximo patrocinador"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

type Props = {
  showCta?: boolean
}

export function SponsorLogos({ showCta = false }: Props) {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }))
  const [api, setApi] = useState<CarouselApi>()
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const location = useLocation()
  const navigate = useNavigate()
  const trackItems = buildTrackItems(sponsors ?? [])

  const openContact = () => goToSponsorContactForm(location.pathname, navigate)

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="sponsors-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(42,96%,58%,0.14),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative z-10 space-y-10">
        <header className="mx-auto max-w-3xl space-y-5 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Nossos parceiros &amp; patrocinadores
          </p>
          <h2
            id="sponsors-heading"
            className="text-balance text-fluid-section font-display font-bold leading-tight tracking-tight"
          >
            Marcas que impulsionam a tradição e a música de Botucatu
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Empresas e parceiros essenciais que mantêm nossos instrumentos afinados, viagens
            possíveis e o sonho musical vivo.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center gap-4 overflow-hidden py-8" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[230px] w-full max-w-[280px] shrink-0 animate-shimmer rounded-2xl border border-white/10"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="sponsor-marquee-mask relative rounded-3xl border border-primary/20 bg-card/40 p-3 shadow-[0_0_80px_hsla(42,96%,58%,0.1)] backdrop-blur-sm md:p-6">
              <Carousel
                setApi={setApi}
                opts={{ align: 'start', loop: true }}
                plugins={[autoplay.current]}
                className="w-full"
              >
                <CarouselContent className="-ml-3 md:-ml-4">
                  {trackItems.map((item) => (
                    <CarouselItem
                      key={item.key}
                      className="basis-[85%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3"
                    >
                      {item.type === 'logo' ? (
                        <SponsorCard sponsor={item.sponsor} />
                      ) : (
                        <InviteCard onContact={openContact} />
                      )}
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <CarouselNav api={api} />
          </div>
        )}

        <div className="mx-auto max-w-2xl">
          <div className="sponsor-invite-border relative overflow-hidden rounded-2xl bg-zinc-900/40 p-6 text-center backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,192,45,0.12),transparent_50%)]" />
            <div className="relative z-10 space-y-4">
              <p className="font-display text-xl font-bold text-white sm:text-2xl">
                Sua marca no mesmo palco da BMB
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                Apoie a banda com doação ao caixa e ganhe destaque neste espaço — prestígio,
                visibilidade e impacto cultural em Botucatu.
              </p>
              <Button
                type="button"
                size="lg"
                className="h-12 px-8 shadow-glow transition-transform hover:scale-[1.03]"
                onClick={openContact}
              >
                Quero ser patrocinador
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>

        {showCta ? (
          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 border-primary/40 px-7 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/patrocinadores">Conhecer oportunidades de patrocínio</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
