export const SECTION_TYPES = ['text', 'image', 'video', 'gallery', 'cta'] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  text: 'Texto',
  image: 'Imagem',
  video: 'Vídeo',
  gallery: 'Galeria de fotos',
  cta: 'Chamada (botão)',
}

export const SYSTEM_PAGE_PATHS: Record<string, string> = {
  home: '/',
  sobre: '/sobre',
  agenda: '/agenda',
  media: '/media',
  contato: '/contato',
  patrocinadores: '/patrocinadores',
}

export const RESERVED_SLUGS = [
  'home',
  'sobre',
  'agenda',
  'media',
  'contato',
  'patrocinadores',
  'login',
  'portal',
  'admin',
  'redefinir-senha',
  'pagina',
]

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function publicPagePath(slug: string): string {
  return SYSTEM_PAGE_PATHS[slug] ?? `/pagina/${slug}`
}

export function toEmbedUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('/embed/')) return trimmed

  const youtube = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  )
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`

  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/)
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`

  return trimmed
}
