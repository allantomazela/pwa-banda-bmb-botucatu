export type SponsorBgType = 'solid' | 'gradient'

export type SponsorCardStyle = {
  bg_type: SponsorBgType
  bg_color: string
  bg_color_end: string
}

export const BG_PRESETS: Array<SponsorCardStyle & { id: string; label: string }> = [
  { id: 'white', label: 'Branco', bg_type: 'solid', bg_color: '#ffffff', bg_color_end: '#ffffff' },
  { id: 'navy', label: 'Azul BMB', bg_type: 'solid', bg_color: '#1B263B', bg_color_end: '#1B263B' },
  { id: 'gold', label: 'Dourado', bg_type: 'solid', bg_color: '#FBC02D', bg_color_end: '#FBC02D' },
  { id: 'night', label: 'Degradê noite', bg_type: 'gradient', bg_color: '#1B263B', bg_color_end: '#4A5A78' },
  { id: 'goldfade', label: 'Degradê ouro', bg_type: 'gradient', bg_color: '#142033', bg_color_end: '#FBC02D' },
]

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function safeHex(value: string, fallback = '#ffffff'): string {
  const trimmed = value.trim()
  return HEX.test(trimmed) ? trimmed : fallback
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw
  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(safeHex(hex))
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export function sponsorCardBackground(style: SponsorCardStyle): string {
  const from = safeHex(style.bg_color)
  const to = safeHex(style.bg_color_end, from)
  if (style.bg_type === 'gradient') {
    return `linear-gradient(145deg, ${from} 0%, ${to} 100%)`
  }
  return from
}
