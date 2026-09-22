import { isMinor } from '@/lib/formatters'
import { isGuardian, normalizeRole } from '@/lib/roles'

export type ProfileCompletionInput = {
  role?: string | null
  full_name?: string | null
  instrument?: string | null
  registration_number?: string | null
  city?: string | null
  state?: string | null
  cpf?: string | null
  rg?: string | null
  birth_date?: string | null
  avatar_url?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  image_consent_status?: string | null
}

/** Foto real — ignora vazio e placeholders mocados (usecurling etc.) */
export function hasProfilePhoto(url: string | null | undefined): boolean {
  const value = url?.trim() || ''
  if (!value) return false
  if (/usecurling\.com/i.test(value)) return false
  if (/placeholder|dicebear|ui-avatars/i.test(value)) return false
  return true
}

function filled(value: string | null | undefined): boolean {
  return Boolean(value && String(value).trim() !== '')
}

export function getProfileCompletion(profile: ProfileCompletionInput | null | undefined): {
  percent: number
  isComplete: boolean
  missingLabels: string[]
} {
  if (!profile) {
    return { percent: 0, isComplete: false, missingLabels: ['Perfil'] }
  }

  const guardianRole = isGuardian(profile.role)
  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: filled(profile.full_name), label: 'Nome' },
    { ok: filled(profile.city), label: 'Cidade' },
    { ok: filled(profile.state), label: 'Estado' },
    { ok: filled(profile.cpf), label: 'CPF' },
    { ok: filled(profile.rg), label: 'RG' },
    { ok: filled(profile.birth_date), label: 'Nascimento' },
    { ok: hasProfilePhoto(profile.avatar_url), label: 'Foto' },
  ]

  if (!guardianRole) {
    checks.push({ ok: filled(profile.instrument), label: 'Instrumento' })
    checks.push({ ok: filled(profile.registration_number), label: 'Matrícula' })
  }

  const role = normalizeRole(profile.role)
  const needsGuardianContact =
    !guardianRole &&
    role !== 'admin' &&
    isMinor(profile.birth_date ? String(profile.birth_date).split('T')[0] : null)

  if (needsGuardianContact) {
    checks.push({
      ok: filled(profile.guardian_name) && filled(profile.guardian_phone),
      label: 'Responsável',
    })
  }

  if (!guardianRole) {
    checks.push({
      ok: profile.image_consent_status === 'granted',
      label: 'Autorização de imagem',
    })
  }

  const done = checks.filter((c) => c.ok).length
  const percent = Math.round((done / checks.length) * 100)
  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.label)

  return {
    percent,
    isComplete: percent >= 100,
    missingLabels,
  }
}
