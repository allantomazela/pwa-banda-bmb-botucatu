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

const roleLabels: Record<string, string> = {
  member: 'Músico',
  admin: 'Administrador',
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
  if (len <= 18) return 'text-base'
  if (len <= 26) return 'text-sm'
  if (len <= 35) return 'text-[13px]'
  if (len <= 45) return 'text-xs'
  return 'text-[11px]'
}

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5 min-w-0 overflow-hidden">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
        <span className="text-[8px] text-slate-400 uppercase tracking-wide truncate">{label}</span>
      </div>
      <p
        className="text-[10px] font-medium text-white font-mono break-words leading-tight"
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

  const verifyUrl = `${window.location.origin}/verify?id=${profile.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=200x200`
  const avatarSrc =
    profile.avatar_url ||
    `https://img.usecurling.com/ppl/large?gender=male&seed=${profile.id}&dpr=2`
  const cityUF = [profile.city, profile.state].filter(Boolean).join('/') || '—'
  const status = getStatus(profile.valid_until)
  const roleLabel = roleLabels[profile.role] || profile.role || 'Membro'
  const nameFontSize = useMemo(() => getNameFontSize(profile.full_name), [profile.full_name])

  return (
    <div className={cn('flex flex-col items-center w-full', className)}>
      <div
        className="printable-id id-card-perspective relative w-full max-w-[340px] min-h-[540px] cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label={`Carteirinha digital de ${profile.full_name}. Toque para ${isFlipped ? 'ver a frente' : 'ver o verso'}.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsFlipped(!isFlipped)
          }
        }}
      >
        <div
          className={cn(
            'id-card-inner w-full h-full min-h-[540px] relative',
            isFlipped && 'flipped',
          )}
        >
          {/* Front face */}
          <div
            className={cn(
              'id-card-face absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1',
              status.borderClass,
            )}
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B263B] via-[#15203A] to-[#0A101D]" />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-amber-500/5 blur-xl" />

            <div className="relative z-10 h-full min-h-[540px] flex flex-col">
              <div className="h-14 bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-amber-600/90 backdrop-blur-sm relative flex items-center justify-center shrink-0 overflow-hidden">
                <div className="absolute inset-0 id-card-shimmer" />
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-[#1B263B] flex items-center justify-center shadow-md">
                    <Music2 className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-base text-[#1B263B] tracking-widest uppercase">
                    Banda BMB
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center pt-3 px-3 pb-2 overflow-hidden">
                <div className="relative mb-2 shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400/50 to-amber-300/30 blur-[2px]" />
                  <div className="relative w-20 h-20 rounded-full border-2 border-white/30 overflow-hidden shadow-xl bg-card">
                    <img
                      src={avatarSrc}
                      alt={`Foto de ${profile.full_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://img.usecurling.com/ppl/large?gender=male&seed=${profile.id}&dpr=2`
                      }}
                    />
                  </div>
                </div>

                <h2
                  className={cn(
                    'font-bold text-white text-center w-full mb-0.5 leading-tight break-words hyphens-auto',
                    nameFontSize,
                  )}
                  style={{ textWrap: 'balance' as const }}
                >
                  {profile.full_name}
                </h2>

                <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5 mb-2 shrink-0 max-w-full overflow-hidden">
                  <BadgeCheck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="text-[9px] text-amber-300 font-semibold uppercase tracking-wide truncate">
                    {roleLabel}
                  </span>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5">
                  <InfoCell
                    icon={Music2}
                    label="Instrumento"
                    value={displayOrDash(profile.instrument)}
                  />
                  <InfoCell
                    icon={Hash}
                    label="Matrícula"
                    value={displayOrDash(profile.registration_number)}
                  />
                  <InfoCell icon={MapPin} label="Cidade/UF" value={cityUF} />
                  <InfoCell
                    icon={CalendarDays}
                    label="Nascimento"
                    value={formatDate(profile.birth_date)}
                  />
                  <InfoCell icon={CreditCard} label="CPF" value={displayOrDash(profile.cpf)} />
                  <InfoCell icon={IdCard} label="RG" value={displayOrDash(profile.rg)} />
                </div>

                {profile.disability_info && profile.disability_info.trim() !== '' && (
                  <div className="w-full mt-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Accessibility className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="text-[8px] text-amber-300 uppercase tracking-wide font-semibold">
                        Acessibilidade
                      </span>
                    </div>
                    <p className="text-[9px] text-white/90 leading-tight break-words">
                      {profile.disability_info}
                    </p>
                  </div>
                )}

                <div className="mt-auto w-full pt-2 border-t border-white/10 flex justify-between items-end shrink-0">
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 uppercase tracking-wide">Expira em</p>
                    <p className="text-xs font-mono text-amber-400 font-bold">
                      {formatDate(profile.valid_until)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 bg-white/5 rounded-full px-2 py-0.5 border border-white/10 shrink-0',
                      status.glowClass,
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        status.color,
                        status.active && 'animate-pulse',
                      )}
                    />
                    <span className="text-[9px] font-semibold text-white">{status.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back face */}
          <div
            className="id-card-face id-card-back absolute inset-0 w-full h-full min-h-[540px] rounded-2xl overflow-hidden shadow-2xl"
            style={
              { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties
            }
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2B3950] via-[#1B263B] to-[#0A101D]" />
            <div className="absolute inset-0 id-holo-pattern" />
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />

            <div className="relative z-10 h-full min-h-[540px] flex flex-col items-center justify-between p-6">
              <div className="w-full text-center pt-2 shrink-0">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Music2 className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm text-amber-400 tracking-widest uppercase">
                    Banda BMB
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Carteira de Identificação
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl shadow-inner shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="QR Code de verificação"
                  className="w-36 h-36 opacity-90 mix-blend-multiply"
                />
              </div>

              <div className="w-full space-y-2 shrink-0">
                <p className="text-[11px] text-center text-slate-300 leading-relaxed">
                  Escaneie o QR Code para validar a autenticidade desta carteirinha.
                </p>
                <div className="w-full border-t border-white/10 pt-2 text-center">
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Documento estritamente pessoal e intransferível.
                    <br />
                    Uso restrito a membros ativos da Banda BMB - Botucatu/SP.
                  </p>
                </div>
                <div className="flex justify-center pt-1">
                  <ShieldCheck className="w-4 h-4 text-amber-400/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="mt-6 flex flex-col items-center gap-4 no-print">
          <div className="flex items-center text-xs text-muted-foreground gap-1.5 animate-pulse">
            <RefreshCcw className="w-3.5 h-3.5" /> Toque para virar
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsFlipped(false)
              setTimeout(() => window.print(), 100)
            }}
            className="no-print"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir / Salvar PDF
          </Button>
        </div>
      )}
    </div>
  )
}
