import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { verifyIdCard } from '@/services/id-card'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { Button } from '@/components/ui/button'
import {
  buildAndroidExternalBrowserIntent,
  isAndroidDevice,
  isInAppBrowser,
} from '@/lib/site-url'
import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'

const EXTERNAL_REDIRECT_KEY = 'bmb-verify-external-attempt'

export default function VerifyIdCard() {
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, loading, error } = useFetch(
    () => (id ? verifyIdCard(id) : Promise.resolve(null)),
    [id],
  )
  const [inApp, setInApp] = useState(false)

  useEffect(() => {
    const embedded = isInAppBrowser()
    setInApp(embedded)
    if (!embedded || !id) return

    // Android: tenta abrir no navegador padrão automaticamente (1 tentativa)
    if (!isAndroidDevice()) return
    try {
      if (sessionStorage.getItem(EXTERNAL_REDIRECT_KEY) === id) return
      sessionStorage.setItem(EXTERNAL_REDIRECT_KEY, id)
    } catch {
      /* private mode */
    }
    const current = window.location.href
    window.location.replace(buildAndroidExternalBrowserIntent(current))
  }, [id])

  const openExternal = () => {
    const current = window.location.href
    if (isAndroidDevice()) {
      window.location.href = buildAndroidExternalBrowserIntent(current)
      return
    }
    // iOS / outros: abre em nova janela; o usuário pode usar “Abrir no Safari”
    window.open(current, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-y-auto overscroll-y-contain bg-background px-3 py-8 [-webkit-overflow-scrolling:touch]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]" aria-hidden />

      {inApp && (
        <div className="relative z-10 mb-4 w-full max-w-[360px] rounded-xl border border-amber-400/35 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-amber-50">
            Você está em um navegador interno do aplicativo. Para ver a carteirinha completa, abra no
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
        <div className="relative max-w-sm space-y-3 text-center text-destructive">
          <ShieldAlert className="mx-auto h-10 w-10" />
          <p>Carteirinha não encontrada ou cadastro não aprovado.</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[360px]">
          <DigitalIdCard
            showActions={false}
            enableFullscreen={false}
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
              guardian_name: data.guardian_name,
              guardian_phone: data.guardian_phone,
              phone: data.phone,
              role: data.role,
              emergency_contacts: data.emergency_contacts,
              image_consent_status: data.image_consent_status,
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
