import { Link, useLocation } from 'react-router-dom'
import { Instagram } from 'lucide-react'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useSitePages } from '@/hooks/use-site-pages'
import { BrandMark } from '@/components/BrandMark'
import { BRAND_NAME_TITLE } from '@/lib/brand'
import { publicPagePath } from '@/lib/cms'

function normalizeInstagramUrl(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    if (!/instagram\.com$/i.test(url.hostname) && !/\.instagram\.com$/i.test(url.hostname)) {
      return value
    }
    // Remove parâmetros de tracking (?stkn=...)
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return value
  }
}

export function Footer() {
  const location = useLocation()
  const { settings } = useSiteSettings()
  const { navPages } = useSitePages()
  const instagramUrl = normalizeInstagramUrl(settings.instagram_url)

  // Hide footer in restricted areas
  if (
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login'
  ) {
    return null
  }

  return (
    <footer className="mt-auto border-t border-white/5 bg-background px-4 py-8 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-12 lg:py-12 lg:pb-12">
      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <div className="mb-4">
            <BrandMark variant="footer" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            {settings.footer_about ||
              'A tradição musical de Botucatu-SP, transformando vidas através da música e da disciplina.'}
          </p>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              aria-label="Instagram da Banda Marcial de Botucatu"
            >
              <Instagram className="h-5 w-5 shrink-0" aria-hidden />
              <span>@bmb.botucatu</span>
            </a>
          ) : null}
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-foreground">Links Rápidos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/sobre" className="transition-colors hover:text-primary">
                Nossa História
              </Link>
            </li>
            <li>
              <Link to="/agenda" className="transition-colors hover:text-primary">
                Agenda de Eventos
              </Link>
            </li>
            <li>
              <Link to="/media" className="transition-colors hover:text-primary">
                Galeria de Mídia
              </Link>
            </li>
            <li>
              <Link to="/contato" className="transition-colors hover:text-primary">
                Seja um Membro
              </Link>
            </li>
            <li>
              <Link to="/patrocinadores" className="transition-colors hover:text-primary">
                Patrocinadores
              </Link>
            </li>
            {navPages.map((page) => (
              <li key={page.id}>
                <Link
                  to={publicPagePath(page.slug)}
                  className="transition-colors hover:text-primary"
                >
                  {page.nav_label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-foreground">Contato</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {settings.footer_address ? <li>{settings.footer_address}</li> : null}
            {settings.footer_city ? <li>{settings.footer_city}</li> : null}
            {settings.contact_email ? <li className="break-all">{settings.contact_email}</li> : null}
            {settings.contact_phone ? <li>{settings.contact_phone}</li> : null}
            {instagramUrl ? (
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-primary"
                  aria-label="Abrir Instagram @bmb.botucatu"
                >
                  <Instagram className="h-4 w-4 shrink-0" aria-hidden />
                  Instagram
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 max-w-6xl border-t border-white/5 pt-6 text-center text-xs text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {BRAND_NAME_TITLE}. Todos os direitos reservados.
        </p>
        <p className="mt-1">Criado por Allan Tomazela de Camargo</p>
      </div>
    </footer>
  )
}
