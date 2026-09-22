/** Texto e metadados do documento impresso de autorização de viagem. */

export const TRAVEL_AUTH_DOC_VERSION = 'bmb-travel-auth-v1-2026'

export function formatAuthProtocol(id: string): string {
  const clean = id.replace(/-/g, '').toUpperCase()
  return `BMB-AV-${clean.slice(0, 4)}-${clean.slice(4, 8)}`
}

export function buildTravelAuthorizationBody(input: {
  studentName: string
  tripTitle: string
  destination: string
  departureLabel: string
  returnLabel?: string | null
}): string {
  const retorno = input.returnLabel
    ? ` com retorno previsto para ${input.returnLabel}`
    : ''
  return [
    `Eu, na qualidade de responsável legal, autorizo o(a) aluno(a) ${input.studentName} a participar da atividade/viagem "${input.tripTitle}", com destino a ${input.destination}, com saída em ${input.departureLabel}${retorno}, promovida pela Banda Marcial de Botucatu (BMB).`,
    '',
    'Declaro estar ciente das condições informadas pela BMB, assumindo a responsabilidade parental/legal pelo(a) menor durante o período da atividade, e autorizo o deslocamento e a participação nas apresentações e ensaios vinculados a este evento.',
    '',
    'Este documento é complementar à autorização eletrônica registrada no portal da BMB (Lei nº 13.709/2018 — LGPD, quando aplicável a dados pessoais) e pode ser impresso para arquivo físico junto à administração da banda.',
  ].join('\n')
}

export function signatureMethodDocLabel(method: string | null | undefined): string {
  if (method === 'govbr') return 'Gov.br (identidade verificada)'
  if (method === 'canvas') return 'Assinatura manuscrita digital no portal'
  return method || '—'
}
