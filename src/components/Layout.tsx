import { Outlet } from 'react-router-dom'
import { Header, MobileHeader, BottomNav } from './Navigation'
import { Footer } from './Footer'
import { useSiteSettings } from '@/hooks/use-site-settings'

export default function Layout() {
  const { settings } = useSiteSettings()
  const bgUrl = settings.site_bg_image_url?.trim()

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      {bgUrl ? (
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
          <img
            src={bgUrl}
            alt=""
            className="h-full w-full object-cover object-center opacity-[0.22]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </div>
      ) : null}

      <Header />
      <MobileHeader />
      <main className="flex flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
