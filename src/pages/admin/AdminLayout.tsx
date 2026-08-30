import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Library,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Inbox,
  Home,
  Bus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrandCrest } from '@/components/BrandMark'
import { AppBottomBar, BottomBarItem } from '@/components/layout/AppBottomBar'

const ADMIN_NAV = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Membros', path: '/admin/members', icon: Users },
  { name: 'Interesses', path: '/admin/inquiries', icon: Inbox },
  { name: 'Eventos', path: '/admin/events', icon: Calendar },
  { name: 'Viagens', path: '/admin/viagens', icon: Bus },
  { name: 'Biblioteca', path: '/admin/biblioteca', icon: Library },
  { name: 'Site', path: '/admin/site', icon: Settings },
  { name: 'Galeria', path: '/admin/gallery', icon: ImageIcon },
]

export default function AdminLayout() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    if (path === '/admin/biblioteca') {
      return (
        location.pathname.startsWith('/admin/biblioteca') ||
        location.pathname.startsWith('/admin/materials') ||
        location.pathname.startsWith('/admin/videos')
      )
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="fixed hidden h-dvh w-64 flex-col overflow-y-auto border-r border-white/5 bg-card/30 lg:flex">
        <div className="flex items-center gap-3 border-b border-white/5 p-6">
          <div className="h-10 w-10">
            <BrandCrest />
          </div>
          <div>
            <p className="text-sm font-bold">Centro Admin</p>
            <p className="font-crest text-[10px] uppercase tracking-[0.18em] text-primary">
              Banda Marcial
            </p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
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
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link to="/portal">
              <ArrowLeft className="w-5 h-5 mr-3" />
              Voltar ao Portal
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:ml-64 lg:pb-0">
        <div className="sticky top-0 z-40 flex h-12 items-center border-b border-white/10 px-4 glass lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Home className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
        <AppBottomBar>
          {ADMIN_NAV.map((item) => (
            <BottomBarItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.name}
              active={isActive(item.path)}
            />
          ))}
        </AppBottomBar>
        <Outlet />
      </main>
    </div>
  )
}
