import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useFetch } from '@/hooks/use-fetch'
import { getNextEvent, type EventItem } from '@/services/events'
import { BrandMark } from '@/components/BrandMark'
import { BRAND_NAME_TITLE } from '@/lib/brand'

export function HomeHero() {
  const { user, profile } = useAuth()
  const { settings } = useSiteSettings()
  const { data: nextEvent } = useFetch<EventItem | null>(getNextEvent)
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <section className="relative flex min-h-0 items-center justify-center overflow-hidden py-10 lg:min-h-[85vh] lg:py-0">
      <div className="absolute inset-0 z-0">
        <img
          src={
            settings.hero_image_url ||
            'https://img.usecurling.com/p/1200/800?q=marching%20band%20instruments&color=blue'
          }
          alt={BRAND_NAME_TITLE}
          className="h-full w-full object-cover opacity-35 mix-blend-overlay"
        />
        <div className="hero-crest-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/40" />
      </div>

      <div className="pointer-events-none absolute left-[-8%] top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-[-6%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="container relative z-10 px-4 py-8 text-center animate-slide-up-fade lg:py-16">
        {user && firstName ? (
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm font-medium text-primary">
              Bem-vindo de volta, {firstName}!
            </span>
          </div>
        ) : null}

        <BrandMark variant="hero" />

        <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 md:text-lg">
          {settings.hero_subtitle ||
            'Mais que uma banda marcial, uma família unida pela paixão à música, disciplina e arte.'}
        </p>

        {nextEvent && (
          <div className="mx-auto mb-8 mt-8 max-w-md animate-fade-in-up">
            <Card className="overflow-hidden border-primary/20 bg-card/60 backdrop-blur-md">
              <CardContent className="flex items-center gap-3 p-3 text-left sm:gap-4 sm:p-5">
                <div className="min-w-[64px] rounded-xl border border-primary/30 bg-primary/15 p-3 text-center">
                  <span className="block text-xs font-bold uppercase text-primary">
                    {new Date(nextEvent.event_date).toLocaleString('pt-BR', { month: 'short' })}
                  </span>
                  <span className="mt-1 block font-display text-2xl font-bold leading-none text-white">
                    {new Date(nextEvent.event_date).getDate().toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Próximo Evento
                  </p>
                  <h3 className="truncate text-sm font-bold text-white">{nextEvent.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(nextEvent.event_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {nextEvent.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{nextEvent.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to="/agenda"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div
          className={
            nextEvent
              ? 'flex flex-col items-center justify-center gap-4 sm:flex-row'
              : 'mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'
          }
        >
          {user ? (
            <>
              <Button
                size="lg"
                className="h-14 w-full px-8 text-base shadow-glow sm:h-14 sm:w-auto"
                asChild
              >
                <Link to="/portal">Ir ao Portal</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full bg-background/50 px-8 text-base backdrop-blur sm:w-auto"
                asChild
              >
                <Link to="/agenda">Ver Agenda</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="h-14 w-full animate-pulse-glow px-8 text-base shadow-glow sm:w-auto"
                asChild
              >
                <Link to="/contato">Seja um Membro</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full bg-background/50 px-8 text-base backdrop-blur sm:w-auto"
                asChild
              >
                <Link to="/sobre">Conheça nossa História</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
