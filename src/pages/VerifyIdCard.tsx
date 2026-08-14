import { useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { verifyIdCard } from '@/services/id-card'
import { formatDateBR } from '@/lib/formatters'
import { BadgeCheck, ShieldAlert, IdCard } from 'lucide-react'

export default function VerifyIdCard() {
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, loading, error } = useFetch(
    () => (id ? verifyIdCard(id) : Promise.resolve(null)),
    [id],
  )

  return (
    <div className="container max-w-lg py-16 animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-card/50 p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <IdCard className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Verificação da Carteirinha</h1>
        <p className="text-sm text-muted-foreground">
          Identificação institucional da Banda BMB — Botucatu/SP. Válida em todo o território
          brasileiro para reconhecimento do integrante junto à associação. Não substitui RG, CIN ou
          outro documento oficial.
        </p>

        {!id ? (
          <p className="text-muted-foreground">QR Code inválido.</p>
        ) : loading ? (
          <p className="text-muted-foreground">Consultando...</p>
        ) : error || !data ? (
          <div className="space-y-2 text-destructive">
            <ShieldAlert className="mx-auto h-8 w-8" />
            <p>Carteirinha não encontrada ou cadastro não aprovado.</p>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-center gap-2">
              <BadgeCheck className={data.is_valid ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-semibold">
                {data.is_valid ? 'Carteirinha válida' : 'Carteirinha vencida'}
              </span>
            </div>
            <p>
              <span className="text-muted-foreground">Nome:</span> {data.full_name}
            </p>
            <p>
              <span className="text-muted-foreground">Matrícula:</span> {data.registration_number}
            </p>
            <p>
              <span className="text-muted-foreground">Instrumento:</span> {data.instrument || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Validade:</span>{' '}
              {formatDateBR(data.valid_until, 'Sem data informada')}
            </p>
            <p>
              <span className="text-muted-foreground">Cidade/UF:</span>{' '}
              {[data.city, data.state].filter(Boolean).join('/') || '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
