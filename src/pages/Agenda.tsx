import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getPastEvents, getUpcomingEvents, type EventItem } from '@/services/events'
import { getEventPhotos, type GalleryPhoto } from '@/services/gallery'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="animate-fade-in">
      <section className="relative overflow-hidden border-b border-white/5 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(42,96%,58%,0.14),transparent_60%)]" />
        <div className="container relative z-10 px-4">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Agenda BMB
            </p>
            <h1 className="text-fluid-section font-display font-bold tracking-tight">
              Acompanhe a banda nos próximos{' '}
              <span className="text-primary">palcos</span>
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Apresentações, ensaios abertos e compromissos oficiais da Banda Marcial de Botucatu —
              para a comunidade viver cada momento com a gente.
            </p>
          </div>
        </div>
      </section>

      <div className="container space-y-16 px-4 py-10 sm:py-14 lg:py-16">
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
              <section className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold">Próximos compromissos</h2>
                    <p className="text-sm text-muted-foreground">
                      Marque na agenda e venha prestigiar a BMB.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-5">
                  {rest.map((event, i) => (
                    <EventCard key={event.id} event={event} delay={i * 80} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {past && past.length > 0 ? (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Já realizados</h2>
              <p className="text-sm text-muted-foreground">
                Momentos recentes que ficaram na história da banda.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => {
                const parts = formatParts(event.event_date)
                const hasFlyer = Boolean(event.image_url?.trim())
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-xl border border-white/8 bg-card/40 px-4 py-3"
                  >
                    {hasFlyer ? (
                      <img
                        src={event.image_url}
                        alt=""
                        className="h-14 w-11 shrink-0 rounded-lg border border-white/10 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="min-w-[56px] rounded-lg border border-white/10 bg-background/80 px-2 py-2 text-center">
                        <span className="block text-[10px] font-bold text-primary">{parts.month}</span>
                        <span className="block text-xl font-display font-bold leading-none text-white">
                          {parts.day}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{event.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {parts.full}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        <section id="memorias" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Memórias dos eventos
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Galeria atualizada com fotos das apresentações e encontros realizados. Sempre que
                houver um novo registro, ele aparece aqui.
              </p>
            </div>
            <Button asChild variant="outline" className="border-primary/40 text-primary">
              <Link to="/media?tab=eventos">
                Ver todas as fotos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {!eventPhotos?.length ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-14 text-center">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                Em breve as fotos dos eventos aparecerão neste espaço.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                Admin: publique na Galeria com a categoria <strong>Eventos</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {previewPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/8 bg-card text-left transition-colors hover:border-primary/40"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title || 'Foto de evento'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                    <span className="line-clamp-1 text-sm font-medium text-white">
                      {photo.title || 'Ampliar'}
                    </span>
                  </div>
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
    <section className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card/80 to-card shadow-[0_0_60px_hsla(42,96%,58%,0.12)]">
      <div
        className={
          hasFlyer
            ? 'grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]'
            : 'grid gap-0 lg:grid-cols-[220px_1fr]'
        }
      >
        {hasFlyer ? (
          <div className="relative min-h-[18rem] overflow-hidden bg-zinc-950 sm:min-h-[22rem] lg:min-h-full">
            <img
              src={event.image_url}
              alt={`Flyer — ${event.title}`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background/80" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-3 py-2 backdrop-blur-md lg:left-5 lg:top-5">
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">
                  {parts.month}
                </span>
                <span className="block font-display text-3xl font-bold leading-none text-white">
                  {parts.day}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 border-b border-primary/20 bg-primary/10 px-6 py-8 lg:border-b-0 lg:border-r">
            <span className="text-sm font-bold uppercase tracking-widest text-primary">
              {parts.month}
            </span>
            <span className="font-display text-6xl font-bold leading-none text-white">{parts.day}</span>
            <span className="capitalize text-sm text-muted-foreground">{parts.weekday}</span>
          </div>
        )}

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Destaque da agenda
            </p>
            {hasFlyer ? (
              <p className="mb-1 capitalize text-sm text-muted-foreground">{parts.weekday}</p>
            ) : null}
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{event.title}</h2>
            {event.description ? (
              <p className="mt-3 max-w-2xl text-muted-foreground">{event.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {parts.time}
            </span>
            {event.location ? (
              <span className="inline-flex max-w-full items-center gap-2 break-words">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {event.location}
              </span>
            ) : null}
          </div>
          {event.location ? (
            <Button asChild className="shadow-glow">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver no mapa
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EventCard({ event, delay }: { event: EventItem; delay: number }) {
  const parts = formatParts(event.event_date)
  const hasFlyer = Boolean(event.image_url?.trim())

  return (
    <Card
      className="overflow-hidden border-white/8 bg-card/60 transition-colors hover:border-primary/35"
      style={{ animationDelay: `${delay}ms` }}
    >
      {hasFlyer ? (
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950 sm:aspect-[3/4]">
          <img
            src={event.image_url}
            alt={`Flyer — ${event.title}`}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="absolute left-3 top-3 min-w-[56px] rounded-lg border border-white/15 bg-black/55 px-2 py-1.5 text-center backdrop-blur-md">
            <span className="block text-[10px] font-bold text-primary">{parts.month}</span>
            <span className="block font-display text-xl font-bold leading-none text-white">
              {parts.day}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
      )}
      <CardContent className="space-y-4 p-5">
        {!hasFlyer ? (
          <div className="flex gap-4">
            <div className="min-w-[64px] rounded-xl border border-white/10 bg-background/70 p-2.5 text-center">
              <span className="block text-[10px] font-bold text-primary">{parts.month}</span>
              <span className="mt-0.5 block font-display text-2xl font-bold leading-none text-white">
                {parts.day}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold leading-snug text-white">{event.title}</h3>
              {event.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="font-bold leading-snug text-white">{event.title}</h3>
            {event.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
            ) : null}
          </div>
        )}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {parts.time}
          </p>
          {event.location ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{event.location}</span>
            </p>
          ) : null}
        </div>
        {event.location ? (
          <Button variant="secondary" className="w-full" asChild>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver no mapa
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EmptyAgenda() {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/40 px-6 py-16 text-center">
      <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
      <p className="text-lg font-medium text-white">Nenhum evento programado no momento</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Em breve novos compromissos da BMB aparecerão aqui.
      </p>
    </div>
  )
}
