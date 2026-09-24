import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  Maximize2,
  X,
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

/** Evita mostrar blocos “Nenhuma / N/A” como se fossem informação útil. */
function hasMeaningfulInfo(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  if (!v) return false
  return !/^(nenhuma|nenhum|n\/a|na|nao|não|-|—|\.|sem)$/i.test(v)
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
      borderClass: 'ring-emerald-500/35',
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
  if (len <= 26) return 'text-[15px]'
  if (len <= 35) return 'text-sm'
  if (len <= 45) return 'text-xs'
  return 'text-[11px]'
}

function InfoCell({
  icon: Icon,
  label,
  value,
  accentClass,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  accentClass: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2',
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={cn('h-3 w-3 shrink-0 opacity-90', accentClass)} />
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
      </div>
      <p
        className="break-words font-sans text-[11px] font-semibold leading-snug text-white"
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
  /**
   * Quando true, o toque vira a carteirinha (modo já ampliado).
   * Quando false (padrão), o toque abre a visualização em tela cheia.
   */
  isFullscreenView?: boolean
  /** Permite abrir overlay fullscreen (desligado no card interno do overlay). */
  enableFullscreen?: boolean
}

export function DigitalIdCard({
  profile,
  linkedStudents = [],
  showActions = true,
  className,
  isFullscreenView = false,
  enableFullscreen = true,
}: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [photoBroken, setPhotoBroken] = useState(false)
  const historyPushedRef = useRef(false)

  const canOpenFullscreen = enableFullscreen && !isFullscreenView
  const flipOnTap = isFullscreenView || !enableFullscreen

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
  const showAccessibility = hasMeaningfulInfo(profile.disability_info)
  // Altura pelo conteúdo (grid 3D); página faz scroll — evita “cortar” o topo no Android
  const cardShellClass = 'min-h-[22rem]'

  useEffect(() => {
    setPhotoBroken(false)
  }, [profile.avatar_url])

  useEffect(() => {
    if (!fullscreen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreen(false)
        if (historyPushedRef.current) {
          historyPushedRef.current = false
          window.history.back()
        }
      }
    }

    window.history.pushState({ bmbIdCardFs: true }, '')
    historyPushedRef.current = true

    const onPopState = () => {
      historyPushedRef.current = false
      setFullscreen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', onPopState)
    }
  }, [fullscreen])

  function closeFullscreen() {
    setFullscreen(false)
    if (historyPushedRef.current) {
      historyPushedRef.current = false
      window.history.back()
    }
  }

  function handleCardActivate() {
    if (flipOnTap) {
      setIsFlipped((prev) => !prev)
      return
    }
    if (canOpenFullscreen) {
      setFullscreen(true)
    }
  }

  const cardAriaLabel = flipOnTap
    ? `${meta.title} de ${profile.full_name}. Toque para ${isFlipped ? 'ver a frente' : 'ver o verso'}.`
    : `${meta.title} de ${profile.full_name}. Toque para ampliar em tela cheia.`

  const fullscreenOverlay =
    fullscreen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="id-card-fs-overlay fixed inset-0 z-[80] flex flex-col bg-[#0a1018]/96 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Carteirinha em tela cheia"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))]">
              <p className="min-w-0 truncate text-sm font-medium text-white/80">
                Toque na carteirinha para virar
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full text-white hover:bg-white/10"
                aria-label="Fechar tela cheia"
                onClick={closeFullscreen}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto overscroll-contain px-3 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-2 [-webkit-overflow-scrolling:touch]">
              <DigitalIdCard
                profile={profile}
                linkedStudents={linkedStudents}
                showActions={false}
                isFullscreenView
                enableFullscreen={false}
                className="w-full max-w-[min(100%,420px)]"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-5 min-h-11 w-full max-w-[min(100%,420px)] border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={closeFullscreen}
              >
                Fechar
              </Button>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div
        className={cn(
          'printable-id id-card-perspective relative w-full max-w-[340px] cursor-pointer select-none sm:max-w-[360px]',
          isFullscreenView && 'max-w-[min(100%,420px)] sm:max-w-[min(100%,420px)]',
          cardShellClass,
          theme.variantClass,
        )}
        onClick={handleCardActivate}
        role="button"
        tabIndex={0}
        aria-label={cardAriaLabel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardActivate()
          }
        }}
      >
        <div
          className={cn(
            'id-card-inner relative h-full w-full',
            cardShellClass,
            isFlipped && 'flipped',
          )}
        >
          {/* Frente */}
          <div
            className={cn(
              'id-card-face flex h-full min-h-full w-full flex-col overflow-hidden rounded-2xl ring-1',
              status.borderClass,
            )}
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className={cn('absolute inset-0', theme.faceBg)} />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className={cn('absolute inset-0 opacity-35', theme.mesh)} />
            <div
              className={cn(
                'absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl',
                theme.glowA,
              )}
            />
            <div
              className={cn(
                'absolute -bottom-12 -left-8 h-28 w-28 rounded-full blur-3xl',
                theme.glowB,
              )}
            />

            <div className="relative z-10 flex min-h-full flex-col">
              <div
                className={cn(
                  'relative flex h-12 shrink-0 items-center justify-between overflow-hidden px-3.5 sm:px-4',
                  theme.header,
                )}
              >
                <div className="absolute inset-0 id-card-shimmer" />
                <div className="relative z-10 flex min-w-0 items-center gap-2">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#1B263B] shadow-md ring-1 ring-white/20">
                    <img
                      src="/brand-logo.png"
                      alt="Brasão da Banda Marcial de Botucatu"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1B263B]/85">
                      Banda Marcial
                    </p>
                    <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#1B263B]">
                      {meta.badge}
                    </p>
                  </div>
                </div>
                <BadgeIcon className="relative z-10 h-5 w-5 shrink-0 text-[#1B263B]/65" />
              </div>

              <div className="flex flex-1 flex-col items-center px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3.5">
                <div className="relative mb-2.5 shrink-0">
                  <div
                    className={cn(
                      'absolute -inset-[2px] rounded-[0.95rem] opacity-90 blur-[0.5px]',
                      theme.photoRing,
                    )}
                  />
                  <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-[0.85rem] border border-white/25 bg-zinc-950 shadow-lg sm:h-20 sm:w-20">
                    {showPhoto ? (
                      <img
                        src={avatarSrc}
                        alt={`Foto de ${profile.full_name}`}
                        className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                        onError={() => setPhotoBroken(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900/90 px-2 text-center">
                        <UserRound className="h-7 w-7 text-white/35" aria-hidden />
                        <span className="text-[8px] font-medium uppercase tracking-wide text-white/45">
                          Sem foto
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <h2
                  className={cn(
                    'mb-1.5 w-full break-words text-center font-display font-extrabold leading-snug text-white hyphens-auto',
                    nameFontSize,
                  )}
                  style={{ textWrap: 'balance' as const }}
                >
                  {profile.full_name}
                </h2>

                <div
                  className={cn(
                    'mb-3 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1',
                    theme.chip,
                  )}
                >
                  <BadgeCheck className={cn('h-3 w-3 shrink-0', theme.accentSoft)} />
                  <span
                    className={cn(
                      'truncate text-[9px] font-bold uppercase tracking-[0.12em]',
                      theme.accentText,
                    )}
                  >
                    {meta.badge} · Botucatu/SP
                  </span>
                </div>

                <div className="grid w-full grid-cols-2 gap-1.5">
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
                  {!showGuardian ? (
                    <InfoCell
                      icon={Phone}
                      label="Telefone"
                      value={displayOrDash(profile.phone)}
                      accentClass={theme.accentSoft}
                      className="col-span-2"
                    />
                  ) : null}
                </div>

                {showAccessibility ? (
                  <div
                    className={cn(
                      'mt-1.5 w-full rounded-lg border px-2.5 py-2',
                      theme.infoBox,
                    )}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <Accessibility className={cn('h-3 w-3 shrink-0', theme.accentSoft)} />
                      <span
                        className={cn(
                          'text-[9px] font-semibold uppercase tracking-[0.14em]',
                          theme.accentText,
                        )}
                      >
                        Acessibilidade
                      </span>
                    </div>
                    <p className="break-words text-[11px] font-medium leading-snug text-white/90">
                      {profile.disability_info}
                    </p>
                  </div>
                ) : null}

                {showGuardian && frontGuardians.length > 0 ? (
                  <div
                    className={cn(
                      'mt-1.5 w-full rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 py-2',
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0 text-amber-300" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
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
                    <ul className={cn(multiGuardians ? 'space-y-0' : 'space-y-1.5')}>
                      {frontGuardians.map((contact) => (
                        <li
                          key={`${contact.name}-${contact.phone}`}
                          className="min-w-0 rounded-md bg-black/20 px-2 py-1.5"
                        >
                          <p className="truncate text-[11px] font-semibold leading-snug text-white">
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
                        Demais contatos no verso
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={cn(
                    'mt-1.5 flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-medium',
                    imageConsentOk
                      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/12 bg-white/5 text-white/65',
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      imageConsentOk ? 'text-emerald-300' : 'text-white/45',
                    )}
                  />
                  <span>LGPD · {imageConsentLabel(imageConsent)}</span>
                </div>

                {showLinkedStudents && primaryLinked ? (
                  <div
                    className={cn(
                      'mt-1.5 w-full rounded-lg border px-2.5 py-2',
                      theme.infoBox,
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <GraduationCap className={cn('h-3 w-3 shrink-0', theme.accentSoft)} />
                        <span
                          className={cn(
                            'text-[9px] font-semibold uppercase tracking-[0.14em]',
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
                    <p className="truncate text-[11px] font-semibold leading-snug text-white">
                      {primaryLinked.full_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/75">
                      Matrícula {displayOrDash(primaryLinked.registration_number)}
                    </p>
                  </div>
                ) : null}

                <div className="mt-3 flex w-full shrink-0 items-end justify-between border-t border-white/10 pt-2.5">
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/55">
                      Validade
                    </p>
                    <p className={cn('font-mono text-sm font-bold tabular-nums', theme.accentSoft)}>
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
            className="id-card-face id-card-back h-full w-full overflow-hidden rounded-[1.35rem]"
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
            aria-hidden={!isFlipped}
          >
            <div className={cn('absolute inset-0', theme.backBg)} />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className={cn('absolute inset-0 opacity-35', theme.mesh)} />

            <div className="relative z-10 flex min-h-full flex-1 flex-col items-center overflow-y-auto overscroll-contain p-4 sm:p-5">
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
        <div className="no-print mt-5 flex w-full max-w-[340px] flex-col items-center gap-3 sm:mt-6 sm:max-w-[360px] sm:gap-4">
          {canOpenFullscreen ? (
            <>
              <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
                <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                Toque na carteirinha para ampliar
              </p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full border-white/10 bg-white/10 text-foreground hover:bg-white/15"
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="mr-2 h-4 w-4" /> Ampliar
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCcw className="h-3.5 w-3.5" /> Toque para virar
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setIsFlipped(false)
              setTimeout(() => window.print(), 100)
            }}
            className="no-print min-h-11 w-full border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
        </div>
      )}

      {fullscreenOverlay}
    </div>
  )
}
