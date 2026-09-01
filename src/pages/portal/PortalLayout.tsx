import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  IdCard,
  LayoutDashboard,
  Library,
  LogOut,
  UserCog,
  ShieldCheck,
  Home,
  FilePenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { isGuardian, isSystemAdmin, roleLabel } from '@/lib/roles'
import { AppBottomBar, BottomBarItem } from '@/components/layout/AppBottomBar'
import { isMinor } from '@/lib/formatters'

const PORTAL_NAV = [
  { name: 'Dashboard', shortName: 'Painel', path: '/portal', icon: LayoutDashboard },
  { name: 'Identidade', shortName: 'Carteira', path: '/portal/id', icon: IdCard },
  { name: 'Perfil', shortName: 'Perfil', path: '/portal/perfil', icon: UserCog },
  { name: 'Autorizações', shortName: 'Autoriz.', path: '/portal/autorizacoes', icon: FilePenLine },
  { name: 'Biblioteca', shortName: 'Materiais', path: '/portal/biblioteca', icon: Library },
]

const MOBILE_BOTTOM_BAR_RESERVE = 'calc(4.25rem + env(safe-area-inset-bottom, 0px))'

const GUARDIAN_NAV_PATHS = new Set(['/portal', '/portal/autorizacoes', '/portal/perfil'])

export default function PortalLayout() {
  const { user, profile, loading, profileLoading, signOut } = useAuth()
  const location = useLocation()

  if (loading)
    return <div className="flex min-h-dvh flex-1 items-center justify-center">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  if (!profileLoading && (!profile || profile.approval_status !== 'approved')) {
    return <Navigate to="/login" replace />
  }

  if (profileLoading && !profile) {
    return <div className="flex min-h-dvh flex-1 items-center justify-center">Carregando...</div>
  }

  const displayName = profile?.full_name || 'Usuario'
  const displayInstrument = profile?.instrument || ''
  const displayAvatar =
    profile?.avatar_url ||
    `https://img.usecurling.com/ppl/medium?gender=male&seed=${profile?.id || 'default'}&dpr=2`
  const guardian = isGuardian(profile?.role)
  const navItems = PORTAL_NAV.filter((item) => {
    if (guardian) return GUARDIAN_NAV_PATHS.has(item.path)
    if (item.path === '/portal/autorizacoes') return isMinor(profile?.birth_date)
    return true
  })

  if (
    guardian &&
    (location.pathname.startsWith('/portal/id') ||
      location.pathname.startsWith('/portal/biblioteca') ||
      location.pathname.startsWith('/portal/videos'))
  ) {
    return <Navigate to="/portal" replace />
  }

  return (
    <div className="flex h-svh max-h-dvh min-h-0 min-w-0 overflow-hidden bg-background lg:min-h-dvh lg:max-h-none lg:overflow-x-clip">
      <aside className="fixed hidden h-dvh w-64 flex-col overflow-y-auto border-r border-white/5 bg-gradient-to-b from-card/50 to-card/20 lg:flex">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <Avatar className="h-12 w-12 border-2 border-primary shadow-glow/30">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {displayInstrument || roleLabel(profile?.role)}
            </p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.path ||
                (item.path === '/portal/biblioteca' && location.pathname.startsWith('/portal/videos'))
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
          {isSystemAdmin(profile?.role) && (
            <Link
              to="/admin"
              className={cn(
                'mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-t border-white/5 pt-4',
                location.pathname.startsWith('/admin')
                  ? 'bg-destructive/10 text-destructive'
                  : 'text-destructive hover:bg-destructive/10',
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              Centro Admin
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-1">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary"
          >
            <Link to="/">
              <Home className="w-5 h-5 mr-3" />
              Voltar ao site
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:ml-64">
        <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center border-b border-white/10 px-4 pt-safe glass lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Home className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          {profileLoading && !profile ? (
            <div className="p-10 text-muted-foreground">Carregando perfil...</div>
          ) : (
            <Outlet />
          )}
        </div>
        <div
          className="shrink-0 lg:hidden"
          style={{ height: MOBILE_BOTTOM_BAR_RESERVE }}
          aria-hidden
        />
      </main>

      <AppBottomBar scrollable={navItems.length + (isSystemAdmin(profile?.role) ? 1 : 0) > 4}>
        {isSystemAdmin(profile?.role) ? (
          <BottomBarItem
            to="/admin"
            icon={ShieldCheck}
            label="Admin"
            active={location.pathname.startsWith('/admin')}
            tone="danger"
            scrollable={navItems.length + 1 > 4}
          />
        ) : null}
        {navItems.map((item) => (
          <BottomBarItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.shortName}
            active={
              location.pathname === item.path ||
              (item.path === '/portal/biblioteca' && location.pathname.startsWith('/portal/videos'))
            }
            scrollable={navItems.length + (isSystemAdmin(profile?.role) ? 1 : 0) > 4}
          />
        ))}
      </AppBottomBar>
    </div>
  )
}
