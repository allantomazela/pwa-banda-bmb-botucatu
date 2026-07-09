import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
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
  type LucideIcon,
} from 'lucide-react'

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
    <div className="bg-white/5 rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 text-primary shrink-0" />
        <span className="text-[8px] text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <p className="text-[10px] font-medium text-white truncate font-mono">{value}</p>
    </div>
  )
}

export default function DigitalId() {
  const { profile } = useAuth()
  const [isFlipped, setIsFlipped] = useState(false)

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const verifyUrl = `${window.location.origin}/verify?id=${profile.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=200x200`
  const avatarSrc =
    profile.avatar_url || `https://img.usecurling.com/ppl/medium?gender=male&seed=${profile.id}`
  const cityUF = [profile.city, profile.state].filter(Boolean).join('/') || '—'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display mb-1">Carteirinha Digital</h1>
        <p className="text-sm text-muted-foreground">Toque no cartão para ver o verso</p>
      </div>

      <div
        className="relative w-full max-w-[340px] aspect-[5/8] perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            'w-full h-full relative transition-transform duration-700 transform-style-3d',
            isFlipped ? 'rotate-y-180' : '',
          )}
        >
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-[#1B263B] to-[#0A101D] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="h-14 bg-primary relative flex items-center justify-center">
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-[#1B263B]" strokeWidth={2.5} />
                <span className="font-display font-black text-lg text-[#1B263B] tracking-widest uppercase">
                  Banda BMB
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center pt-4 px-4 relative z-10">
              <div className="w-20 h-20 rounded-full border-2 border-primary/80 overflow-hidden mb-3 shadow-xl bg-card">
                <img
                  src={avatarSrc}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.usecurling.com/ppl/medium?gender=male&seed=${profile.id}`
                  }}
                />
              </div>

              <h2 className="text-base font-bold text-white text-center w-full truncate mb-3">
                {profile.full_name}
              </h2>

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
                <div className="w-full mt-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Accessibility className="w-2.5 h-2.5 text-primary shrink-0" />
                    <span className="text-[8px] text-primary uppercase tracking-wide font-semibold">
                      Acessibilidade
                    </span>
                  </div>
                  <p className="text-[9px] text-white/90 leading-tight">
                    {profile.disability_info}
                  </p>
                </div>
              )}

              <div className="mt-auto mb-3 w-full pt-2 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide">
                    Validade
                  </p>
                  <p className="text-xs font-mono text-primary font-bold">
                    {formatDate(profile.valid_until)}
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-primary/60" />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-[#2B3950] to-[#1B263B] rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-between p-6">
            <div className="w-full text-center pt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Music2 className="w-5 h-5 text-primary" />
                <span className="font-display font-bold text-sm text-primary tracking-widest uppercase">
                  Banda BMB
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Carteira de Identificação
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-inner">
              <img
                src={qrCodeUrl}
                alt="QR Code de verificação"
                className="w-36 h-36 opacity-90 mix-blend-multiply"
              />
            </div>

            <div className="w-full space-y-2">
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Escaneie o QR Code para validar a autenticidade desta carteirinha.
              </p>
              <div className="w-full border-t border-white/10 pt-2 text-center">
                <p className="text-[9px] text-muted-foreground leading-tight">
                  Documento estritamente pessoal e intransferível.
                  <br />
                  Uso restrito a membros ativos da Banda BMB - Botucatu/SP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center text-xs text-muted-foreground gap-1.5 animate-pulse">
        <RefreshCcw className="w-3.5 h-3.5" /> Toque para virar
      </div>
    </div>
  )
}
