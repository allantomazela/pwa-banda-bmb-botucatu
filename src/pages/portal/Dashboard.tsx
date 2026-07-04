import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_EVENTS, MOCK_MATERIALS } from '@/lib/mock-data'
import { Calendar, FileText, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user } = useAuth()
  const nextEvent = MOCK_EVENTS[0]
  const recentMaterials = MOCK_MATERIALS.slice(0, 2)

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display">Olá, {user?.full_name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Bem-vindo de volta ao Portal do Aluno BMB.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Quick Access */}
        <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Identidade Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse sua carteirinha para identificação em eventos e ensaios.
            </p>
            <Button asChild className="w-full sm:w-auto shadow-glow">
              <Link to="/portal/id">Ver Minha Identidade</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Next Event */}
        <Card className="bg-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Próximo Compromisso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <div>
                <h4 className="font-bold text-white mb-1">{nextEvent.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {new Date(nextEvent.date).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(nextEvent.date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="text-xs bg-background/50 inline-block px-2 py-1 rounded text-muted-foreground">
                  {nextEvent.location_name}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum evento próximo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Materials */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Adicionados Recentemente</h2>
          <Link
            to="/portal/biblioteca"
            className="text-sm text-primary flex items-center hover:underline"
          >
            Ver tudo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentMaterials.map((mat) => (
            <Card
              key={mat.id}
              className="bg-card/50 border-white/5 hover:border-white/10 transition-colors"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-sm truncate text-white">{mat.title}</h4>
                  <p className="text-xs text-muted-foreground">{mat.category}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
