import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, Music, ArrowRight, IdCard, MapPin, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useFetch } from '@/hooks/use-fetch'
import { getNextEvent, type EventItem } from '@/services/events'
import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorLogos } from '@/components/sponsors/SponsorLogos'

export default function Index() {
  const { user, profile } = useAuth()
  const { settings } = useSiteSettings()
  const { data: nextEvent } = useFetch<EventItem | null>(getNextEvent)

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              settings.hero_image_url ||
              'https://img.usecurling.com/p/1200/800?q=marching%20band%20instruments&color=blue'
            }
            alt="Banda BMB Performance"
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container relative z-10 text-center px-4 animate-slide-up-fade">
          {user && firstName ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">
                Bem-vindo de volta, {firstName}!
              </span>
            </div>
          ) : null}

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6 leading-tight">
            {settings.hero_title || 'A Tradição Musical de Botucatu'}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            {settings.hero_subtitle ||
              'Mais que uma banda marcial, uma família unida pela paixão à música, disciplina e arte.'}
          </p>

          {nextEvent && (
            <div className="max-w-md mx-auto mb-8 animate-fade-in-up">
              <Card className="bg-card/60 backdrop-blur-md border-primary/20 overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4 text-left">
                  <div className="bg-primary/15 border border-primary/30 rounded-xl p-3 text-center min-w-[64px]">
                    <span className="block text-xs text-primary font-bold uppercase">
                      {new Date(nextEvent.event_date).toLocaleString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="block text-2xl font-display font-bold text-white leading-none mt-1">
                      {new Date(nextEvent.event_date).getDate().toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">
                      Próximo Evento
                    </p>
                    <h3 className="font-bold text-white text-sm truncate">{nextEvent.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(nextEvent.event_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {nextEvent.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{nextEvent.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/agenda"
                    className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base shadow-glow"
                  asChild
                >
                  <Link to="/portal">Ir ao Portal</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-base bg-background/50 backdrop-blur"
                  asChild
                >
                  <Link to="/agenda">Ver Agenda</Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base shadow-glow animate-pulse-glow"
                  asChild
                >
                  <Link to="/contato">Seja um Membro</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-base bg-background/50 backdrop-blur"
                  asChild
                >
                  <Link to="/sobre">Conheça nossa História</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Access Tiles */}
      <section className="py-20 bg-background relative z-20 -mt-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/sobre" className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {settings.tile_history_title || 'Nossa História'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {settings.tile_history_text ||
                      'Décadas de dedicação à cultura e educação musical na nossa região.'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/agenda" className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {settings.tile_agenda_title || 'Agenda de Eventos'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {settings.tile_agenda_text ||
                      'Confira onde será nossa próxima apresentação e junte-se a nós.'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            {user ? (
              <Link to="/portal/id" className="block group">
                <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IdCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">Identidade Digital</h3>
                    <p className="text-muted-foreground text-sm">
                      Acesse sua carteirinha digital para identificação em eventos.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <div className="block group">
                <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Music className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">
                      {settings.tile_values_title || 'Nossos Valores'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {settings.tile_values_text ||
                        'Disciplina, respeito, trabalho em equipe e excelência musical.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      <SponsorLogos showCta />

      {/* Join Us CTA */}
      {!user && (
        <section className="py-24 bg-card/30 border-y border-white/5">
          <div className="container max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {settings.join_cta_title || 'Quer fazer parte da banda?'}
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              {settings.join_cta_text ||
                'Não é necessário ter experiência prévia. Nós oferecemos aulas práticas e teóricas para que você aprenda do zero. Venha construir essa história com a gente.'}
            </p>
            <Button size="lg" asChild className="h-14 px-10 text-base">
              <Link to="/contato">
                Registre seu Interesse <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="py-16">
        <CmsSections slug="home" />
      </section>
    </div>
  )
}
