import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Accessibility,
  RefreshCcw,
  ShieldCheck,
  Music2,
  CalendarDays,
  Hash,
  MapPin,
  CreditCard,
  IdCard,
  Printer,
  BadgeCheck,
  GraduationCap,
  Award,
  Phone,
  Users,
  UserRound,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateBR, isDateOnOrAfterToday, isMinor } from '@/lib/formatters'
import { ROLE_CARD_COPY, resolveCardVariant, type CardVariant } from '@/lib/roles'
import { hasProfilePhoto } from '@/lib/profile-completion'
import { buildVerifyCardUrl } from '@/lib/site-url'
import { imageConsentLabel, normalizeEmergencyContacts } from '@/lib/image-consent'
import { VerifyQrCode } from '@/components/portal/VerifyQrCode'
import './digital-id-card.css'

export interface DigitalIdProfile {
  id: string
  full_name: string
  instrument: string
  registration_number: string
  avatar_url: string | null
  birth_date: string | null
  valid_until: string | null
  city: string
  state: string
  cpf: string
  disability_info: string | null
  rg: string
  role: string
  phone?: string | null
  guardian_name: string | null
  guardian_phone: string | null
  emergency_contacts?: Array<{ name: string; phone: string; relationship?: string }> | null
  image_consent_status?: string | null
}

type CardTheme = {
  variantClass: string
  mesh: string
  accentText: string
  accentSoft: string
  faceBg: string
  backBg: string
  header: string
  glowA: string
  glowB: string
  photoRing: string
  chip: string
  infoBox: string
  BadgeIcon: LucideIcon
}

const cardTheme: Record<CardVariant, CardTheme> = {
  aluno: {
    variantClass: 'id-variant-aluno',
    mesh: 'id-mesh-aluno',
    accentText: 'text-sky-300',
    accentSoft: 'text-sky-400',
    faceBg: 'bg-gradient-to-br from-[#12263f] via-[#1B263B] to-[#071018]',
    backBg: 'bg-gradient-to-br from-[#1a3350] via-[#1B263B] to-[#0A101D]',
    header: 'bg-gradient-to-r from-sky-700 via-sky-500 to-cyan-500',
    glowA: 'bg-sky-400/15',
    glowB: 'bg-cyan-500/10',
    photoRing: 'bg-gradient-to-br from-sky-300 via-cyan-400 to-sky-700',
    chip: 'border-sky-400/35 bg-sky-500/15',
    infoBox: 'border-sky-400/25 bg-sky-500/10',
    BadgeIcon: GraduationCap,
  },
  professor: {
    variantClass: 'id-variant-professor',
    mesh: 'id-mesh-professor',
    accentText: 'text-amber-300',
    accentSoft: 'text-amber-400',
    faceBg: 'bg-gradient-to-br from-[#2a2110] via-[#1B263B] to-[#0A101D]',
    backBg: 'bg-gradient-to-br from-[#3a2e14] via-[#1B263B] to-[#0A101D]',
    header: 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600',
    glowA: 'bg-amber-400/20',
    glowB: 'bg-amber-600/15',
    photoRing: 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700',
    chip: 'border-amber-400/35 bg-amber-500/15',
    infoBox: 'border-amber-400/25 bg-amber-500/10',
    BadgeIcon: Award,
  },
  admin: {
    variantClass: 'id-variant-admin',
    mesh: 'id-mesh-admin',
    accentText: 'text-violet-300',
    accentSoft: 'text-violet-400',
    faceBg: 'bg-gradient-to-br from-[#241433] via-[#1B263B] to-[#0A101D]',
    backBg: 'bg-gradient-to-br from-[#321848] via-[#1B263B] to-[#0A101D]',
    header: 'bg-gradient-to-r from-violet-800 via-violet-500 to-indigo-500',
    glowA: 'bg-violet-400/20',
    glowB: 'bg-indigo-600/15',
    photoRing: 'bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700',
    chip: 'border-violet-400/35 bg-violet-500/15',
    infoBox: 'border-violet-400/25 bg-violet-500/10',
    BadgeIcon: ShieldCheck,
  },
  support: {
    variantClass: 'id-variant-support',
    mesh: 'id-mesh-support',
    accentText: 'text-emerald-300',
    accentSoft: 'text-emerald-400',
    faceBg: 'bg-gradient-to-br from-[#0f2a24] via-[#1B263B] to-[#071018]',
    backBg: 'bg-gradient-to-br from-[#163830] via-[#1B263B] to-[#0A101D]',
    header: 'bg-gradient-to-r from-emerald-800 via-emerald-500 to-teal-500',
    glowA: 'bg-emerald-400/18',
    glowB: 'bg-teal-500/12',
    photoRing: 'bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-700',
    chip: 'border-emerald-400/35 bg-emerald-500/15',
    infoBox: 'border-emerald-400/25 bg-emerald-500/10',
    BadgeIcon: Users,
  },
  guardian: {
    variantClass: 'id-variant-guardian',
    mesh: 'id-mesh-guardian',
    accentText: 'text-rose-300',
    accentSoft: 'text-rose-400',
    faceBg: 'bg-gradient-to-br from-[#2a1520] via-[#1B263B] to-[#071018]',
    backBg: 'bg-gradient-to-br from-[#3a1c2a] via-[#1B263B] to-[#0A101D]',
    header: 'bg-gradient-to-r from-rose-800 via-rose-500 to-orange-500',
    glowA: 'bg-rose-400/18',
    glowB: 'bg-orange-500/10',
    photoRing: 'bg-gradient-to-br from-rose-300 via-rose-500 to-orange-700',
    chip: 'border-rose-400/35 bg-rose-500/15',
    infoBox: 'border-rose-400/25 bg-rose-500/10',
    BadgeIcon: Users,
  },
  honorary: {
    variantClass: 'id-variant-honorary',
    mesh: 'id-mesh-honorary',
    accentText: 'text-amber-200',
    accentSoft: 'text-amber-300',
    faceBg: 'bg-gradient-to-br from-[#3a2e0f] via-[#2a2210] to-[#0f0c05]',
    backBg: 'bg-gradient-to-br from-[#4a3a14] via-[#2a2210] to-[#120e06]',
    header: 'bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-600',
    glowA: 'bg-amber-300/25',
    glowB: 'bg-yellow-500/15',
    photoRing: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-700',
    chip: 'border-amber-300/45 bg-amber-400/15',
    infoBox: 'border-amber-300/35 bg-amber-500/10',
    BadgeIcon: Crown,
  },
}

function formatDate(dateStr: string | null): string {
  return formatDateBR(dateStr)
}

function displayOrDash(value: string | null | undefined): string {
  if (!value || value.trim() === '') return '—'
  return value
}

function getStatus(validUntil: string | null): {
  label: string
  active: boolean
  color: string
  glowClass: string
  borderClass: string
} {
  if (!validUntil)
    return {
      label: 'Sem validade',
      active: false,
      color: 'bg-yellow-500',
      glowClass: 'id-glow-warning',
      borderClass: 'ring-yellow-500/40',
    }
  if (isDateOnOrAfterToday(validUntil))
    return {
      label: 'Ativo',
      active: true,
      color: 'bg-green-500',
      glowClass: 'id-glow-active',
      borderClass: 'ring-green-500/40',
    }
  return {
    label: 'Expirado',
    active: false,
    color: 'bg-red-500',
    glowClass: 'id-glow-expired',
    borderClass: 'ring-red-500/40',
  }
}

function getNameFontSize(name: string): string {
  const len = name.trim().length
  if (len <= 18) return 'text-lg'
  if (len <= 26) return 'text-base'
  if (len <= 35) return 'text-sm'
  if (len <= 45) return 'text-xs'
  return 'text-[11px]'
}

function InfoCell({
  icon: Icon,
  label,
  value,
  accentClass,
  compact = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  accentClass: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm',
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2',
      )}
    >
      <div className="mb-0.5 flex items-center gap-1">
        <Icon className={cn('h-2.5 w-2.5 shrink-0', accentClass)} />
        <span className="truncate text-[8px] uppercase tracking-[0.12em] text-white/50">
          {label}
        </span>
      </div>
      <p
        className={cn(
          'break-words font-mono font-medium leading-tight text-white',
          compact ? 'text-[9px]' : 'text-[10px]',
        )}
        style={{ textWrap: 'balance' as const }}
      >
        {value}
      </p>
    </div>
  )
}

interface DigitalIdCardProps {
  profile: DigitalIdProfile
  /** Alunos vinculados — exibidos na carteirinha do responsável legal */
  linkedStudents?: Array<{ full_name: string; registration_number: string }>
  showActions?: boolean
  className?: string
}

export function DigitalIdCard({
  profile,
  linkedStudents = [],
  showActions = true,
  className,
}: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [photoBroken, setPhotoBroken] = useState(false)

  const variant = resolveCardVariant(profile.role)
  const meta = ROLE_CARD_COPY[variant]
  const theme = cardTheme[variant]
  const BadgeIcon = theme.BadgeIcon

  const verifyUrl = buildVerifyCardUrl(profile.id)
  const hasPhoto = hasProfilePhoto(profile.avatar_url)
  const avatarSrc = hasPhoto ? profile.avatar_url!.trim() : ''
  const cityUF = [profile.city, profile.state].filter(Boolean).join('/') || '—'
  const status = getStatus(profile.valid_until)
  const nameFontSize = useMemo(() => getNameFontSize(profile.full_name), [profile.full_name])
  const showGuardian = isMinor(profile.birth_date)
  const emergencyContacts = normalizeEmergencyContacts(profile.emergency_contacts, {
    name: profile.guardian_name,
    phone: profile.guardian_phone,
  })
  // Frente: só o principal quando há vários — detalhes completos no verso
  const multiGuardians = showGuardian && emergencyContacts.length > 1
  const frontGuardians = multiGuardians
    ? emergencyContacts.slice(0, 1)
    : emergencyContacts.slice(0, 2)
  const extraGuardians = Math.max(0, emergencyContacts.length - frontGuardians.length)
  const imageConsent = profile.image_consent_status || 'pending'
  const imageConsentOk = imageConsent === 'granted'
  const showLinkedStudents = linkedStudents.length > 0
  const primaryLinked = linkedStudents[0]
  const extraLinkedCount = Math.max(0, linkedStudents.length - 1)
  const showPhoto = hasPhoto && !photoBroken
  const isDense =
    multiGuardians ||
    (showLinkedStudents && linkedStudents.length > 1) ||
    Boolean(profile.disability_info?.trim())
  const cardHeightClass = isDense
    ? 'min-h-[clamp(32rem,88dvh,38rem)]'
    : 'min-h-[clamp(30rem,85dvh,35rem)]'

  useEffect(() => {
    setPhotoBroken(false)
  }, [profile.avatar_url])

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div
        className={cn(
          'printable-id id-card-perspective relative w-full max-w-[360px] cursor-pointer select-none',
          cardHeightClass,
          theme.variantClass,
        )}
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label={`${meta.title} de ${profile.full_name}. Toque para ${isFlipped ? 'ver a frente' : 'ver o verso'}.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsFlipped(!isFlipped)
          }
        }}
      >
        <div
          className={cn(
            'id-card-inner relative h-full w-full',
            cardHeightClass,
            isFlipped && 'flipped',
          )}
        >
          {/* Frente */}
          <div
            className={cn(
              'id-card-face absolute inset-0 h-full w-full overflow-hidden rounded-[1.35rem] shadow-2xl ring-1',
              status.borderClass,
            )}
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className={cn('absolute inset-0', theme.faceBg)} />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className={cn('absolute inset-0 opacity-40', theme.mesh)} />
            <div
              className={cn(
                'absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl',
                theme.glowA,
              )}
            />
            <div
              className={cn(
                'absolute -bottom-12 -left-8 h-32 w-32 rounded-full blur-3xl',
                theme.glowB,
              )}
            />

            <div className={cn('relative z-10 flex h-full flex-col', cardHeightClass)}>
              <div
                className={cn(
                  'relative flex shrink-0 items-center justify-between overflow-hidden px-4',
                  isDense ? 'h-14' : 'h-16',
                  theme.header,
                )}
              >
                <div className="absolute inset-0 id-card-shimmer" />
                <div className="relative z-10 flex items-center gap-2.5">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-[#1B263B] shadow-md ring-1 ring-white/20">
                    <img
                      src="/brand-logo.png"
                      alt="Brasão da Banda Marcial de Botucatu"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B263B]/90">
                      Banda Marcial
                    </p>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-[#1B263B]">
                      {meta.badge}
                    </p>
                  </div>
                </div>
                <BadgeIcon className="relative z-10 h-6 w-6 text-[#1B263B]/70" />
              </div>

              <div
                className={cn(
                  'flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-3.5 pb-3',
                  isDense ? 'pt-3' : 'pt-4',
                )}
              >
                <div className={cn('relative shrink-0', isDense ? 'mb-2' : 'mb-3')}>
                  <div
                    className={cn(
                      'absolute -inset-[3px] rounded-[1.15rem] opacity-90 blur-[1px]',
                      theme.photoRing,
                    )}
                  />
                  <div
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-[1rem] border border-white/25 bg-zinc-950 shadow-xl',
                      isDense ? 'h-[4.75rem] w-[4.75rem]' : 'h-[5.5rem] w-[5.5rem]',
                    )}
                  >
                    {showPhoto ? (
                      <img
                        src={avatarSrc}
                        alt={`Foto de ${profile.full_name}`}
                        className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                        onError={() => setPhotoBroken(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900/90 px-2 text-center">
                        <UserRound className="h-8 w-8 text-white/35" aria-hidden />
                        <span className="text-[8px] font-medium uppercase tracking-wide text-white/45">
                          Sem foto
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <h2
                  className={cn(
                    'mb-1 w-full break-words text-center font-display font-extrabold leading-tight text-white hyphens-auto',
                    nameFontSize,
                  )}
                  style={{ textWrap: 'balance' as const }}
                >
                  {profile.full_name}
                </h2>

                <div
                  className={cn(
                    'inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1',
                    isDense ? 'mb-2' : 'mb-3',
                    theme.chip,
                  )}
                >
                  <BadgeCheck className={cn('h-3 w-3 shrink-0', theme.accentSoft)} />
                  <span
                    className={cn(
                      'truncate text-[10px] font-bold uppercase tracking-[0.14em]',
                      theme.accentText,
                    )}
                  >
                    {meta.badge} · Botucatu/SP
                  </span>
                </div>

                <div
                  className={cn(
                    'grid w-full grid-cols-2',
                    isDense ? 'gap-1.5' : 'gap-2',
                  )}
                >
                  <InfoCell
                    icon={Music2}
                    label="Instrumento"
                    value={displayOrDash(profile.instrument)}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  <InfoCell
                    icon={Hash}
                    label="Matrícula"
                    value={displayOrDash(profile.registration_number)}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  <InfoCell
                    icon={MapPin}
                    label="Cidade/UF"
                    value={cityUF}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  <InfoCell
                    icon={CalendarDays}
                    label="Nascimento"
                    value={formatDate(profile.birth_date)}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  <InfoCell
                    icon={CreditCard}
                    label="CPF"
                    value={displayOrDash(profile.cpf)}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  <InfoCell
                    icon={IdCard}
                    label="RG"
                    value={displayOrDash(profile.rg)}
                    accentClass={theme.accentSoft}
                    compact={isDense}
                  />
                  {!showGuardian ? (
                    <InfoCell
                      icon={Phone}
                      label="Telefone"
                      value={displayOrDash(profile.phone)}
                      accentClass={theme.accentSoft}
                      compact={isDense}
                    />
                  ) : null}
                </div>

                {profile.disability_info && profile.disability_info.trim() !== '' && (
                  <div
                    className={cn(
                      'mt-2 w-full rounded-xl border px-2.5 py-2 backdrop-blur-sm',
                      theme.infoBox,
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-1">
                      <Accessibility className={cn('h-2.5 w-2.5 shrink-0', theme.accentSoft)} />
                      <span
                        className={cn(
                          'text-[8px] font-semibold uppercase tracking-wide',
                          theme.accentText,
                        )}
                      >
                        Acessibilidade
                      </span>
                    </div>
                    <p className="break-words text-[9px] leading-tight text-white/90">
                      {profile.disability_info}
                    </p>
                  </div>
                )}

                {showGuardian && frontGuardians.length > 0 && (
                  <div
                    className={cn(
                      'w-full rounded-xl border border-amber-400/30 bg-amber-500/10 backdrop-blur-sm',
                      isDense ? 'mt-2 px-2.5 py-2' : 'mt-2 px-2.5 py-2.5',
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <Users className="h-2.5 w-2.5 shrink-0 text-amber-300" />
                        <span className="text-[8px] font-semibold uppercase tracking-wide text-amber-200">
                          {multiGuardians
                            ? `${emergencyContacts.length} responsáveis`
                            : 'Responsável'}
                        </span>
                      </div>
                      {extraGuardians > 0 ? (
                        <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[8px] font-medium text-amber-100/90">
                          +{extraGuardians} no verso
                        </span>
                      ) : null}
                    </div>
                    <ul className={cn(multiGuardians ? 'space-y-0' : 'space-y-2')}>
                      {frontGuardians.map((contact) => (
                        <li
                          key={`${contact.name}-${contact.phone}`}
                          className="min-w-0 rounded-lg bg-black/15 px-2 py-1.5"
                        >
                          <p className="truncate text-[10px] font-medium leading-snug text-white">
                            {contact.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {contact.relationship ? (
                              <span className="truncate text-[9px] text-white/55">
                                {contact.relationship}
                                {multiGuardians ? ' · principal' : ''}
                              </span>
                            ) : multiGuardians ? (
                              <span className="text-[9px] text-white/55">Principal</span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/85">
                              <Phone className="h-2.5 w-2.5 shrink-0 text-amber-300" />
                              {displayOrDash(contact.phone)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {multiGuardians ? (
                      <p className="mt-1.5 text-center text-[9px] leading-snug text-white/55">
                        Demais contatos e telefones no verso da carteirinha
                      </p>
                    ) : null}
                  </div>
                )}

                <div
                  className={cn(
                    'mt-2 w-full rounded-lg border px-2 font-medium',
                    isDense ? 'py-1 text-[8px]' : 'py-1.5 text-[9px]',
                    imageConsentOk
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/15 bg-white/5 text-white/60',
                  )}
                >
                  LGPD · {imageConsentLabel(imageConsent)}
                </div>

                {showLinkedStudents && primaryLinked ? (
                  <div
                    className={cn(
                      'mt-2 w-full rounded-xl border backdrop-blur-sm',
                      isDense ? 'px-2.5 py-1.5' : 'px-2.5 py-2',
                      theme.infoBox,
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <GraduationCap className={cn('h-2.5 w-2.5 shrink-0', theme.accentSoft)} />
                        <span
                          className={cn(
                            'text-[8px] font-semibold uppercase tracking-wide',
                            theme.accentText,
                          )}
                        >
                          {linkedStudents.length > 1
                            ? `${linkedStudents.length} alunos`
                            : 'Aluno vinculado'}
                        </span>
                      </div>
                      {extraLinkedCount > 0 ? (
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[8px] text-white/70">
                          +{extraLinkedCount} no verso
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] font-medium leading-snug text-white">
                      {primaryLinked.full_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/85">
                      Matrícula {displayOrDash(primaryLinked.registration_number)}
                    </p>
                  </div>
                ) : null}

                <div
                  className={cn(
                    'mt-auto flex w-full shrink-0 items-end justify-between border-t border-white/10',
                    isDense ? 'pt-2' : 'pt-3',
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-white/45">
                      Validade — território brasileiro
                    </p>
                    <p className={cn('font-mono text-sm font-bold', theme.accentSoft)}>
                      {formatDate(profile.valid_until)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1',
                      status.glowClass,
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        status.color,
                        status.active && 'animate-pulse',
                      )}
                    />
                    <span className="text-[10px] font-semibold text-white">{status.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verso */}
          <div
            className="id-card-face id-card-back absolute inset-0 h-full w-full overflow-hidden rounded-[1.35rem] shadow-2xl"
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className={cn('absolute inset-0', theme.backBg)} />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className={cn('absolute inset-0 opacity-35', theme.mesh)} />

            <div
              className={cn(
                'relative z-10 flex h-full flex-col items-center overflow-y-auto overscroll-contain p-5 sm:p-6',
                cardHeightClass,
              )}
            >
              <div className="w-full shrink-0 pt-0.5 text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <img src="/brand-logo.png" alt="" className="h-7 w-7 object-contain" />
                  <span
                    className={cn(
                      'text-sm font-bold uppercase tracking-[0.14em]',
                      theme.accentSoft,
                    )}
                  >
                    Banda Marcial
                  </span>
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                  {meta.title}
                </p>
                <p className="mt-1 text-[10px] text-white/40">{meta.subtitle}</p>
              </div>

              <div
                className={cn(
                  'shrink-0 rounded-2xl bg-white shadow-inner ring-1 ring-black/5',
                  multiGuardians || linkedStudents.length > 1 ? 'my-3 p-2.5' : 'my-4 p-3.5',
                )}
              >
                <VerifyQrCode
                  value={verifyUrl}
                  size={multiGuardians || linkedStudents.length > 1 ? 132 : 160}
                />
              </div>

              <div className="mt-auto w-full shrink-0 space-y-2.5 pb-1">
                <p className="text-center text-[10px] leading-relaxed text-white/65 sm:text-[11px]">
                  Escaneie o QR Code para validar a autenticidade desta carteirinha.
                </p>
                {showGuardian && emergencyContacts.length > 0 && (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5">
                    <p className="text-center text-[8px] font-semibold uppercase tracking-wide text-amber-200">
                      {emergencyContacts.length > 1
                        ? `Contatos de emergência (${emergencyContacts.length})`
                        : 'Contato de emergência'}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {emergencyContacts.map((contact, index) => (
                        <li
                          key={`back-${contact.name}-${contact.phone}-${index}`}
                          className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 break-words text-[11px] font-medium leading-snug text-white">
                              {contact.name}
                            </p>
                            {index === 0 ? (
                              <span className="shrink-0 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-amber-100">
                                Principal
                              </span>
                            ) : null}
                          </div>
                          {contact.relationship ? (
                            <p className="mt-0.5 text-[9px] text-white/55">{contact.relationship}</p>
                          ) : null}
                          <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-white/90">
                            <Phone className="h-3 w-3 shrink-0 text-amber-300" />
                            {displayOrDash(contact.phone)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-xl border px-3 py-2 text-center text-[10px]',
                    imageConsentOk
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/15 bg-white/5 text-white/65',
                  )}
                >
                  <p className="font-semibold uppercase tracking-wide">
                    {imageConsentLabel(imageConsent)}
                  </p>
                  <p className="mt-1 text-[9px] leading-relaxed opacity-80">
                    Uso de imagem/voz conforme LGPD (Lei 13.709/2018). Revogável no portal.
                  </p>
                </div>
                {showLinkedStudents ? (
                  <div className={cn('rounded-xl border px-3 py-2.5', theme.infoBox)}>
                    <p
                      className={cn(
                        'text-center text-[8px] font-semibold uppercase tracking-wide',
                        theme.accentText,
                      )}
                    >
                      {linkedStudents.length > 1
                        ? `Alunos vinculados (${linkedStudents.length})`
                        : 'Aluno vinculado'}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {linkedStudents.map((student) => (
                        <li
                          key={`${student.registration_number}-${student.full_name}`}
                          className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-left"
                        >
                          <p className="break-words text-[11px] font-medium leading-snug text-white">
                            {student.full_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-white/80">
                            Matrícula {displayOrDash(student.registration_number)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="border-t border-white/10 pt-2.5 text-center">
                  <p className="text-[8px] leading-relaxed text-white/45 sm:text-[9px]">
                    Identificação institucional da Banda Marcial de Botucatu.
                    <br />
                    Válida em todo o território brasileiro. Documento pessoal e intransferível.
                    Não substitui RG, CIN ou documento oficial de identidade.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/35">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[8px] uppercase tracking-widest">Verificação digital</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="no-print mt-7 flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCcw className="h-3.5 w-3.5" /> Toque para virar
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsFlipped(false)
              setTimeout(() => window.print(), 100)
            }}
            className="no-print border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
        </div>
      )}
    </div>
  )
}
