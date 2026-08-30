import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, Music, ArrowRight, IdCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorLogos } from '@/components/sponsors/SponsorLogos'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeGalleryShowcase } from '@/components/home/HomeGalleryShowcase'

export default function Index() {
  const { user } = useAuth()
  const { settings } = useSiteSettings()

  return (
    <div className="flex flex-col">
      <HomeHero />

      <HomeGalleryShowcase />

      {/* Quick Access Tiles */}
      <section className="relative z-20 bg-background py-10 lg:py-20">
        <div className="container px-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Link to="/sobre" className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="flex flex-col items-center gap-4 p-5 text-center sm:p-8">
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
                <CardContent className="flex flex-col items-center gap-4 p-5 text-center sm:p-8">
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
                  <CardContent className="flex flex-col items-center gap-4 p-5 text-center sm:p-8">
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
                  <CardContent className="flex flex-col items-center gap-4 p-5 text-center sm:p-8">
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
        <section className="border-y border-white/5 bg-card/30 py-14 lg:py-24">
          <div className="container max-w-4xl px-4 text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:mb-6 md:text-5xl">
              {settings.join_cta_title || 'Quer fazer parte da banda?'}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground lg:mb-10 lg:text-lg">
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

      <section className="px-4 py-10 lg:py-16">
        <CmsSections slug="home" />
      </section>
    </div>
  )
}
