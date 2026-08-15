import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Video,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Inbox,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrandCrest } from '@/components/BrandMark'

const ADMIN_NAV = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Membros', path: '/admin/members', icon: Users },
  { name: 'Interesses', path: '/admin/inquiries', icon: Inbox },
  { name: 'Eventos', path: '/admin/events', icon: Calendar },
  { name: 'Materiais', path: '/admin/materials', icon: FileText },
  { name: 'Vídeos', path: '/admin/videos', icon: Video },
  { name: 'Site', path: '/admin/site', icon: Settings },
  { name: 'Galeria', path: '/admin/gallery', icon: ImageIcon },
]

export default function AdminLayout() {
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-card/30 fixed h-screen">
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

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="md:hidden sticky top-0 z-40 glass border-b border-white/10 px-4 h-12 flex items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Home className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass pb-safe border-t border-white/10 z-50">
          <div className="flex items-center justify-around h-16 px-1">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                  isActive(item.path) ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        <Outlet />
      </main>
    </div>
  )
}
