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
  guardian_name: string | null
  guardian_phone: string | null
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
}: {
  icon: LucideIcon
  label: string
  value: string
  accentClass: string
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 backdrop-blur-sm">
      <div className="mb-0.5 flex items-center gap-1">
        <Icon className={cn('h-2.5 w-2.5 shrink-0', accentClass)} />
        <span className="truncate text-[8px] uppercase tracking-[0.12em] text-white/50">
          {label}
        </span>
      </div>
      <p
        className="break-words font-mono text-[10px] font-medium leading-tight text-white"
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

  const verifyUrl = `${window.location.origin}/verify?id=${profile.id}`
  const hasPhoto = hasProfilePhoto(profile.avatar_url)
  const avatarSrc = hasPhoto ? profile.avatar_url!.trim() : ''
  const cityUF = [profile.city, profile.state].filter(Boolean).join('/') || '—'
  const status = getStatus(profile.valid_until)
  const nameFontSize = useMemo(() => getNameFontSize(profile.full_name), [profile.full_name])
  const showGuardian = isMinor(profile.birth_date)
  const showLinkedStudents = variant === 'guardian' && linkedStudents.length > 0
  const primaryLinked = linkedStudents[0]
  const extraLinkedCount = Math.max(0, linkedStudents.length - 1)
  const showPhoto = hasPhoto && !photoBroken

  useEffect(() => {
    setPhotoBroken(false)
  }, [profile.avatar_url])

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div
        className={cn(
          'printable-id id-card-perspective relative w-full max-w-[360px] min-h-[clamp(30rem,85dvh,35rem)] cursor-pointer select-none',
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
            'id-card-inner relative h-full min-h-[clamp(30rem,85dvh,35rem)] w-full',
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

            <div className="relative z-10 flex h-full min-h-[clamp(30rem,85dvh,35rem)] flex-col">
              <div
                className={cn(
                  'relative flex h-16 shrink-0 items-center justify-between overflow-hidden px-4',
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

              <div className="flex flex-1 flex-col items-center overflow-hidden px-3.5 pb-3 pt-4">
                <div className="relative mb-3 shrink-0">
                  <div
                    className={cn(
                      'absolute -inset-[3px] rounded-[1.15rem] opacity-90 blur-[1px]',
                      theme.photoRing,
                    )}
                  />
                  <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-[1rem] border border-white/25 bg-card shadow-xl">
                    {showPhoto ? (
                      <img
                        src={avatarSrc}
                        alt={`Foto de ${profile.full_name}`}
                        className="h-full w-full object-cover"
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
                    'mb-3 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1',
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

                <div className="grid w-full grid-cols-2 gap-2">
                  <InfoCell
                    icon={Music2}
                    label="Instrumento"
                    value={displayOrDash(profile.instrument)}
                    accentClass={theme.accentSoft}
                  />
                  <InfoCell
                    icon={Hash}
                    label="Matrícula"
                    value={displayOrDash(profile.registration_number)}
                    accentClass={theme.accentSoft}
                  />
                  <InfoCell
                    icon={MapPin}
                    label="Cidade/UF"
                    value={cityUF}
                    accentClass={theme.accentSoft}
                  />
                  <InfoCell
                    icon={CalendarDays}
                    label="Nascimento"
                    value={formatDate(profile.birth_date)}
                    accentClass={theme.accentSoft}
                  />
                  <InfoCell
                    icon={CreditCard}
                    label="CPF"
                    value={displayOrDash(profile.cpf)}
                    accentClass={theme.accentSoft}
                  />
                  <InfoCell
                    icon={IdCard}
                    label="RG"
                    value={displayOrDash(profile.rg)}
                    accentClass={theme.accentSoft}
                  />
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

                {showGuardian && (
                  <div className="mt-2 w-full rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 backdrop-blur-sm">
                    <div className="mb-0.5 flex items-center gap-1">
                      <Users className="h-2.5 w-2.5 shrink-0 text-amber-300" />
                      <span className="text-[8px] font-semibold uppercase tracking-wide text-amber-200">
                        Responsável
                      </span>
                    </div>
                    <p className="break-words text-[10px] font-medium leading-tight text-white">
                      {displayOrDash(profile.guardian_name)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-white/85">
                      <Phone className="h-2.5 w-2.5 shrink-0 text-amber-300" />
                      {displayOrDash(profile.guardian_phone)}
                    </p>
                  </div>
                )}

                {showLinkedStudents && primaryLinked ? (
                  <div
                    className={cn(
                      'mt-2 w-full rounded-xl border px-2.5 py-2 backdrop-blur-sm',
                      theme.infoBox,
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-1">
                      <GraduationCap className={cn('h-2.5 w-2.5 shrink-0', theme.accentSoft)} />
                      <span
                        className={cn(
                          'text-[8px] font-semibold uppercase tracking-wide',
                          theme.accentText,
                        )}
                      >
                        {linkedStudents.length > 1 ? 'Alunos vinculados' : 'Aluno vinculado'}
                      </span>
                    </div>
                    <p className="break-words text-[10px] font-medium leading-tight text-white">
                      {primaryLinked.full_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/85">
                      Matrícula {displayOrDash(primaryLinked.registration_number)}
                    </p>
                    {extraLinkedCount > 0 ? (
                      <p className="mt-1 text-[9px] text-white/60">
                        +{extraLinkedCount} outro{extraLinkedCount > 1 ? 's' : ''} no verso
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto flex w-full shrink-0 items-end justify-between border-t border-white/10 pt-3">
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
            className="id-card-face id-card-back absolute inset-0 h-full min-h-[clamp(30rem,85dvh,35rem)] w-full overflow-hidden rounded-[1.35rem] shadow-2xl"
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className={cn('absolute inset-0', theme.backBg)} />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className={cn('absolute inset-0 opacity-35', theme.mesh)} />

            <div className="relative z-10 flex h-full min-h-[clamp(30rem,85dvh,35rem)] flex-col items-center justify-between p-6">
              <div className="w-full shrink-0 pt-1 text-center">
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

              <div className="shrink-0 rounded-2xl bg-white p-3.5 shadow-inner ring-1 ring-black/5">
                <VerifyQrCode value={verifyUrl} size={160} />
              </div>

              <div className="w-full shrink-0 space-y-3">
                <p className="text-center text-[11px] leading-relaxed text-white/70">
                  Escaneie o QR Code para validar a autenticidade desta carteirinha.
                </p>
                {showGuardian && (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center">
                    <p className="text-[8px] font-semibold uppercase tracking-wide text-amber-200">
                      Contato de emergência
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-white">
                      {displayOrDash(profile.guardian_name)}
                    </p>
                    <p className="font-mono text-[11px] text-white/85">
                      {displayOrDash(profile.guardian_phone)}
                    </p>
                  </div>
                )}
                {showLinkedStudents ? (
                  <div className={cn('rounded-xl border px-3 py-2 text-center', theme.infoBox)}>
                    <p
                      className={cn(
                        'text-[8px] font-semibold uppercase tracking-wide',
                        theme.accentText,
                      )}
                    >
                      {linkedStudents.length > 1 ? 'Alunos vinculados' : 'Aluno vinculado'}
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {linkedStudents.map((student) => (
                        <li key={`${student.registration_number}-${student.full_name}`}>
                          <p className="text-[11px] font-medium leading-tight text-white">
                            {student.full_name}
                          </p>
                          <p className="font-mono text-[10px] text-white/80">
                            {displayOrDash(student.registration_number)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="border-t border-white/10 pt-3 text-center">
                  <p className="text-[9px] leading-relaxed text-white/45">
                    Identificação institucional da Banda Marcial de Botucatu.
                    <br />
                    Válida em todo o território brasileiro para reconhecimento do integrante junto à
                    associação, até a data de validade.
                    <br />
                    Documento pessoal e intransferível. Não substitui RG, CIN ou outro documento
                    oficial de identidade.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-white/35">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[9px] uppercase tracking-widest">Verificação digital</span>
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
