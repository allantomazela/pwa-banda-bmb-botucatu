import { Link, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Home,
  Calendar,
  Image as ImageIcon,
  User,
  LogIn,
  Library,
  LayoutDashboard,
  IdCard,
  UserCog,
  FilePenLine,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSitePages } from '@/hooks/use-site-pages'
import { publicPagePath } from '@/lib/cms'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { BrandMark } from '@/components/BrandMark'
import { isGuardian, isSystemAdmin } from '@/lib/roles'
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
    <header className="sticky top-0 z-50 hidden w-full min-w-0 items-center gap-4 px-4 pt-safe glass lg:grid lg:h-16 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] lg:px-8 xl:px-12">
      <Link to="/" className="group shrink-0">
        <BrandMark variant="header" />
      </Link>

      {/* Nav central: wrap + min-w-0 evita overflow com muitas páginas CMS */}
      <nav className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 xl:gap-x-6">
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

      <div className="flex shrink-0 items-center justify-end gap-3 lg:gap-4">
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
  const { user, profile, loading } = useAuth()
  const portalPath = isSystemAdmin(profile?.role) ? '/admin' : '/portal'

  const header = (
    <header
      className="fixed inset-x-0 top-0 z-50 flex w-full min-w-0 items-center justify-between gap-3 border-b border-white/5 bg-background/80 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] backdrop-blur-md lg:hidden"
      style={{ position: 'fixed', left: 0, right: 0, top: 0 }}
    >
      <Link to="/" className="group inline-flex min-h-11 min-w-0 items-center">
        <BrandMark variant="header" />
      </Link>
      {!loading && user ? (
        <Link
          to={portalPath}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1"
          aria-label="Abrir área restrita"
        >
          <Avatar className="h-9 w-9 border-2 border-primary/50">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Button
          asChild
          variant="ghost"
          className="min-h-11 shrink-0 touch-target px-3 text-sm font-semibold text-primary"
        >
          <Link to="/login">Área Restrita</Link>
        </Button>
      )}
    </header>
  )

  if (typeof document === 'undefined') return header
  return createPortal(header, document.body)
}

export function BottomNav() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const guardian = isGuardian(profile?.role)
  const admin = isSystemAdmin(profile?.role)

  if (location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin')) return null

  // Enquanto auth carrega, evita flash incorreto (Entrar vs Portal)
  if (loading) {
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
        <BottomBarItem to="/login" icon={LogIn} label="Entrar" active={false} />
      </AppBottomBar>
    )
  }

  if (user) {
    return (
      <AppBottomBar key={`auth-${user.id}-${profile?.role ?? 'u'}`}>
        <BottomBarItem
          to="/portal"
          icon={LayoutDashboard}
          label="Painel"
          active={location.pathname === '/portal'}
        />
        <BottomBarItem
          to="/portal/id"
          icon={IdCard}
          label="Carteira"
          active={location.pathname.startsWith('/portal/id')}
        />
        {!guardian ? (
          <BottomBarItem
            to="/portal/perfil"
            icon={UserCog}
            label="Perfil"
            active={location.pathname.startsWith('/portal/perfil')}
          />
        ) : (
          <BottomBarItem
            to="/portal/autorizacoes"
            icon={FilePenLine}
            label="Autoriz."
            active={location.pathname.startsWith('/portal/autorizacoes')}
          />
        )}
        <BottomBarItem
          to={admin ? '/admin' : '/portal'}
          icon={admin ? ShieldCheck : User}
          label={admin ? 'Admin' : 'Portal'}
          active={
            admin
              ? location.pathname.startsWith('/admin')
              : location.pathname.startsWith('/portal')
          }
        />
      </AppBottomBar>
    )
  }

  return (
    <AppBottomBar key="guest">
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
        to="/login"
        icon={LogIn}
        label="Entrar"
        active={location.pathname.includes('/login')}
      />
    </AppBottomBar>
  )
}
