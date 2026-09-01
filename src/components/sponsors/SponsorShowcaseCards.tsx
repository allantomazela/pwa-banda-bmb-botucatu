import { ArrowRight, Handshake } from 'lucide-react'
import { toExternalUrl, type Sponsor } from '@/services/sponsors'
import {
  isLightColor,
  sponsorCardBackground,
  sponsorTierMeta,
  type SponsorBgType,
} from '@/lib/sponsor-style'
import { cn } from '@/lib/utils'

export function SponsorCard({
  sponsor,
  active,
}: {
  sponsor: Sponsor
  active: boolean
}) {
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
        'sponsor-card-glow relative flex h-full min-h-[17rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border px-5 py-7 sm:min-h-[19rem] sm:rounded-3xl sm:px-7 sm:py-9',
        active ? 'sponsor-stage-glow border-primary/40' : 'border-white/10',
        hasCustomBg
          ? 'shadow-[0_16px_48px_rgba(0,0,0,0.35)]'
          : 'bg-zinc-950/80 shadow-[0_16px_48px_rgba(0,0,0,0.3)] backdrop-blur-xl',
      )}
      style={hasCustomBg ? { background: sponsorCardBackground(style) } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,192,45,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      <p
        className={cn(
          'relative z-10 font-crest text-[10px] font-semibold uppercase tracking-[0.28em]',
          light ? 'text-amber-800' : 'text-primary',
        )}
      >
        {tier.badge}
      </p>

      <img
        src={sponsor.logo_url}
        alt={`Logo ${sponsor.name}`}
        className={cn(
          'relative z-10 max-h-[7.5rem] w-auto max-w-[85%] object-contain drop-shadow-2xl sm:max-h-[8.5rem]',
          active && 'sponsor-logo-float',
        )}
        loading="lazy"
        decoding="async"
        draggable={false}
      />

      {active ? (
        <div key={sponsor.id} className="sponsor-caption-in relative z-10 space-y-1 text-center">
          <p
            className={cn(
              'line-clamp-2 font-display text-base font-bold leading-snug sm:text-lg',
              light ? 'text-slate-900' : 'text-white',
            )}
          >
            {sponsor.name}
          </p>
          {href ? (
            <p className={cn('text-xs', light ? 'text-slate-600' : 'text-white/65')}>
              Toque para visitar o site
            </p>
          ) : null}
        </div>
      ) : (
        <p
          className={cn(
            'relative z-10 line-clamp-2 text-center text-sm font-semibold',
            light ? 'text-slate-800' : 'text-white/80',
          )}
        >
          {sponsor.name}
        </p>
      )}
    </article>
  )

  if (!href) return card

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-3xl"
      title={`Visitar site de ${sponsor.name}`}
    >
      {card}
    </a>
  )
}

export function InviteCard({
  onContact,
  active,
}: {
  onContact: () => void
  active: boolean
}) {
  return (
    <button
      type="button"
      onClick={onContact}
      className="block h-full w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-3xl"
      aria-label="Quero ser patrocinador e entrar em contato"
    >
      <article
        className={cn(
          'sponsor-card-glow sponsor-invite-border relative flex h-full min-h-[17rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-zinc-950/85 px-5 py-7 backdrop-blur-xl sm:min-h-[19rem] sm:rounded-3xl sm:px-7 sm:py-9',
          active && 'sponsor-stage-glow',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,192,45,0.28),transparent_60%)]" />
        <span
          className={cn(
            'relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow',
            active && 'sponsor-logo-float',
          )}
        >
          <Handshake className="h-6 w-6" aria-hidden />
        </span>
        {active ? (
          <div className="sponsor-caption-in relative z-10 space-y-2 text-center">
            <p className="font-crest text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Faça parte
            </p>
            <p className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
              Seja um patrocinador
            </p>
            <p className="mx-auto max-w-[220px] text-sm text-muted-foreground">
              Sua marca no palco da tradição musical de Botucatu
            </p>
            <span className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Entrar em contato
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        ) : (
          <p className="relative z-10 text-center font-display text-lg font-bold text-primary">
            Seja um patrocinador
          </p>
        )}
      </article>
    </button>
  )
}
