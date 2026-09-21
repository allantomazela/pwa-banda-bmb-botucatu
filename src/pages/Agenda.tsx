import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getPastEvents, getUpcomingEvents, type EventItem } from '@/services/events'
import { getEventPhotos, type GalleryPhoto } from '@/services/gallery'
import { Button } from '@/components/ui/button'
import { CmsSections } from '@/components/cms/CmsSections'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import { ArrowRight, Calendar, Clock, Loader2, MapPin } from 'lucide-react'
import { useState } from 'react'

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

export default function Agenda() {
  const { data: upcoming, loading, error } = useFetch<EventItem[]>(getUpcomingEvents)
  const { data: past } = useFetch<EventItem[]>(() => getPastEvents(8))
  const { data: eventPhotos } = useFetch<GalleryPhoto[]>(getEventPhotos)
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)

  const next = upcoming?.[0] ?? null
  const rest = upcoming?.slice(1) ?? []
  const previewPhotos = eventPhotos?.slice(0, 8) ?? []
  const selectedPhoto =
    photoIndex !== null && previewPhotos[photoIndex] ? previewPhotos[photoIndex] : null
  const hasMemories = previewPhotos.length > 0

  return (
    <div className="relative animate-fade-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,hsla(42,96%,58%,0.12),transparent_70%)]" />

      <div className="container relative z-10 mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:py-12">
        <header className="mb-8 border-b border-white/10 pb-6 sm:mb-10 sm:pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Agenda BMB
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Agenda de Eventos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Apresentações, encontros e compromissos oficiais da Banda Marcial de Botucatu.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-white/10 bg-card/40 px-4 py-10 text-center text-muted-foreground">
            Não foi possível carregar a agenda.
          </p>
        ) : !upcoming?.length && !past?.length ? (
          <EmptyAgenda />
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {next ? (
              <section aria-labelledby="proximo-evento">
                <SectionLabel>Próximo compromisso</SectionLabel>
                <FeaturedEvent event={next} />
              </section>
            ) : (
              <EmptyAgenda />
            )}

            {rest.length > 0 ? (
              <section aria-labelledby="proximos-eventos">
                <SectionLabel>Em seguida</SectionLabel>
                <EventList events={rest} />
              </section>
            ) : null}

            {past && past.length > 0 ? (
              <section aria-labelledby="eventos-passados">
                <SectionLabel>Realizados recentemente</SectionLabel>
                <EventList events={past} muted />
              </section>
            ) : null}

            {hasMemories ? (
              <section id="memorias" className="scroll-mt-24" aria-labelledby="memorias-titulo">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <SectionLabel>Memórias</SectionLabel>
                    <h2
                      id="memorias-titulo"
                      className="font-display text-xl font-bold text-white sm:text-2xl"
                    >
                      Fotos dos eventos
                    </h2>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-primary/40 text-primary">
                    <Link to="/media?tab=eventos">
                      Ver galeria
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
                  {previewPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-zinc-950 text-left transition hover:border-primary/40"
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.title || 'Foto de evento'}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs font-medium text-white line-clamp-1">
                        {photo.title || 'Ampliar'}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <div className="mt-12 sm:mt-14">
          <CmsSections slug="agenda" />
        </div>
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

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
      {children}
    </p>
  )
}

function FeaturedEvent({ event }: { event: EventItem }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-card/50 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex items-center justify-center border-b border-white/8 bg-zinc-950 p-4 md:border-b-0 md:border-r md:p-5">
          {hasFlyer ? (
            <img
              src={event.image_url}
              alt={`Cartaz — ${event.title}`}
              className="max-h-[min(52vh,28rem)] w-full object-contain"
              loading="eager"
            />
          ) : (
            <DateBlock parts={parts} large />
          )}
        </div>

        <div className="flex flex-col justify-center gap-5 p-5 sm:p-6 lg:p-8">
          <div className="flex items-start gap-4">
            {hasFlyer ? <DateBlock parts={parts} /> : null}
            <div className="min-w-0 flex-1">
              <h2
                id="proximo-evento"
                className="font-display text-xl font-bold leading-snug text-white sm:text-2xl lg:text-[1.7rem]"
              >
                {event.title}
              </h2>
              <p className="mt-1.5 capitalize text-sm text-muted-foreground">
                {parts.weekday} · {parts.full}
              </p>
            </div>
          </div>

          {event.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              {event.description}
            </p>
          ) : null}

          <div className="space-y-2.5 border-t border-white/8 pt-4 text-sm">
            <p className="flex items-center gap-2.5 text-white/90">
              <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="text-muted-foreground">Horário · </span>
                {parts.time}
              </span>
            </p>
            {event.location ? (
              <p className="flex items-start gap-2.5 text-white/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="text-muted-foreground">Local · </span>
                  {event.location}
                </span>
              </p>
            ) : null}
          </div>

          {event.location ? (
            <div>
              <Button asChild>
                <a href={mapsUrl(event.location)} target="_blank" rel="noreferrer">
                  Ver no mapa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function DateBlock({
  parts,
  large = false,
}: {
  parts: ReturnType<typeof formatParts>
  large?: boolean
}) {
  return (
    <div
      className={
        large
          ? 'flex flex-col items-center justify-center gap-1 px-6 py-10 text-center'
          : 'flex w-14 shrink-0 flex-col items-center rounded-xl border border-primary/30 bg-primary/10 px-2 py-2.5 text-center'
      }
    >
      <span
        className={
          large
            ? 'text-sm font-bold uppercase tracking-[0.2em] text-primary'
            : 'text-[10px] font-bold uppercase tracking-wider text-primary'
        }
      >
        {parts.month}
      </span>
      <span
        className={
          large
            ? 'font-display text-6xl font-bold leading-none text-white'
            : 'font-display text-2xl font-bold leading-none text-white'
        }
      >
        {parts.day}
      </span>
    </div>
  )
}

function EventList({ events, muted = false }: { events: EventItem[]; muted?: boolean }) {
  return (
    <ul
      className={`overflow-hidden rounded-2xl border border-white/10 ${muted ? 'bg-card/25' : 'bg-card/40'}`}
    >
      {events.map((event, index) => {
        const parts = formatParts(event.event_date)
        const hasFlyer = Boolean(event.image_url?.trim())

        return (
          <li
            key={event.id}
            className={`flex gap-3 p-3.5 sm:gap-4 sm:p-4 ${
              index > 0 ? 'border-t border-white/8' : ''
            } ${muted ? 'opacity-90' : ''}`}
          >
            {hasFlyer ? (
              <img
                src={event.image_url}
                alt=""
                className="h-16 w-12 shrink-0 rounded-md border border-white/10 bg-zinc-950 object-contain sm:h-[4.5rem] sm:w-14"
                loading="lazy"
              />
            ) : (
              <div className="flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-background/60 sm:h-[4.5rem] sm:w-14">
                <span className="text-[9px] font-bold text-primary">{parts.month}</span>
                <span className="font-display text-lg font-bold leading-none text-white">
                  {parts.day}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 self-center">
              <p className="font-semibold leading-snug text-white">{event.title}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {parts.full}
                <span className="text-white/30"> · </span>
                {parts.time}
                {event.location ? (
                  <>
                    <span className="text-white/30"> · </span>
                    <span>{event.location}</span>
                  </>
                ) : null}
              </p>
            </div>

            {event.location ? (
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noreferrer"
                className="hidden shrink-0 self-center text-xs font-semibold text-primary hover:underline sm:inline"
              >
                Mapa
              </a>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function EmptyAgenda() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-5 py-12 text-center">
      <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="font-medium text-white">Nenhum evento programado no momento</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Novos compromissos da BMB aparecerão aqui em breve.
      </p>
    </div>
  )
}
