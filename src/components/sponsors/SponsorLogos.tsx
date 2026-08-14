import { Link } from 'react-router-dom'
import { Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { getVisibleSponsors, toExternalUrl, type Sponsor, type SponsorKind } from '@/services/sponsors'

const KIND_LABELS: Record<SponsorKind, string> = {
  patrocinador: 'Patrocinadores',
  apoiador: 'Apoiadores',
}

const EMPTY_SLOTS = 4

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const href = toExternalUrl(sponsor.website_url)
  const image = (
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      className="max-h-16 w-auto max-w-[180px] object-contain"
      loading="lazy"
    />
  )

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-6 py-8 min-h-[140px]">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center hover:opacity-80 transition-opacity"
          title={sponsor.name}
        >
          {image}
        </a>
      ) : (
        image
      )}
      <p className="text-sm text-muted-foreground text-center">{sponsor.name}</p>
    </div>
  )
}

function EmptySlot() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-6 py-8 min-h-[140px]">
      <span className="text-3xl text-muted-foreground/40 font-display">+</span>
      <p className="text-xs text-muted-foreground text-center">Espaço para logo</p>
    </div>
  )
}

function LogoGroup({ kind, items }: { kind: SponsorKind; items: Sponsor[] }) {
  const group = items.filter((item) => item.kind === kind && item.logo_url)
  const slots = group.length > 0 ? [] : Array.from({ length: EMPTY_SLOTS })

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-display font-bold text-center">{KIND_LABELS[kind]}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {group.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
        {slots.map((_, index) => (
          <EmptySlot key={`${kind}-slot-${index}`} />
        ))}
      </div>
    </div>
  )
}

type Props = {
  showCta?: boolean
}

export function SponsorLogos({ showCta = false }: Props) {
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const items = sponsors ?? []

  return (
    <div className="space-y-10">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Handshake className="w-6 h-6" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold font-display">Patrocinadores e Apoiadores</h2>
        <p className="text-muted-foreground">
          As empresas que apoiam a Banda BMB com doações ao caixa terão a marca exibida aqui.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando marcas...</p>
      ) : (
        <div className="space-y-12">
          <LogoGroup kind="patrocinador" items={items} />
          <LogoGroup kind="apoiador" items={items} />
        </div>
      )}

      {showCta ? (
        <div className="flex justify-center">
          <Button asChild size="lg" className="h-12 px-8">
            <Link to="/patrocinadores">Quero patrocinar a banda</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
