import { useAuth } from '@/hooks/use-auth'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { IdCard } from 'lucide-react'

export default function DigitalId() {
  const { profile } = useAuth()

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

  const isProfessor = profile.role === 'admin'
  const title = isProfessor ? 'Carteirinha de Professor' : 'Carteirinha de Aluno'
  const subtitle = isProfessor
    ? 'Identificação oficial do corpo docente da Banda BMB'
    : 'Identificação oficial do aluno músico da Banda BMB'

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-3 py-8 animate-fade-in sm:px-4">
      <div
        className={`pointer-events-none absolute inset-0 ${
          isProfessor
            ? 'bg-[radial-gradient(ellipse_at_top,rgba(251,192,45,0.12),transparent_55%)]'
            : 'bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]'
        }`}
      />
      <div className="no-print relative mb-8 w-full max-w-[360px] text-center">
        <div
          className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${
            isProfessor ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'
          }`}
        >
          <IdCard className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-2 text-xs text-muted-foreground/80">Toque no cartão para ver o verso</p>
      </div>
      <div className="relative w-full max-w-[360px] flex justify-center">
        <DigitalIdCard profile={profile} />
      </div>
    </div>
  )
}
