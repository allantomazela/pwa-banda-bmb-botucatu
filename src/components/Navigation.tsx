import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Image as ImageIcon, User, LogIn, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

const PUBLIC_NAV = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Mídia', path: '/media', icon: ImageIcon },
]

export function Header() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <header className="hidden md:flex glass sticky top-0 z-50 w-full h-16 items-center px-6 lg:px-12 justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold group-hover:scale-105 transition-transform">
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
          to="/sobre"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          História
        </Link>
        <Link
          to="/contato"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Contato
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <Button
            asChild
            variant="default"
            className="font-semibold shadow-glow animate-pulse-glow"
          >
            <Link to="/portal">Portal do Aluno</Link>
          </Button>
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

export function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  // Do not show bottom nav if inside portal (portal has its own layout)
  if (location.pathname.startsWith('/portal')) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass pb-safe border-t border-white/10 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {PUBLIC_NAV.map((item) => {
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
          <span className="text-[10px] font-medium">{user ? 'Portal' : 'Entrar'}</span>
        </Link>
      </div>
    </nav>
  )
}
