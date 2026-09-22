import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { formatAuthProtocol, signatureMethodDocLabel } from '@/lib/travel-authorization-doc'
import {
  buildAndroidExternalBrowserIntent,
  isAndroidDevice,
  isInAppBrowser,
} from '@/lib/site-url'
import { verifyTravelAuthorization } from '@/services/travel'
import { Button } from '@/components/ui/button'
import { BrandCrest } from '@/components/BrandMark'
import { BadgeCheck, Bus, ExternalLink, Loader2, ShieldAlert, ShieldOff } from 'lucide-react'

const EXTERNAL_REDIRECT_KEY = 'bmb-verify-auth-external-attempt'

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

export default function VerifyTravelAuth() {
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, loading, error } = useFetch(
    () => (id ? verifyTravelAuthorization(id) : Promise.resolve(null)),
    [id],
  )
  const [inApp, setInApp] = useState(false)

  useEffect(() => {
    const embedded = isInAppBrowser()
    setInApp(embedded)
    if (!embedded || !id) return

    if (!isAndroidDevice()) return
    try {
      if (sessionStorage.getItem(EXTERNAL_REDIRECT_KEY) === id) return
      sessionStorage.setItem(EXTERNAL_REDIRECT_KEY, id)
    } catch {
      /* private mode */
    }
    window.location.replace(buildAndroidExternalBrowserIntent(window.location.href))
  }, [id])

  const openExternal = () => {
    const current = window.location.href
    if (isAndroidDevice()) {
      window.location.href = buildAndroidExternalBrowserIntent(current)
      return
    }
    window.open(current, '_blank', 'noopener,noreferrer')
  }

  const protocol = id ? formatAuthProtocol(id) : '—'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-3 py-8 sm:px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]" />

      <div className="relative z-10 mb-6 flex flex-col items-center gap-2 text-center">
        <div className="h-14 w-14 sm:h-16 sm:w-16">
          <BrandCrest />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Banda Marcial de Botucatu
        </p>
        <h1 className="max-w-md font-display text-xl font-bold text-foreground sm:text-2xl">
          Verificação de autorização
        </h1>
      </div>

      {inApp && (
        <div className="relative z-10 mb-4 w-full max-w-md rounded-xl border border-amber-400/35 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-amber-50">
            Você está em um navegador interno do aplicativo. Para conferir o documento, abra no
            navegador do celular.
          </p>
          <Button
            type="button"
            className="mt-3 h-11 w-full min-h-11 gap-2"
            onClick={openExternal}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no navegador
          </Button>
        </div>
      )}

      {loading ? (
        <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
      ) : error || !id || !data ? (
        <div className="relative z-10 max-w-sm space-y-3 text-center text-destructive">
          <ShieldAlert className="mx-auto h-10 w-10" />
          <p>Autorização não encontrada ou indisponível para verificação pública.</p>
          <p className="text-xs text-muted-foreground">Protocolo consultado: {protocol}</p>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-md min-w-0 space-y-4">
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              data.is_valid
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-destructive/40 bg-destructive/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {data.is_valid ? (
                <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
              ) : (
                <ShieldOff className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-foreground">
                  {data.is_valid
                    ? 'Autorização válida e assinada'
                    : 'Autorização revogada / inválida'}
                </p>
                <p className="break-words text-sm text-muted-foreground">
                  Protocolo <span className="font-mono text-foreground">{protocol}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bus className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 break-words">{data.trip_title || 'Viagem'}</span>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Aluno(a)</dt>
                <dd className="break-words font-medium">{data.student_name || '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Matrícula</dt>
                <dd className="font-mono text-sm">{data.registration_number || '—'}</dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Destino</dt>
                <dd className="break-words">{data.destination || '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Saída</dt>
                <dd>{formatDateTime(data.departure_at)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Retorno</dt>
                <dd>{formatDateTime(data.return_at)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Responsável
                </dt>
                <dd className="break-words">{data.guardian_name || '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Assinatura</dt>
                <dd className="break-words">
                  {signatureMethodDocLabel(data.signature_method)}
                  {data.govbr_assurance ? ` · ${data.govbr_assurance}` : ''}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assinado em
                </dt>
                <dd>{formatDateTime(data.signed_at)}</dd>
              </div>
            </dl>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Registro eletrônico conferido no portal institucional da BMB.
          </p>
          <div className="flex justify-center">
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/">Voltar ao site</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
