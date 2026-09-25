const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d+)/i

export function getYouTubeId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_ID)
  return match?.[1] ?? null
}

export function toWatchUrl(url: string): string | null {
  const trimmed = url.trim()
  const youtubeId = getYouTubeId(trimmed)
  if (youtubeId) return `https://www.youtube.com/watch?v=${youtubeId}`
  if (VIMEO_ID.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

export function toEmbedUrl(url: string, options?: { autoplay?: boolean; muted?: boolean }): string {
  const trimmed = url.trim()
  const youtubeId = getYouTubeId(trimmed)
  if (youtubeId) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    })
    // Autoplay no mobile só funciona com mute; sem isso o player fica preto
    if (options?.autoplay) {
      params.set('autoplay', '1')
      params.set('mute', options.muted === false ? '0' : '1')
    }
    return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`
  }
  const vimeo = trimmed.match(VIMEO_ID)
  if (vimeo) {
    const params = new URLSearchParams()
    if (options?.autoplay) {
      params.set('autoplay', '1')
      params.set('muted', options.muted === false ? '0' : '1')
    }
    const qs = params.toString()
    return `https://player.vimeo.com/video/${vimeo[1]}${qs ? `?${qs}` : ''}`
  }
  return trimmed
}

export function getVideoThumbnail(url: string, fallback: string): string {
  const youtubeId = getYouTubeId(url)
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  return fallback
}
