import { Link } from 'react-router-dom'
import { ArrowRight, Handshake, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { getVisibleSponsors, toExternalUrl, type Sponsor } from '@/services/sponsors'
import {
  isLightColor,
  sponsorCardBackground,
  sponsorTierMeta,
  SPONSOR_TIERS,
  type SponsorBgType,
} from '@/lib/sponsor-style'
import { cn } from '@/lib/utils'

const MIN_TRACK_ITEMS = 6

const TIER_BADGE_CLASS: Record<string, string> = {
  master:
    'border border-amber-300/70 bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-900 shadow-[0_0_24px_rgba(251,192,45,0.55)]',
  ouro: 'border border-primary/50 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(251,192,45,0.35)]',
  prata: 'border border-slate-300/40 bg-slate-200/90 text-slate-900',
  bronze: 'border border-orange-400/40 bg-orange-700/80 text-orange-50',
  apoiador: 'border border-sky-300/30 bg-sky-500/20 text-sky-100',
}

const TIER_CARD_CLASS: Record<string, string> = {
  master: 'ring-2 ring-amber-300/50 sm:h-[260px] sm:w-[300px]',
  ouro: 'ring-1 ring-primary/35',
  prata: 'ring-1 ring-slate-300/20',
  bronze: 'ring-1 ring-orange-500/25',
  apoiador: '',
}

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

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const href = toExternalUrl(sponsor.website_url)
  const tier = sponsorTierMeta(sponsor.tier)
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
        'sponsor-card-glow group relative flex h-[220px] w-[260px] shrink-0 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/10 px-6 py-7 sm:h-[240px] sm:w-[280px]',
        hasCustomBg
          ? 'shadow-[0_12px_40px_rgba(0,0,0,0.3)]'
          : 'bg-zinc-900/60 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl',
        TIER_CARD_CLASS[tier.value],
      )}
      style={hasCustomBg ? { background: sponsorCardBackground(style) } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
      <span
        className={cn(
          'absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]',
          light && tier.value !== 'master' && tier.value !== 'ouro'
            ? 'bg-slate-900/85 text-white'
            : TIER_BADGE_CLASS[tier.value],
        )}
      >
        {tier.badge}
      </span>
      <img
        src={sponsor.logo_url}
        alt={`Logo ${sponsor.name}`}
        className={cn(
          'relative z-10 w-auto object-contain transition-[filter] duration-300',
          tier.value === 'master'
            ? 'max-h-[112px] max-w-[220px] sm:max-h-[128px] sm:max-w-[240px]'
            : 'max-h-[100px] max-w-[200px] sm:max-h-[112px] sm:max-w-[220px]',
        )}
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
      className="block shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
      title={`Visitar site de ${sponsor.name}`}
    >
      {card}
    </a>
  )
}

function InviteCard() {
  return (
    <Link
      to="/patrocinadores#formulario"
      className="block shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <article className="sponsor-card-glow sponsor-invite-border group relative flex h-[220px] w-[260px] shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-zinc-900/50 px-6 py-7 backdrop-blur-xl sm:h-[240px] sm:w-[280px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,192,45,0.18),transparent_60%)]" />
        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-300 group-hover:scale-110">
          <Handshake className="h-5 w-5" aria-hidden />
        </span>
        <p className="relative z-10 text-center font-display text-base font-bold leading-snug text-primary sm:text-lg">
          Seja um patrocinador
        </p>
        <p className="relative z-10 max-w-[200px] text-center text-xs text-muted-foreground sm:text-sm">
          Coloque sua marca no palco da tradição musical de Botucatu
        </p>
        <span className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary transition-transform duration-300 group-hover:translate-x-1">
          Quero apoiar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </article>
    </Link>
  )
}

type Props = {
  showCta?: boolean
}

export function SponsorLogos({ showCta = false }: Props) {
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const trackItems = buildTrackItems(sponsors ?? [])
  const durationSec = Math.max(28, trackItems.length * 7)

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="sponsors-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(42,96%,58%,0.12),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative z-10 space-y-12">
        <header className="mx-auto max-w-3xl space-y-5 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Nossos parceiros &amp; patrocinadores
          </p>
          <h2
            id="sponsors-heading"
            className="text-balance font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl"
          >
            Marcas que impulsionam a tradição e a música de Botucatu
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Empresas e parceiros essenciais que mantêm nossos instrumentos afinados, viagens
            possíveis e o sonho musical vivo.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {SPONSOR_TIERS.map((tier) => (
              <li
                key={tier.value}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
                  TIER_BADGE_CLASS[tier.value],
                )}
              >
                {tier.label}
              </li>
            ))}
          </ul>
        </header>

        {loading ? (
          <div className="flex justify-center gap-4 overflow-hidden py-8" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] w-[260px] shrink-0 animate-shimmer rounded-2xl border border-white/10 sm:h-[240px] sm:w-[280px]"
              />
            ))}
          </div>
        ) : (
          <div className="sponsor-marquee-mask relative -mx-4 sm:mx-0">
            <div
              className="sponsor-marquee-track flex w-max gap-5 py-4 pl-4 sm:gap-6"
              style={{ ['--sponsor-marquee-duration' as string]: `${durationSec}s` }}
              role="list"
              aria-label="Carrossel de patrocinadores e apoiadores"
            >
              {[0, 1].map((copy) =>
                trackItems.map((item) => (
                  <div key={`${copy}-${item.key}`} role="listitem" className="shrink-0">
                    {item.type === 'logo' ? (
                      <SponsorCard sponsor={item.sponsor} />
                    ) : (
                      <InviteCard />
                    )}
                  </div>
                )),
              )}
            </div>
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
                Escolha o nível Master, Ouro, Prata, Bronze ou Apoiador Cultural e ganhe destaque
                premium neste espaço — visibilidade, prestígio e impacto cultural em Botucatu.
              </p>
              <Button asChild size="lg" className="h-12 px-8 shadow-glow transition-transform hover:scale-[1.03]">
                <Link to="/patrocinadores#formulario">
                  Quero ser patrocinador
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {showCta ? (
          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg" className="h-11 border-primary/40 px-7 text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/patrocinadores">Conhecer oportunidades de patrocínio</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
