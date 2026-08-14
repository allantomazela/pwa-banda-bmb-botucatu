import { useState, useMemo } from 'react'
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
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
}

type CardVariant = 'aluno' | 'professor'

function resolveVariant(role: string): CardVariant {
  return role === 'admin' ? 'professor' : 'aluno'
}

const variantMeta: Record<
  CardVariant,
  {
    title: string
    subtitle: string
    badge: string
    BadgeIcon: LucideIcon
  }
> = {
  aluno: {
    title: 'Carteira de Aluno',
    subtitle: 'Identificação de músico em formação',
    badge: 'Aluno',
    BadgeIcon: GraduationCap,
  },
  professor: {
    title: 'Carteira de Professor',
    subtitle: 'Identificação de corpo docente',
    badge: 'Professor',
    BadgeIcon: Award,
  },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--/--/----'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '--/--/----'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
  const expiry = new Date(validUntil)
  const now = new Date()
  if (expiry > now)
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
  showActions?: boolean
  className?: string
}

export function DigitalIdCard({ profile, showActions = true, className }: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const variant = resolveVariant(profile.role)
  const meta = variantMeta[variant]
  const BadgeIcon = meta.BadgeIcon

  const verifyUrl = `${window.location.origin}/verify?id=${profile.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=200x200`
  const avatarSrc =
    profile.avatar_url ||
    `https://img.usecurling.com/ppl/large?gender=male&seed=${profile.id}&dpr=2`
  const cityUF = [profile.city, profile.state].filter(Boolean).join('/') || '—'
  const status = getStatus(profile.valid_until)
  const nameFontSize = useMemo(() => getNameFontSize(profile.full_name), [profile.full_name])

  const isProfessor = variant === 'professor'
  const accentText = isProfessor ? 'text-amber-300' : 'text-sky-300'
  const accentSoft = isProfessor ? 'text-amber-400' : 'text-sky-400'

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div
        className={cn(
          'printable-id id-card-perspective relative w-full max-w-[360px] min-h-[560px] cursor-pointer select-none',
          isProfessor ? 'id-variant-professor' : 'id-variant-aluno',
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
            'id-card-inner relative h-full min-h-[560px] w-full',
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
            <div
              className={cn(
                'absolute inset-0',
                isProfessor
                  ? 'bg-gradient-to-br from-[#2a2110] via-[#1B263B] to-[#0A101D]'
                  : 'bg-gradient-to-br from-[#12263f] via-[#1B263B] to-[#071018]',
              )}
            />
            <div className="absolute inset-0 id-holo-pattern" />
            <div
              className={cn(
                'absolute inset-0 opacity-40',
                isProfessor ? 'id-mesh-professor' : 'id-mesh-aluno',
              )}
            />
            <div
              className={cn(
                'absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl',
                isProfessor ? 'bg-amber-400/20' : 'bg-sky-400/15',
              )}
            />
            <div
              className={cn(
                'absolute -bottom-12 -left-8 h-32 w-32 rounded-full blur-3xl',
                isProfessor ? 'bg-amber-600/15' : 'bg-cyan-500/10',
              )}
            />

            <div className="relative z-10 flex h-full min-h-[560px] flex-col">
              <div
                className={cn(
                  'relative flex h-16 shrink-0 items-center justify-between overflow-hidden px-4',
                  isProfessor
                    ? 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-sky-700 via-sky-500 to-cyan-500',
                )}
              >
                <div className="absolute inset-0 id-card-shimmer" />
                <div className="relative z-10 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B263B] shadow-md ring-1 ring-white/20">
                    <Music2
                      className={cn('h-4 w-4', isProfessor ? 'text-amber-300' : 'text-sky-300')}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1B263B]/90">
                      Banda BMB
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
                      isProfessor
                        ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700'
                        : 'bg-gradient-to-br from-sky-300 via-cyan-400 to-sky-700',
                    )}
                  />
                  <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-[1rem] border border-white/25 bg-card shadow-xl">
                    <img
                      src={avatarSrc}
                      alt={`Foto de ${profile.full_name}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://img.usecurling.com/ppl/large?gender=male&seed=${profile.id}&dpr=2`
                      }}
                    />
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
                    isProfessor
                      ? 'border-amber-400/35 bg-amber-500/15'
                      : 'border-sky-400/35 bg-sky-500/15',
                  )}
                >
                  <BadgeCheck className={cn('h-3 w-3 shrink-0', accentSoft)} />
                  <span
                    className={cn(
                      'truncate text-[10px] font-bold uppercase tracking-[0.14em]',
                      accentText,
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
                    accentClass={accentSoft}
                  />
                  <InfoCell
                    icon={Hash}
                    label="Matrícula"
                    value={displayOrDash(profile.registration_number)}
                    accentClass={accentSoft}
                  />
                  <InfoCell
                    icon={MapPin}
                    label="Cidade/UF"
                    value={cityUF}
                    accentClass={accentSoft}
                  />
                  <InfoCell
                    icon={CalendarDays}
                    label="Nascimento"
                    value={formatDate(profile.birth_date)}
                    accentClass={accentSoft}
                  />
                  <InfoCell
                    icon={CreditCard}
                    label="CPF"
                    value={displayOrDash(profile.cpf)}
                    accentClass={accentSoft}
                  />
                  <InfoCell
                    icon={IdCard}
                    label="RG"
                    value={displayOrDash(profile.rg)}
                    accentClass={accentSoft}
                  />
                </div>

                {profile.disability_info && profile.disability_info.trim() !== '' && (
                  <div
                    className={cn(
                      'mt-2 w-full rounded-xl border px-2.5 py-2 backdrop-blur-sm',
                      isProfessor
                        ? 'border-amber-400/25 bg-amber-500/10'
                        : 'border-sky-400/25 bg-sky-500/10',
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-1">
                      <Accessibility className={cn('h-2.5 w-2.5 shrink-0', accentSoft)} />
                      <span
                        className={cn(
                          'text-[8px] font-semibold uppercase tracking-wide',
                          accentText,
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

                <div className="mt-auto flex w-full shrink-0 items-end justify-between border-t border-white/10 pt-3">
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-white/45">
                      Validade — território brasileiro
                    </p>
                    <p className={cn('font-mono text-sm font-bold', accentSoft)}>
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
            className="id-card-face id-card-back absolute inset-0 h-full min-h-[560px] w-full overflow-hidden rounded-[1.35rem] shadow-2xl"
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div
              className={cn(
                'absolute inset-0',
                isProfessor
                  ? 'bg-gradient-to-br from-[#3a2e14] via-[#1B263B] to-[#0A101D]'
                  : 'bg-gradient-to-br from-[#1a3350] via-[#1B263B] to-[#0A101D]',
              )}
            />
            <div className="absolute inset-0 id-holo-pattern" />
            <div
              className={cn(
                'absolute inset-0 opacity-35',
                isProfessor ? 'id-mesh-professor' : 'id-mesh-aluno',
              )}
            />

            <div className="relative z-10 flex h-full min-h-[560px] flex-col items-center justify-between p-6">
              <div className="w-full shrink-0 pt-1 text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Music2 className={cn('h-5 w-5', accentSoft)} />
                  <span
                    className={cn(
                      'text-sm font-bold uppercase tracking-[0.2em]',
                      accentSoft,
                    )}
                  >
                    Banda BMB
                  </span>
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                  {meta.title}
                </p>
                <p className="mt-1 text-[10px] text-white/40">{meta.subtitle}</p>
              </div>

              <div className="shrink-0 rounded-2xl bg-white p-3.5 shadow-inner ring-1 ring-black/5">
                <img
                  src={qrCodeUrl}
                  alt="QR Code de verificação"
                  className="h-40 w-40 opacity-95 mix-blend-multiply"
                />
              </div>

              <div className="w-full shrink-0 space-y-3">
                <p className="text-center text-[11px] leading-relaxed text-white/70">
                  Escaneie o QR Code para validar a autenticidade desta carteirinha.
                </p>
                <div className="border-t border-white/10 pt-3 text-center">
                  <p className="text-[9px] leading-relaxed text-white/45">
                    Identificação institucional da Banda BMB — Botucatu/SP.
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
