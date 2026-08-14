import { useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { verifyIdCard } from '@/services/id-card'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function VerifyIdCard() {
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, loading, error } = useFetch(
    () => (id ? verifyIdCard(id) : Promise.resolve(null)),
    [id],
  )

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-3 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]" />

      {loading ? (
        <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
      ) : error || !id || !data ? (
        <div className="relative max-w-sm space-y-3 text-center text-destructive">
          <ShieldAlert className="mx-auto h-10 w-10" />
          <p>Carteirinha não encontrada ou cadastro não aprovado.</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[360px]">
          <DigitalIdCard
            showActions={false}
            profile={{
              id,
              full_name: data.full_name,
              instrument: data.instrument,
              registration_number: data.registration_number,
              avatar_url: data.avatar_url,
              birth_date: data.birth_date,
              valid_until: data.valid_until,
              city: data.city,
              state: data.state,
              cpf: data.cpf,
              rg: data.rg,
              disability_info: data.disability_info,
              role: data.role,
            }}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Toque na carteirinha para ver o verso
          </p>
        </div>
      )}
    </div>
  )
}
