const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d+)/i

export function getYouTubeId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_ID)
  return match?.[1] ?? null
}

export function toEmbedUrl(url: string, options?: { autoplay?: boolean }): string {
  const trimmed = url.trim()
  const youtubeId = getYouTubeId(trimmed)
  if (youtubeId) {
    const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
    if (options?.autoplay) params.set('autoplay', '1')
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`
  }
  const vimeo = trimmed.match(VIMEO_ID)
  if (vimeo) {
    const autoplay = options?.autoplay ? '?autoplay=1' : ''
    return `https://player.vimeo.com/video/${vimeo[1]}${autoplay}`
  }
  return trimmed
}

export function getVideoThumbnail(url: string, fallback: string): string {
  const youtubeId = getYouTubeId(url)
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  return fallback
}
