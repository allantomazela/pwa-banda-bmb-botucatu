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
    <div className="relative min-w-0 animate-fade-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,hsla(42,96%,58%,0.12),transparent_70%)] sm:h-56" />

      <div className="container relative z-10 mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
        <header className="mb-6 border-b border-white/10 pb-5 sm:mb-8 sm:pb-6 lg:mb-10 lg:pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px] sm:tracking-[0.22em]">
            Agenda BMB
          </p>
          <h1 className="mt-2 break-words font-display text-[1.65rem] font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            Agenda de Eventos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Apresentações, encontros e compromissos oficiais da Banda Marcial de Botucatu.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-16 sm:py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-white/10 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground sm:py-10 sm:text-base">
            Não foi possível carregar a agenda.
          </p>
        ) : !upcoming?.length && !past?.length ? (
          <EmptyAgenda />
        ) : (
          <div className="min-w-0 space-y-10 sm:space-y-12 lg:space-y-14">
            {next ? (
              <section className="min-w-0" aria-labelledby="proximo-evento">
                <SectionLabel>Próximo compromisso</SectionLabel>
                <FeaturedEvent event={next} />
              </section>
            ) : (
              <EmptyAgenda />
            )}

            {rest.length > 0 ? (
              <section className="min-w-0" aria-labelledby="proximos-eventos">
                <SectionLabel>Em seguida</SectionLabel>
                <EventList events={rest} />
              </section>
            ) : null}

            {past && past.length > 0 ? (
              <section className="min-w-0" aria-labelledby="eventos-passados">
                <SectionLabel>Realizados recentemente</SectionLabel>
                <EventList events={past} muted />
              </section>
            ) : null}

            {hasMemories ? (
              <section
                id="memorias"
                className="min-w-0 scroll-mt-24"
                aria-labelledby="memorias-titulo"
              >
                <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <SectionLabel>Memórias</SectionLabel>
                    <h2
                      id="memorias-titulo"
                      className="font-display text-lg font-bold text-white sm:text-xl md:text-2xl"
                    >
                      Fotos dos eventos
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-11 w-full border-primary/40 text-primary sm:h-9 sm:w-auto"
                  >
                    <Link to="/media?tab=eventos">
                      Ver galeria
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                  {previewPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      className="group relative aspect-[4/3] min-h-[7.5rem] overflow-hidden rounded-lg border border-white/10 bg-zinc-950 text-left transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.title || 'Foto de evento'}
                        className="h-full w-full max-w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-[11px] font-medium text-white line-clamp-1 sm:text-xs">
                        {photo.title || 'Ampliar'}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <div className="mt-10 min-w-0 sm:mt-12 lg:mt-14">
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
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:mb-3 sm:text-[11px] sm:tracking-[0.2em]">
      {children}
    </p>
  )
}

function FeaturedEvent({ event }: { event: EventItem }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-card/50 shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:rounded-2xl">
      {/* Empilha no mobile/tablet portrait; lado a lado a partir de lg */}
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex min-w-0 items-center justify-center border-b border-white/8 bg-zinc-950 p-3 sm:p-4 lg:border-b-0 lg:border-r lg:p-5">
          {hasFlyer ? (
            <img
              src={event.image_url}
              alt={`Cartaz — ${event.title}`}
              className="max-h-[min(38vh,18rem)] w-full max-w-full object-contain sm:max-h-[min(42vh,22rem)] md:max-h-[min(48vh,26rem)] lg:max-h-[min(70vh,28rem)]"
              loading="eager"
            />
          ) : (
            <DateBlock parts={parts} large />
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-4 p-4 sm:gap-5 sm:p-6 lg:p-8">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            {hasFlyer ? <DateBlock parts={parts} /> : null}
            <div className="min-w-0 flex-1">
              <h2
                id="proximo-evento"
                className="break-words font-display text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl lg:text-[1.7rem]"
              >
                {event.title}
              </h2>
              <p className="mt-1 break-words text-xs capitalize text-muted-foreground sm:mt-1.5 sm:text-sm">
                <span className="sm:hidden">
                  {parts.weekday} · {parts.day}/{parts.month}
                </span>
                <span className="hidden sm:inline">
                  {parts.weekday} · {parts.full}
                </span>
              </p>
            </div>
          </div>

          {event.description ? (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}

          <div className="space-y-2.5 border-t border-white/8 pt-3 text-sm sm:pt-4">
            <p className="flex items-center gap-2.5 text-white/90">
              <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 break-words">
                <span className="text-muted-foreground">Horário · </span>
                {parts.time}
              </span>
            </p>
            {event.location ? (
              <p className="flex items-start gap-2.5 text-white/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 break-words">
                  <span className="text-muted-foreground">Local · </span>
                  {event.location}
                </span>
              </p>
            ) : null}
          </div>

          {event.location ? (
            <div className="pt-0.5">
              <Button asChild className="h-11 w-full sm:h-10 sm:w-auto">
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
          ? 'flex flex-col items-center justify-center gap-1 px-4 py-8 text-center sm:px-6 sm:py-10'
          : 'flex w-12 shrink-0 flex-col items-center rounded-lg border border-primary/30 bg-primary/10 px-1.5 py-2 text-center sm:w-14 sm:rounded-xl sm:px-2 sm:py-2.5'
      }
    >
      <span
        className={
          large
            ? 'text-xs font-bold uppercase tracking-[0.18em] text-primary sm:text-sm sm:tracking-[0.2em]'
            : 'text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]'
        }
      >
        {parts.month}
      </span>
      <span
        className={
          large
            ? 'font-display text-5xl font-bold leading-none text-white sm:text-6xl'
            : 'font-display text-xl font-bold leading-none text-white sm:text-2xl'
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
      className={`min-w-0 overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl ${muted ? 'bg-card/25' : 'bg-card/40'}`}
    >
      {events.map((event, index) => {
        const parts = formatParts(event.event_date)
        const hasFlyer = Boolean(event.image_url?.trim())

        return (
          <li
            key={event.id}
            className={`flex min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 ${
              index > 0 ? 'border-t border-white/8' : ''
            } ${muted ? 'opacity-90' : ''}`}
          >
            {hasFlyer ? (
              <img
                src={event.image_url}
                alt=""
                className="h-14 w-11 shrink-0 rounded-md border border-white/10 bg-zinc-950 object-contain sm:h-[4.5rem] sm:w-14"
                loading="lazy"
              />
            ) : (
              <div className="flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-background/60 sm:h-[4.5rem] sm:w-14">
                <span className="text-[9px] font-bold text-primary">{parts.month}</span>
                <span className="font-display text-base font-bold leading-none text-white sm:text-lg">
                  {parts.day}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 self-center">
              <p className="break-words font-semibold leading-snug text-white">{event.title}</p>
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground sm:text-sm">
                <p className="break-words">
                  {parts.full}
                  <span className="text-white/30"> · </span>
                  {parts.time}
                </p>
                {event.location ? (
                  <p className="break-words">{event.location}</p>
                ) : null}
              </div>
            </div>

            {event.location ? (
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center self-center rounded-lg border border-primary/25 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:h-9 sm:min-w-0 sm:border-0 sm:px-0 sm:hover:bg-transparent sm:hover:underline"
                aria-label={`Ver ${event.title} no mapa`}
              >
                <MapPin className="h-4 w-4 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Mapa</span>
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
    <div className="rounded-xl border border-dashed border-white/15 bg-card/30 px-4 py-10 text-center sm:rounded-2xl sm:px-5 sm:py-12">
      <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="font-medium text-white">Nenhum evento programado no momento</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Novos compromissos da BMB aparecerão aqui em breve.
      </p>
    </div>
  )
}
