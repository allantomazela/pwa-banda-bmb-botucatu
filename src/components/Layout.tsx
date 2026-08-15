import { Outlet } from 'react-router-dom'
import { Header, MobileHeader, BottomNav } from './Navigation'
import { Footer } from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
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
