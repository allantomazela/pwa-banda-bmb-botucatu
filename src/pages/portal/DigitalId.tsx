import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { RefreshCcw } from 'lucide-react'

export default function DigitalId() {
  const { user } = useAuth()
  const [isFlipped, setIsFlipped] = useState(false)

  if (!user) return null

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-display mb-2">Carteira Digital</h1>
        <p className="text-muted-foreground">Toque no cartão para ver o verso</p>
      </div>

      <div
        className="relative w-full max-w-[340px] aspect-[5/8] perspective-1000 cursor-pointer group"
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
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

            <div className="h-24 bg-primary relative flex items-center justify-center">
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="font-display font-black text-2xl text-[#1B263B] tracking-widest uppercase">
                Banda BMB
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center pt-6 px-6 relative z-10">
              <div className="w-32 h-32 rounded-full border-4 border-primary overflow-hidden mb-6 shadow-xl bg-card">
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-xl font-bold text-white text-center w-full truncate">
                {user.full_name}
              </h2>
              <p className="text-primary font-medium mt-1 uppercase tracking-wider text-sm">
                {user.instrument}
              </p>

              <div className="mt-auto mb-6 w-full pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Matrícula</p>
                  <p className="text-sm font-mono text-white">{user.enrollment_id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase text-right">Validade</p>
                  <p className="text-sm font-mono text-white">12/2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-[#2B3950] to-[#1B263B] rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8">
            <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
              {/* Mock QR Code using an image placeholder */}
              <img
                src="https://img.usecurling.com/i?q=qr-code&shape=outline&color=solid-black&size=150"
                alt="QR Code"
                className="w-40 h-40 opacity-80 mix-blend-multiply"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Este código é para uso interno e validação de presença.
            </p>
            <div className="w-full border-t border-white/10 pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Documento estritamente pessoal e intransferível.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center text-sm text-muted-foreground gap-2 animate-pulse">
        <RefreshCcw className="w-4 h-4" /> Toque para virar
      </div>
    </div>
  )
}
