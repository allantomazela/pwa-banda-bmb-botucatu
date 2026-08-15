export const MATERIAL_CATEGORIES = [
  'Método I',
  'Método II',
  'Partituras',
  'Métodos',
  'Avisos',
  'Geral',
] as const

export const VIDEO_CATEGORIES = [
  'Método I',
  'Método II',
  'Marcha',
  'Coreografia',
  'Instrumento',
  'Apresentação',
  'Ensaio',
  'Geral',
] as const

export function groupByCategory<T extends { category: string }>(
  items: T[],
  categoryOrder: readonly string[],
): { category: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.category?.trim() || 'Geral'
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }

  const ordered = categoryOrder
    .filter((category) => map.has(category))
    .map((category) => ({ category, items: map.get(category) ?? [] }))

  const extras = [...map.keys()]
    .filter((category) => !categoryOrder.includes(category))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((category) => ({ category, items: map.get(category) ?? [] }))

  return [...ordered, ...extras]
}
