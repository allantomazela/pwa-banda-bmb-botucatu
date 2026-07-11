import { useFetch } from '@/hooks/use-fetch'
import { getAdminStats } from '@/services/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, Calendar, ShieldCheck, Image as ImageIcon, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const { data: stats, loading } = useFetch(getAdminStats)

  const cards = [
    {
      label: 'Total de Membros',
      value: stats?.totalMembers,
      icon: Users,
      color: 'text-blue-400',
      path: '/admin/members',
    },
    {
      label: 'Materiais',
      value: stats?.totalMaterials,
      icon: FileText,
      color: 'text-yellow-400',
      path: '/admin/materials',
    },
    {
      label: 'Eventos Pendentes',
      value: stats?.pendingEvents,
      icon: Calendar,
      color: 'text-orange-400',
      path: '/admin/events',
    },
    {
      label: 'Fotos da Galeria',
      value: stats?.totalPhotos,
      icon: ImageIcon,
      color: 'text-green-400',
      path: '/admin/gallery',
    },
    {
      label: 'Config. do Site',
      value: '—',
      icon: Settings,
      color: 'text-purple-400',
      path: '/admin/site',
    },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-destructive" />
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">Visão geral do ecossistema da Banda BMB.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <Link key={card.label} to={card.path}>
            <Card className="bg-card/50 border-white/5 hover:border-white/10 hover:scale-[1.02] transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    {card.label}
                  </CardTitle>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold font-display">
                  {loading ? '...' : (card.value ?? '—')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Gestão Rápida</h3>
            <p className="text-sm text-muted-foreground">Acesse as ferramentas de administração.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/events">Eventos</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/members">Membros</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/materials">Materiais</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/videos">Vídeos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
