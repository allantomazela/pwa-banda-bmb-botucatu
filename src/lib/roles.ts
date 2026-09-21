export const PROFILE_ROLES = [
  'member',
  'professor',
  'admin',
  'guardian',
  'support_group',
] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]
export type CardVariant = 'aluno' | 'professor' | 'admin' | 'support' | 'guardian'

export function normalizeRole(role: string | null | undefined): ProfileRole {
  if (
    role === 'admin' ||
    role === 'professor' ||
    role === 'guardian' ||
    role === 'support_group'
  ) {
    return role
  }
  return 'member'
}

export function isSystemAdmin(role: string | null | undefined): boolean {
  return role === 'admin'
}

export function isGuardian(role: string | null | undefined): boolean {
  return role === 'guardian'
}

export function resolveCardVariant(role: string | null | undefined): CardVariant {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return 'admin'
  if (normalized === 'professor') return 'professor'
  if (normalized === 'support_group') return 'support'
  if (normalized === 'guardian') return 'guardian'
  return 'aluno'
}

export const ROLE_LABELS: Record<ProfileRole, string> = {
  member: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador do Sistema',
  guardian: 'Responsável Legal',
  support_group: 'Grupo de Apoio',
}

export const ROLE_CARD_COPY: Record<
  CardVariant,
  { title: string; subtitle: string; badge: string }
> = {
  aluno: {
    title: 'Carteira de Aluno',
    subtitle: 'Identificação de músico em formação',
    badge: 'Aluno',
  },
  professor: {
    title: 'Carteira de Professor',
    subtitle: 'Identificação do corpo docente',
    badge: 'Professor',
  },
  admin: {
    title: 'Carteira de Administrador',
    subtitle: 'Identificação da organização do sistema',
    badge: 'Administrador',
  },
  support: {
    title: 'Carteira de Apoio',
    subtitle: 'Identificação do grupo de apoio da banda',
    badge: 'Grupo de Apoio',
  },
  guardian: {
    title: 'Carteira de Responsável',
    subtitle: 'Identificação do responsável legal',
    badge: 'Responsável Legal',
  },
}

export function roleLabel(role: string | null | undefined): string {
  return ROLE_LABELS[normalizeRole(role)]
}
