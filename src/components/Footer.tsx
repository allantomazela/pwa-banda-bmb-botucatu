import { Link, useLocation } from 'react-router-dom'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useSitePages } from '@/hooks/use-site-pages'
import { publicPagePath } from '@/lib/cms'

export function Footer() {
  const location = useLocation()
  const { settings } = useSiteSettings()
  const { navPages } = useSitePages()

  // Hide footer in restricted areas
  if (
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login'
  ) {
    return null
  }

  return (
    <footer className="bg-background border-t border-white/5 py-12 px-6 lg:px-12 mt-auto">
      <div className="container max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              B
            </div>
            <span className="font-display font-bold text-xl">
              {settings.header_title || 'Banda BMB'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs">
            {settings.footer_about ||
              'A tradição musical de Botucatu-SP, transformando vidas através da música e da disciplina.'}
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-foreground">Links Rápidos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/sobre" className="hover:text-primary transition-colors">
                Nossa História
              </Link>
            </li>
            <li>
              <Link to="/agenda" className="hover:text-primary transition-colors">
                Agenda de Eventos
              </Link>
            </li>
            <li>
              <Link to="/media" className="hover:text-primary transition-colors">
                Galeria de Mídia
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-primary transition-colors">
                Seja um Membro
              </Link>
            </li>
            {navPages.map((page) => (
              <li key={page.id}>
                <Link to={publicPagePath(page.slug)} className="hover:text-primary transition-colors">
                  {page.nav_label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-foreground">Contato</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {settings.footer_address ? <li>{settings.footer_address}</li> : null}
            {settings.footer_city ? <li>{settings.footer_city}</li> : null}
            {settings.contact_email ? <li>{settings.contact_email}</li> : null}
            {settings.contact_phone ? <li>{settings.contact_phone}</li> : null}
          </ul>
        </div>
      </div>
      <div className="container max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Banda BMB. Todos os direitos reservados.</p>
        <p className="mt-1">Criado por Allan Tomazela de Camargo</p>
      </div>
    </footer>
  )
}
