import { useAuth } from '@/hooks/use-auth'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { IdCard } from 'lucide-react'
import { useEffect } from 'react'
import { ROLE_CARD_COPY, resolveCardVariant } from '@/lib/roles'

const pageGlow: Record<string, string> = {
  aluno: 'bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]',
  professor: 'bg-[radial-gradient(ellipse_at_top,rgba(251,192,45,0.12),transparent_55%)]',
  admin: 'bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.14),transparent_55%)]',
}

const iconTone: Record<string, string> = {
  aluno: 'bg-sky-500/15 text-sky-300',
  professor: 'bg-amber-500/15 text-amber-300',
  admin: 'bg-violet-500/15 text-violet-300',
}

export default function DigitalId() {
  const { profile, refreshProfile } = useAuth()

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const variant = resolveCardVariant(profile.role)
  const copy = ROLE_CARD_COPY[variant]

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-3 py-8 animate-fade-in sm:px-4">
      <div className={`pointer-events-none absolute inset-0 ${pageGlow[variant]}`} />
      <div className="no-print relative mb-8 w-full max-w-[360px] text-center">
        <div
          className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone[variant]}`}
        >
          <IdCard className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        <p className="mt-2 text-xs text-muted-foreground/80">Toque no cartão para ver o verso</p>
      </div>
      <div className="relative flex w-full max-w-[360px] justify-center">
        <DigitalIdCard profile={profile} />
      </div>
    </div>
  )
}
