import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  IdCard,
  LayoutDashboard,
  Library,
  Video,
  LogOut,
  UserCog,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { isSystemAdmin, roleLabel } from '@/lib/roles'

const PORTAL_NAV = [
  { name: 'Dashboard', path: '/portal', icon: LayoutDashboard },
  { name: 'Identidade', path: '/portal/id', icon: IdCard },
  { name: 'Perfil', path: '/portal/perfil', icon: UserCog },
  { name: 'Biblioteca', path: '/portal/biblioteca', icon: Library },
  { name: 'Videos', path: '/portal/videos', icon: Video },
]

export default function PortalLayout() {
  const { user, profile, loading, profileLoading, signOut } = useAuth()
  const location = useLocation()

  if (loading)
    return <div className="flex-1 flex items-center justify-center min-h-screen">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  const displayName = profile?.full_name || 'Usuario'
  const displayInstrument = profile?.instrument || ''
  const displayAvatar =
    profile?.avatar_url ||
    `https://img.usecurling.com/ppl/medium?gender=male&seed=${profile?.id || 'default'}&dpr=2`

  return (
    <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-gradient-to-b from-card/50 to-card/20 fixed h-[calc(100vh-4rem)]">
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
          {PORTAL_NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.path
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

      <main className="flex-1 md:ml-64 pb-20 md:pb-0 relative min-h-full">
        <div className="md:hidden sticky top-0 z-40 glass border-b border-white/10 px-4 h-12 flex items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Home className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
        {profileLoading && !profile ? (
          <div className="p-10 text-muted-foreground">Carregando perfil...</div>
        ) : (
          <Outlet />
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass pb-safe border-t border-white/10 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {isSystemAdmin(profile?.role) && (
            <Link
              to="/admin"
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                location.pathname.startsWith('/admin')
                  ? 'text-destructive'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
          {PORTAL_NAV.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
