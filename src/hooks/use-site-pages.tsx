import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getNavPages, type SitePage } from '@/services/site-cms'

type SitePagesContextValue = {
  navPages: SitePage[]
  refresh: () => void
}

const SitePagesContext = createContext<SitePagesContextValue>({
  navPages: [],
  refresh: () => undefined,
})

export function SitePagesProvider({ children }: { children: ReactNode }) {
  const [navPages, setNavPages] = useState<SitePage[]>([])

  const refresh = () => {
    getNavPages()
      .then(setNavPages)
      .catch(() => setNavPages([]))
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SitePagesContext.Provider value={{ navPages, refresh }}>{children}</SitePagesContext.Provider>
  )
}

export function useSitePages() {
  return useContext(SitePagesContext)
}
