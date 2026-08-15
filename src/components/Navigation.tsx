import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Image as ImageIcon, User, LogIn, Library } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSitePages } from '@/hooks/use-site-pages'
import { publicPagePath } from '@/lib/cms'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { BrandMark } from '@/components/BrandMark'
import { isSystemAdmin } from '@/lib/roles'
import { AppBottomBar, BottomBarItem } from '@/components/layout/AppBottomBar'

const PUBLIC_NAV = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Mídia', path: '/media', icon: ImageIcon },
  { name: 'Sobre', path: '/sobre', icon: Library },
]

export function Header() {
  const { user, profile } = useAuth()
  const { navPages } = useSitePages()
  const location = useLocation()

  const portalPath = isSystemAdmin(profile?.role) ? '/admin' : '/portal'
  const portalLabel = isSystemAdmin(profile?.role) ? 'Painel Admin' : 'Portal'

  return (
    <header className="sticky top-0 z-50 hidden h-16 w-full items-center justify-between px-6 glass lg:flex lg:px-12">
      <Link to="/" className="group">
        <BrandMark variant="header" />
      </Link>

      <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1">
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
        <Link
          to="/patrocinadores"
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary relative py-1',
            location.pathname === '/patrocinadores' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          Patrocinadores
          {location.pathname === '/patrocinadores' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-fade-in" />
          )}
        </Link>
        {navPages.map((page) => (
          <Link
            key={page.id}
            to={publicPagePath(page.slug)}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              location.pathname === publicPagePath(page.slug)
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            {page.nav_label}
          </Link>
        ))}
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
            <Link to="/login">Área Restrita</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

export function MobileHeader() {
  const { user, profile } = useAuth()
  const portalPath = isSystemAdmin(profile?.role) ? '/admin' : '/portal'

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between px-4 glass lg:hidden">
      <Link to="/" className="group">
        <BrandMark variant="header" />
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
          <Link to="/login">Área Restrita</Link>
        </Button>
      )}
    </header>
  )
}

export function BottomNav() {
  const { user, profile } = useAuth()
  const location = useLocation()

  if (location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin')) return null

  const portalPath = isSystemAdmin(profile?.role) ? '/admin' : '/portal'

  return (
    <AppBottomBar>
      <BottomBarItem to="/" icon={Home} label="Início" active={location.pathname === '/'} />
      <BottomBarItem
        to="/agenda"
        icon={Calendar}
        label="Agenda"
        active={location.pathname === '/agenda'}
      />
      <BottomBarItem
        to="/media"
        icon={ImageIcon}
        label="Mídia"
        active={location.pathname === '/media'}
      />
      <BottomBarItem
        to={user ? portalPath : '/login'}
        icon={user ? User : LogIn}
        label={user ? (isSystemAdmin(profile?.role) ? 'Admin' : 'Portal') : 'Entrar'}
        active={
          location.pathname.includes('/login') ||
          location.pathname.startsWith('/portal') ||
          location.pathname.startsWith('/admin')
        }
      />
    </AppBottomBar>
  )
}
