import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

const MIN_VISIBLE_MS = 1800
const FADE_MS = 650

/**
 * Controla o splash HTML (#app-splash): permanece até o auth carregar
 * e o tempo mínimo da animação do brasão, depois faz fade-out.
 */
export function AppBootSplash() {
  const { loading } = useAuth()
  const startedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
  const done = useRef(false)

  useEffect(() => {
    if (loading || done.current) return

    const splash = document.getElementById('app-splash')
    if (!splash) return

    done.current = true
    const elapsed =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt.current
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)

    let removeTimer = 0
    const hideTimer = window.setTimeout(() => {
      splash.classList.add('app-splash-out')
      removeTimer = window.setTimeout(() => {
        splash.remove()
      }, FADE_MS)
    }, wait)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(removeTimer)
    }
  }, [loading])

  return null
}
