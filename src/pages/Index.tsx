import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, Music, ArrowRight } from 'lucide-react'

export default function Index() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1200/800?q=marching%20band&color=blue"
            alt="Banda BMB Performance"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container relative z-10 text-center px-4 animate-slide-up-fade">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6 leading-tight">
            A Tradição Musical de <br /> <span className="text-primary">Botucatu</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Mais que uma banda marcial, uma família unida pela paixão à música, disciplina e arte.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-20 bg-background relative z-20 -mt-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/sobre" className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Nossa História</h3>
                  <p className="text-muted-foreground text-sm">
                    Décadas de dedicação à cultura e educação musical na nossa região.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <div className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Music className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Nossos Valores</h3>
                  <p className="text-muted-foreground text-sm">
                    Disciplina, respeito, trabalho em equipe e excelência musical.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Link to="/agenda" className="block group">
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-subtle">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Próximo Evento</h3>
                  <p className="text-muted-foreground text-sm">
                    Confira onde será nossa próxima apresentação e junte-se a nós.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Quer fazer parte da banda?</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Não é necessário ter experiência prévia. Nós oferecemos aulas práticas e teóricas para
            que você aprenda do zero. Venha construir essa história com a gente.
          </p>
          <Button size="lg" asChild className="h-14 px-10 text-base">
            <Link to="/contato">
              Registre seu Interesse <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
