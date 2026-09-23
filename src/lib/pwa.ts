const DISMISS_KEY = 'bmb-pwa-install-dismissed'
const DISMISS_DAYS = 3
export const PWA_OPEN_INSTALL_EVENT = 'bmb:open-pwa-install'

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isIosSafari(): boolean {
  if (!isIosDevice()) return false
  const ua = navigator.userAgent
  // Safari iOS: tem Safari, não é Chrome/Firefox/Edge/Opera in-app
  const isWebkit = /Safari/.test(ua) || /AppleWebKit/.test(ua)
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)
  return isWebkit && !isOtherBrowser
}

export function wasInstallPromptDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return false
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearInstallPromptDismiss(): void {
  try {
    localStorage.removeItem(DISMISS_KEY)
  } catch {
    /* ignore */
  }
}

/** Abre o guia/prompt de instalação (iOS ou Android) de qualquer tela. */
export function requestPwaInstallPrompt(): void {
  if (typeof window === 'undefined') return
  clearInstallPromptDismiss()
  window.dispatchEvent(new CustomEvent(PWA_OPEN_INSTALL_EVENT))
}

export function shouldOfferPwaInstall(): boolean {
  return !isStandaloneMode()
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* falha silenciosa — site continua funcionando sem PWA */
    })
  })
}
