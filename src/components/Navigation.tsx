import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Image as ImageIcon, User, LogIn, Library } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const PUBLIC_NAV = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Mídia', path: '/media', icon: ImageIcon },
  { name: 'Sobre', path: '/sobre', icon: Library },
]

export function Header() {
  const { user, profile } = useAuth()
  const location = useLocation()

  const portalPath = profile?.role === 'admin' ? '/admin' : '/portal'
  const portalLabel = profile?.role === 'admin' ? 'Painel Admin' : 'Portal do Aluno'

  return (
    <header className="hidden md:flex glass sticky top-0 z-50 w-full h-16 items-center px-6 lg:px-12 justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg group-hover:scale-105 transition-transform shadow-glow">
          B
        </div>
        <span className="font-display font-bold text-xl tracking-wide">Banda BMB</span>
      </Link>

      <nav className="flex items-center gap-8">
        {PUBLIC_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary relative py-1',
              location.pathname === item.path ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {item.name}
            {location.pathname === item.path && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </Link>
        ))}
        <Link
          to="/contato"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Contato
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Link to={portalPath} className="flex items-center gap-2 group">
              <Avatar className="h-9 w-9 border-2 border-primary/50 group-hover:border-primary transition-colors">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button asChild variant="default" className="font-semibold shadow-glow">
              <Link to={portalPath}>{portalLabel}</Link>
            </Button>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
          >
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

export function MobileHeader() {
  const { user, profile } = useAuth()
  const portalPath = profile?.role === 'admin' ? '/admin' : '/portal'

  return (
    <header className="md:hidden glass sticky top-0 z-50 w-full h-14 flex items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-base shadow-glow">
          B
        </div>
        <span className="font-display font-bold text-base tracking-wide">Banda BMB</span>
      </Link>
      {user ? (
        <Link to={portalPath} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-primary/50">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Button asChild variant="ghost" size="sm" className="text-primary font-semibold">
          <Link to="/login">Entrar</Link>
        </Button>
      )}
    </header>
  )
}

export function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  if (location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin')) return null

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Mídia', path: '/media', icon: ImageIcon },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass pb-safe border-t border-white/10 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
        <Link
          to={user ? '/portal' : '/login'}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
            location.pathname.includes('/login')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          <span className="text-[10px] font-medium">{user ? 'Perfil' : 'Entrar'}</span>
        </Link>
      </div>
    </nav>
  )
}
