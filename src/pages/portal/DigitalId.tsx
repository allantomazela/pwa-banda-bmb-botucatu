import { useAuth } from '@/hooks/use-auth'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { PwaInstallButton } from '@/components/PwaInstallButton'
import { IdCard } from 'lucide-react'
import { useEffect } from 'react'
import { ROLE_CARD_COPY, resolveCardVariant } from '@/lib/roles'
import { useFetch } from '@/hooks/use-fetch'
import {
  listMyLinkedStudents,
  type LinkedStudentSummary,
} from '@/services/guardian-links'

const pageGlow: Record<string, string> = {
  aluno: 'bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]',
  professor: 'bg-[radial-gradient(ellipse_at_top,rgba(251,192,45,0.12),transparent_55%)]',
  admin: 'bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.14),transparent_55%)]',
  support: 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]',
  guardian: 'bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.12),transparent_55%)]',
  honorary: 'bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_55%)]',
}

const iconTone: Record<string, string> = {
  aluno: 'bg-sky-500/15 text-sky-300',
  professor: 'bg-amber-500/15 text-amber-300',
  admin: 'bg-violet-500/15 text-violet-300',
  support: 'bg-emerald-500/15 text-emerald-300',
  guardian: 'bg-rose-500/15 text-rose-300',
  honorary: 'bg-amber-400/15 text-amber-200',
}

export default function DigitalId() {
  const { profile, refreshProfile } = useAuth()
  // Qualquer conta com vínculo ativo (ex.: admin que também é pai) vê os alunos na carteirinha
  const { data: linkedRows } = useFetch(
    () => listMyLinkedStudents(),
    [profile?.id],
  )

  const linkedStudents: LinkedStudentSummary[] = (linkedRows ?? [])
    .map((row) => ({
      full_name: row.profiles?.full_name || '',
      registration_number: row.profiles?.registration_number || '',
    }))
    .filter((s) => Boolean(s.full_name))

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
    <div className="relative flex w-full flex-col items-center px-3 py-6 animate-fade-in sm:px-4 sm:py-8">
      <div className={`pointer-events-none absolute inset-0 ${pageGlow[variant]}`} aria-hidden />
      <div className="no-print relative mb-6 w-full max-w-[360px] text-center sm:mb-8">
        <div
          className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone[variant]}`}
        >
          <IdCard className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        <p className="mt-2 text-xs text-muted-foreground/80">
          Toque na carteirinha para ampliar; no modo ampliado, toque para ver o verso
        </p>
        <div className="mt-4 flex justify-center">
          <PwaInstallButton label="Instalar app no iPhone" />
        </div>
      </div>
      <div className="relative mb-10 flex w-full max-w-[360px] justify-center pb-6">
        <DigitalIdCard profile={profile} linkedStudents={linkedStudents} />
      </div>
    </div>
  )
}
