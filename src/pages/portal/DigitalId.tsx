import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { RefreshCcw, ShieldCheck, Music2, CalendarDays, Hash } from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--/--/----'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '--/--/----'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-[#1B263B] to-[#0A101D] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="h-20 bg-primary relative flex items-center justify-center">
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="flex items-center gap-2">
                <Music2 className="w-6 h-6 text-[#1B263B]" strokeWidth={2.5} />
                <span className="font-display font-black text-xl sm:text-2xl text-[#1B263B] tracking-widest uppercase">
                  Banda BMB
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center pt-5 px-5 relative z-10">
              <div className="w-28 h-28 rounded-full border-4 border-primary/80 overflow-hidden mb-4 shadow-xl bg-card">
                <img
                  src={avatarSrc}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-lg font-bold text-white text-center w-full truncate">
                {profile.full_name}
              </h2>

              <div className="mt-3 w-full space-y-2">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <Music2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-16">
                    Instrumento
                  </span>
                  <span className="text-xs font-medium text-white ml-auto truncate">
                    {profile.instrument || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-16">
                    Matrícula
                  </span>
                  <span className="text-xs font-mono text-white ml-auto truncate">
                    {profile.registration_number || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-16">
                    Nascimento
                  </span>
                  <span className="text-xs font-mono text-white ml-auto">
                    {formatDate(profile.birth_date)}
                  </span>
                </div>
              </div>

              <div className="mt-auto mb-4 w-full pt-3 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Validade
                  </p>
                  <p className="text-sm font-mono text-primary font-bold">
                    {formatDate(profile.valid_until)}
                  </p>
                </div>
                <ShieldCheck className="w-6 h-6 text-primary/60" />
              </div>
            </div>
          </div>

          {/* Back */}
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
