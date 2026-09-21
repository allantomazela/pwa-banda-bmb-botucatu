/** Origem pública do site (QR / links compartilháveis). */
export function getPublicSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://bandabmb.com.br'
}

export function buildVerifyCardUrl(memberId: string): string {
  const id = memberId.trim()
  return `${getPublicSiteOrigin()}/verify?id=${encodeURIComponent(id)}`
}

/** WebViews embutidos (WhatsApp, Instagram, etc.) — pedem “abrir no navegador”. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|MicroMessenger|TikTok|Snapchat|Discord/i.test(ua)) {
    return true
  }
  // Android WebView genérico
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return true
  return false
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

/**
 * Tenta sair do WebView e abrir no navegador do sistema (Android Intent).
 * No iOS não há API equivalente confiável.
 */
export function buildAndroidExternalBrowserIntent(url: string): string {
  const withoutScheme = url.replace(/^https?:\/\//i, '')
  const fallback = encodeURIComponent(url)
  return `intent://${withoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`
}
