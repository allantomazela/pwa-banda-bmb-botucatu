export const PROFILE_ROLES = ['member', 'professor', 'admin', 'guardian'] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]
export type CardVariant = 'aluno' | 'professor' | 'admin'

export function normalizeRole(role: string | null | undefined): ProfileRole {
  if (role === 'admin' || role === 'professor' || role === 'guardian') return role
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
  return 'aluno'
}

export const ROLE_LABELS: Record<ProfileRole, string> = {
  member: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador do Sistema',
  guardian: 'Responsável',
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
}

export function roleLabel(role: string | null | undefined): string {
  return ROLE_LABELS[normalizeRole(role)]
}
