import { Handshake } from 'lucide-react'
import { useFetch } from '@/hooks/use-fetch'
import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorInquiryForm } from '@/components/sponsors/SponsorInquiryForm'
import { getVisibleSponsors, toExternalUrl, type Sponsor, type SponsorKind } from '@/services/sponsors'

const KIND_LABELS: Record<SponsorKind, string> = {
  patrocinador: 'Patrocinadores',
  apoiador: 'Apoiadores',
}

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-8 min-h-[140px]">
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

function SponsorGrid({ kind, items }: { kind: SponsorKind; items: Sponsor[] }) {
  const group = items.filter((item) => item.kind === kind)
  if (group.length === 0) return null

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-center">{KIND_LABELS[kind]}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {group.map((sponsor) => (
          <SponsorLogo key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </section>
  )
}

export default function Sponsors() {
  const { data: sponsors, loading } = useFetch<Sponsor[]>(getVisibleSponsors)
  const items = sponsors ?? []
  const hasLogos = items.some((item) => item.logo_url)

  return (
    <div className="container py-12 lg:py-20 animate-fade-in space-y-16">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-2">
          <Handshake className="w-7 h-7" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display text-primary">
          Patrocinadores e Apoiadores
        </h1>
        <p className="text-lg text-muted-foreground">
          Empresas e pessoas que fortalecem a Banda BMB com apoio financeiro ao caixa e
          parcerias. Sua marca pode aparecer aqui e ajudar a manter ensaios, instrumentos e
          apresentações.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando...</p>
      ) : hasLogos ? (
        <div className="space-y-14">
          <SponsorGrid kind="patrocinador" items={items} />
          <SponsorGrid kind="apoiador" items={items} />
        </div>
      ) : (
        <p className="text-center text-muted-foreground max-w-xl mx-auto">
          As marcas que apoiam a Banda BMB aparecerão aqui. Enquanto isso, use o formulário
          abaixo para se tornar um patrocinador ou apoiador.
        </p>
      )}

      <div className="flex justify-center">
        <SponsorInquiryForm />
      </div>

      <CmsSections slug="patrocinadores" />
    </div>
  )
}
