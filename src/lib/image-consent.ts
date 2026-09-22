/** Termo de autorização de uso de imagem — LGPD (Lei 13.709/2018), art. 14. */
export const IMAGE_CONSENT_VERSION = 'bmb-image-v1-2026'

export const IMAGE_CONSENT_TITLE = 'Autorização de uso de imagem e voz'

export const IMAGE_CONSENT_PURPOSES = [
  'Site institucional e aplicativo da Banda Marcial de Botucatu (BMB)',
  'Redes sociais oficiais da BMB (ex.: Instagram, Facebook, YouTube)',
  'Galeria e materiais de divulgação institucional da BMB',
  'Materiais impressos institucionais (folders, cartazes, anuários)',
  'Vídeos institucionais de apresentações e atividades da banda',
] as const

export function buildImageConsentText(): string {
  return [
    `${IMAGE_CONSENT_TITLE} (versão ${IMAGE_CONSENT_VERSION})`,
    '',
    'Com base na Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), no art. 5º, X, da Constituição Federal e no art. 20 do Código Civil, autorizo a Banda Marcial de Botucatu (controladora) a captar e utilizar imagem e/ou voz do(a) titular exclusivamente para as finalidades abaixo, no melhor interesse de crianças e adolescentes quando aplicável (LGPD, art. 14):',
    '',
    ...IMAGE_CONSENT_PURPOSES.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Condições:',
    '- O uso é institucional e educacional da BMB; não inclui cessão comercial a terceiros alheios à banda.',
    '- O consentimento é específico, destacado e livre; não está embutido em termos genéricos de uso.',
    '- Para menores de 18 anos, o consentimento deve ser dado por ao menos um dos pais ou responsável legal (LGPD, art. 14, §1º), com verificação razoável do vínculo.',
    '- Adolescentes (12 a 17 anos): recomenda-se também o assentimento do próprio adolescente, sem prejuízo do consentimento do responsável.',
    '- Vigência: até a revogação ou o desligamento do quadro da BMB, o que ocorrer primeiro.',
    '- Revogação: pode ser feita a qualquer momento, sem custo, pelo perfil no portal ou contato com a administração; a revogação não afeta usos já realizados de forma lícita até então.',
    '- Direitos do titular: acesso, correção, eliminação (quando cabível), informação e petição à ANPD.',
    '',
    'Ao marcar a opção de autorização, declaro ter lido e compreendido este termo.',
  ].join('\n')
}

export type ImageConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked'

export function imageConsentLabel(status: string | null | undefined): string {
  switch (status) {
    case 'granted':
      return 'Imagem autorizada'
    case 'denied':
      return 'Imagem não autorizada'
    case 'revoked':
      return 'Autorização revogada'
    default:
      return 'Autorização pendente'
  }
}

export type EmergencyContact = {
  name: string
  phone: string
  relationship?: string
}

export function normalizeEmergencyContacts(
  value: unknown,
  fallback?: { name?: string | null; phone?: string | null },
): EmergencyContact[] {
  const list: EmergencyContact[] = []
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const name = String(row.name ?? '').trim()
      if (!name) continue
      list.push({
        name,
        phone: String(row.phone ?? '').trim(),
        relationship: String(row.relationship ?? 'Responsável').trim() || 'Responsável',
      })
    }
  }
  if (list.length === 0 && fallback?.name?.trim()) {
    list.push({
      name: fallback.name.trim(),
      phone: (fallback.phone || '').trim(),
      relationship: 'Responsável legal',
    })
  }
  return list.slice(0, 4)
}
