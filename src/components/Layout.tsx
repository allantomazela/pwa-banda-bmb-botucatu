import { Outlet } from 'react-router-dom'
import { Header, MobileHeader, BottomNav } from './Navigation'
import { Footer } from './Footer'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <MobileHeader />
      <main className="flex-1 pb-16 md:pb-0 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
