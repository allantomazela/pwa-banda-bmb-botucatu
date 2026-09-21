import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getPastEvents, getUpcomingEvents, type EventItem } from '@/services/events'
import { getEventPhotos, type GalleryPhoto } from '@/services/gallery'
import { Button } from '@/components/ui/button'
import { CmsSections } from '@/components/cms/CmsSections'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import {
  ArrowRight,
  Calendar,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

function formatParts(iso: string) {
  const date = new Date(iso)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
    weekday: date.toLocaleString('pt-BR', { weekday: 'long' }),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  }
}

function mapsUrl(location: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(location)}`
}

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  action,
}: {
  eyebrow: string
  title: string
  accent?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <header className="max-w-2xl">
        <div className="ornate-rule mb-3 max-w-[12rem]">
          <span className="inline-flex items-center gap-1.5 font-crest text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
            <Sparkles className="h-3 w-3" aria-hidden />
            {eyebrow}
          </span>
        </div>
        <h2 className="font-crest text-2xl font-bold leading-tight tracking-[0.04em] text-white md:text-3xl">
          {title}
          {accent ? (
            <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
              {accent}
            </span>
          ) : null}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </header>
      {action}
    </div>
  )
}

export default function Agenda() {
  const { data: upcoming, loading, error } = useFetch<EventItem[]>(getUpcomingEvents)
  const { data: past } = useFetch<EventItem[]>(() => getPastEvents(6))
  const { data: eventPhotos } = useFetch<GalleryPhoto[]>(getEventPhotos)
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)

  const next = upcoming?.[0] ?? null
  const rest = upcoming?.slice(1) ?? []
  const previewPhotos = eventPhotos?.slice(0, 8) ?? []
  const selectedPhoto =
    photoIndex !== null && previewPhotos[photoIndex] ? previewPhotos[photoIndex] : null

  return (
    <div className="gallery-moments-mesh relative overflow-hidden animate-fade-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-48 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />

      <section className="relative border-b border-white/5 py-10 sm:py-14 lg:py-16">
        <div className="container relative z-10 px-4">
          <header className="mx-auto max-w-2xl text-center">
            <div className="ornate-rule mx-auto mb-4 max-w-[14rem]">
              <span className="inline-flex items-center gap-1.5 font-crest text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
                <Calendar className="h-3 w-3" aria-hidden />
                Agenda BMB
              </span>
            </div>
            <h1 className="font-crest text-fluid-section font-bold leading-tight tracking-[0.06em] text-white">
              Próximos
              <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
                palcos
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Apresentações, encontros e compromissos oficiais da Banda Marcial de Botucatu —
              marque na agenda e venha viver a marcha com a gente.
            </p>
          </header>
        </div>
      </section>

      <div className="container relative z-10 space-y-16 px-4 py-10 sm:space-y-20 sm:py-14 lg:py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-muted-foreground">
            Não foi possível carregar a agenda.
          </p>
        ) : !upcoming?.length ? (
          <EmptyAgenda />
        ) : (
          <>
            {next ? <FeaturedEvent event={next} /> : null}

            {rest.length > 0 ? (
              <section className="space-y-8">
                <SectionHeading
                  eyebrow="Em seguida"
                  title="Mais compromissos"
                  accent="na estrada"
                  description="Outros encontros e apresentações já confirmados."
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((event, i) => (
                    <EventPoster key={event.id} event={event} delay={i * 70} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {past && past.length > 0 ? (
          <section className="space-y-8">
            <SectionHeading
              eyebrow="Arquivo"
              title="Já realizados"
              accent="na história"
              description="Cartazes e datas que marcaram a trajetória recente da banda."
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {past.map((event, i) => (
                <PastEventPoster key={event.id} event={event} delay={i * 50} />
              ))}
            </div>
          </section>
        ) : null}

        <section id="memorias" className="scroll-mt-24 space-y-8">
          <SectionHeading
            eyebrow="Memórias"
            title="Eventos em"
            accent="imagem"
            description="Fotos das apresentações e encontros. Toque para ampliar."
            action={
              <Button asChild variant="outline" className="border-primary/40 text-primary">
                <Link to="/media?tab=eventos">
                  Ver todas as fotos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />

          {!eventPhotos?.length ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-card/20 px-6 py-14 text-center">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
              <p className="text-muted-foreground">
                Em breve as fotos dos eventos aparecerão neste espaço.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {previewPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/8 bg-zinc-950 text-left transition duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_hsla(42,96%,58%,0.12)]"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title || 'Foto de evento'}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                  <span className="absolute inset-x-0 bottom-0 p-3 font-crest text-[11px] uppercase tracking-[0.14em] text-white/90 line-clamp-1">
                    {photo.title || 'Ampliar'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <CmsSections slug="agenda" />
      </div>

      <MediaLightbox
        open={photoIndex !== null}
        title={selectedPhoto?.title || 'Foto do evento'}
        imageUrl={selectedPhoto?.image_url ?? null}
        videoUrl={null}
        counter={
          photoIndex !== null && previewPhotos.length
            ? `${photoIndex + 1} / ${previewPhotos.length}`
            : undefined
        }
        onPrev={() =>
          setPhotoIndex((prev) =>
            prev === null || !previewPhotos.length
              ? prev
              : (prev - 1 + previewPhotos.length) % previewPhotos.length,
          )
        }
        onNext={() =>
          setPhotoIndex((prev) =>
            prev === null || !previewPhotos.length
              ? prev
              : (prev + 1) % previewPhotos.length,
          )
        }
        onClose={() => setPhotoIndex(null)}
      />
    </div>
  )
}

function FeaturedEvent({ event }: { event: EventItem }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <section className="relative" aria-labelledby="agenda-destaque">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          {hasFlyer ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-3 shadow-[0_24px_80px_hsla(0,0%,0%,0.45)] sm:p-4">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <img
                src={event.image_url}
                alt={`Flyer — ${event.title}`}
                className="mx-auto max-h-[min(68vh,38rem)] w-full object-contain object-center"
                loading="eager"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/20 to-card/60">
              <span className="font-crest text-sm font-bold uppercase tracking-[0.28em] text-primary">
                {parts.month}
              </span>
              <span className="font-crest text-7xl font-bold leading-none text-white">{parts.day}</span>
              <span className="capitalize text-sm text-muted-foreground">{parts.weekday}</span>
            </div>
          )}
        </div>

        <div className="relative space-y-6 text-center lg:text-left">
          <div>
            <p className="mb-3 font-crest text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Destaque da agenda
            </p>
            <h2
              id="agenda-destaque"
              className="font-crest text-2xl font-bold leading-tight tracking-[0.03em] text-white sm:text-3xl lg:text-4xl"
            >
              {event.title}
            </h2>
            {event.description ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {event.description}
              </p>
            ) : null}
          </div>

          <dl className="mx-auto grid max-w-md gap-3 sm:grid-cols-2 lg:mx-0 lg:max-w-none">
            <div className="rounded-xl border border-white/8 bg-card/30 px-4 py-3 text-left backdrop-blur-sm">
              <dt className="font-crest text-[10px] uppercase tracking-[0.2em] text-primary">Data</dt>
              <dd className="mt-1 text-sm font-medium text-white">
                <span className="capitalize">{parts.weekday}</span>
                <span className="mt-0.5 block text-muted-foreground">{parts.full}</span>
              </dd>
            </div>
            <div className="rounded-xl border border-white/8 bg-card/30 px-4 py-3 text-left backdrop-blur-sm">
              <dt className="font-crest text-[10px] uppercase tracking-[0.2em] text-primary">
                Horário
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
                {parts.time}
              </dd>
            </div>
            {event.location ? (
              <div className="rounded-xl border border-white/8 bg-card/30 px-4 py-3 text-left backdrop-blur-sm sm:col-span-2">
                <dt className="font-crest text-[10px] uppercase tracking-[0.2em] text-primary">
                  Local
                </dt>
                <dd className="mt-1 flex items-start gap-2 text-sm font-medium text-white">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="break-words">{event.location}</span>
                </dd>
              </div>
            ) : null}
          </dl>

          {event.location ? (
            <div className="flex justify-center lg:justify-start">
              <Button asChild className="shadow-glow">
                <a href={mapsUrl(event.location)} target="_blank" rel="noreferrer">
                  Ver no mapa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EventPoster({ event, delay }: { event: EventItem; delay: number }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-card/25 transition duration-500 hover:border-primary/35 hover:bg-card/40"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center bg-zinc-950 p-3">
        {hasFlyer ? (
          <img
            src={event.image_url}
            alt={`Flyer — ${event.title}`}
            className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="text-center">
            <span className="block font-crest text-xs font-bold text-primary">{parts.month}</span>
            <span className="mt-1 block font-crest text-5xl font-bold text-white">{parts.day}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <h3 className="font-crest text-base font-bold leading-snug tracking-[0.02em] text-white">
          {event.title}
        </h3>
        {event.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        ) : null}
        <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
            {parts.full} · {parts.time}
          </p>
          {event.location ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{event.location}</span>
            </p>
          ) : null}
        </div>
        {event.location ? (
          <Button variant="secondary" className="w-full" asChild>
            <a href={mapsUrl(event.location)} target="_blank" rel="noreferrer">
              Ver no mapa
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function PastEventPoster({ event, delay }: { event: EventItem; delay: number }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <article
      className="group space-y-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-zinc-950 p-2 transition duration-500 group-hover:border-primary/35">
        {hasFlyer ? (
          <img
            src={event.image_url}
            alt={`Flyer — ${event.title}`}
            className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="text-center">
            <span className="block font-crest text-[10px] font-bold text-primary">{parts.month}</span>
            <span className="mt-1 block font-crest text-4xl font-bold text-white">{parts.day}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <h3 className="line-clamp-2 font-crest text-sm font-bold leading-snug tracking-[0.02em] text-white">
          {event.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{parts.full}</p>
      </div>
    </article>
  )
}

function EmptyAgenda() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/8 bg-card/25 px-6 py-16 text-center">
      <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
      <p className="font-crest text-lg font-bold tracking-[0.04em] text-white">
        Nenhum evento programado no momento
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Em breve novos compromissos da BMB aparecerão aqui.
      </p>
    </div>
  )
}
