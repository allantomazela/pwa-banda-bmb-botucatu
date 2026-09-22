import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VerifyQrCode } from '@/components/portal/VerifyQrCode'
import { BRAND_LOGO_SRC } from '@/lib/brand'
import { buildVerifyTravelAuthUrl } from '@/lib/site-url'
import {
  TRAVEL_AUTH_DOC_VERSION,
  buildTravelAuthorizationBody,
  formatAuthProtocol,
  signatureMethodDocLabel,
} from '@/lib/travel-authorization-doc'
import {
  copyTextToClipboard,
  shareOrDownloadTravelAuthPdf,
  shareVerifyLink,
  travelAuthPdfFileName,
} from '@/lib/travel-auth-share'
import { signatureMethodLabel } from '@/services/govbr'
import type { TravelAuthorizationWithTrip } from '@/services/travel'
import { useToast } from '@/hooks/use-toast'
import { Check, Copy, ExternalLink, Loader2, Printer, Share2 } from 'lucide-react'
import './travel-authorization-print.css'

export type TravelAuthPrintStudent = {
  full_name?: string | null
  registration_number?: string | null
  birth_date?: string | null
  cpf?: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  auth: TravelAuthorizationWithTrip | null
  student?: TravelAuthPrintStudent | null
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export function TravelAuthorizationPrintDoc({ open, onOpenChange, auth, student }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [busy, setBusy] = useState<'copy' | 'share-link' | 'share-pdf' | null>(null)
  const [copied, setCopied] = useState(false)

  if (!auth) return null

  const trip = auth.travel_trips
  const profile = student || auth.profiles || null
  const studentName = profile?.full_name || 'Aluno(a)'
  const registration = profile?.registration_number || '—'
  const birthDate = profile?.birth_date
  const cpf = profile?.cpf
  const protocol = formatAuthProtocol(auth.id)
  const verifyUrl = buildVerifyTravelAuthUrl(auth.id)
  const body = buildTravelAuthorizationBody({
    studentName,
    tripTitle: trip?.title || 'Viagem institucional',
    destination: trip?.destination || 'a definir',
    departureLabel: formatDateTime(trip?.departure_at),
    returnLabel: trip?.return_at ? formatDateTime(trip.return_at) : null,
  })

  const handlePrint = () => {
    const el = printRef.current
    if (!el) {
      window.print()
      return
    }

    const placeholder = document.createElement('div')
    placeholder.setAttribute('data-travel-auth-print-placeholder', '1')
    const parent = el.parentNode
    parent?.insertBefore(placeholder, el)
    document.body.appendChild(el)

    let cleaned = false
    const restore = () => {
      if (cleaned) return
      cleaned = true
      placeholder.parentNode?.insertBefore(el, placeholder)
      placeholder.remove()
      window.removeEventListener('afterprint', restore)
    }

    window.addEventListener('afterprint', restore)
    window.setTimeout(() => window.print(), 50)
    window.setTimeout(restore, 1500)
  }

  const handleCopyLink = async () => {
    setBusy('copy')
    const ok = await copyTextToClipboard(verifyUrl)
    setBusy(null)
    if (!ok) {
      toast({
        title: 'Não foi possível copiar',
        description: 'Copie o link manualmente.',
        variant: 'destructive',
      })
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Link de validação copiado' })
  }

  const handleShareLink = async () => {
    setBusy('share-link')
    try {
      const result = await shareVerifyLink({
        url: verifyUrl,
        title: `Autorização BMB — ${protocol}`,
        text: `Confira a validade da autorização ${protocol} (${studentName}).`,
      })
      if (result === 'copied') {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
        toast({ title: 'Link copiado', description: 'Compartilhamento nativo indisponível neste aparelho.' })
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast({
          title: 'Falha ao compartilhar link',
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
      }
    }
    setBusy(null)
  }

  const handleSharePdf = async () => {
    setBusy('share-pdf')
    const el = printRef.current
    try {
      const result = await shareOrDownloadTravelAuthPdf({
        fileName: travelAuthPdfFileName(protocol),
        title: `Autorização BMB — ${protocol}`,
        text: `Autorização de viagem ${protocol} — ${studentName}. Validação: ${verifyUrl}`,
        element: el,
        pdfInput: {
          protocol,
          studentName,
          registration,
          tripTitle: trip?.title || 'Viagem institucional',
          destination: trip?.destination || 'a definir',
          departureLabel: formatDateTime(trip?.departure_at),
          returnLabel: formatDateTime(trip?.return_at),
          guardianName: auth.guardian_name || auth.govbr_name || '—',
          guardianDocument: auth.guardian_document || '—',
          signatureMethod: signatureMethodDocLabel(auth.signature_method),
          signedAt: formatDateTime(auth.signed_at),
          verifyUrl,
          body,
        },
      })
      toast({
        title: result === 'shared' ? 'PDF compartilhado' : 'PDF baixado',
        description:
          result === 'downloaded'
            ? 'Arquivo salvo neste dispositivo. Envie pelo WhatsApp, e-mail ou outro app.'
            : undefined,
      })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast({
          title: 'Não foi possível compartilhar o PDF',
          description: 'Tente Imprimir / Salvar PDF pelo navegador.',
          variant: 'destructive',
        })
      }
    }
    setBusy(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible">
        <DialogHeader className="no-print">
          <DialogTitle>Documento de autorização</DialogTitle>
        </DialogHeader>

        <div className="no-print mb-4 space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Link de validação do QR Code
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground sm:text-sm">{verifyUrl}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Protocolo <span className="font-mono text-foreground">{protocol}</span> — qualquer
              pessoa com o link confere a validade online.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
              onClick={handleCopyLink}
              disabled={busy !== null}
            >
              {busy === 'copy' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copiado' : 'Copiar link'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={handleShareLink}
              disabled={busy !== null}
            >
              {busy === 'share-link' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Compartilhar link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              asChild
            >
              <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir validação
              </a>
            </Button>
          </div>
        </div>

        <div ref={printRef} className="printable-auth travel-auth-doc">
          <header className="travel-auth-doc__header">
            <img src={BRAND_LOGO_SRC} alt="" className="travel-auth-doc__logo" />
            <div>
              <p className="travel-auth-doc__org">Banda Marcial de Botucatu</p>
              <h1 className="travel-auth-doc__title">Autorização de viagem / participação</h1>
              <p className="travel-auth-doc__meta">
                Protocolo {protocol} · Versão {TRAVEL_AUTH_DOC_VERSION}
              </p>
            </div>
          </header>

          <section className="travel-auth-doc__section">
            <h2>1. Dados do(a) aluno(a)</h2>
            <dl className="travel-auth-doc__grid">
              <div>
                <dt>Nome completo</dt>
                <dd>{studentName}</dd>
              </div>
              <div>
                <dt>Matrícula</dt>
                <dd>{registration}</dd>
              </div>
              <div>
                <dt>Nascimento</dt>
                <dd>{formatDateOnly(birthDate)}</dd>
              </div>
              <div>
                <dt>CPF</dt>
                <dd>{cpf || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="travel-auth-doc__section">
            <h2>2. Dados da viagem</h2>
            <dl className="travel-auth-doc__grid">
              <div>
                <dt>Evento / título</dt>
                <dd>{trip?.title || '—'}</dd>
              </div>
              <div>
                <dt>Local / destino</dt>
                <dd>{trip?.destination || '—'}</dd>
              </div>
              <div>
                <dt>Saída</dt>
                <dd>{formatDateTime(trip?.departure_at)}</dd>
              </div>
              <div>
                <dt>Retorno</dt>
                <dd>{formatDateTime(trip?.return_at)}</dd>
              </div>
            </dl>
            {trip?.description ? (
              <p className="travel-auth-doc__desc">{trip.description}</p>
            ) : null}
          </section>

          <section className="travel-auth-doc__section">
            <h2>3. Declaração do responsável legal</h2>
            <pre className="travel-auth-doc__body">{body}</pre>
          </section>

          <section className="travel-auth-doc__section">
            <h2>4. Responsável e assinatura</h2>
            <dl className="travel-auth-doc__grid">
              <div>
                <dt>Nome do responsável</dt>
                <dd>{auth.guardian_name || auth.govbr_name || '—'}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{auth.guardian_phone || '—'}</dd>
              </div>
              <div>
                <dt>Documento (CPF/RG)</dt>
                <dd>{auth.guardian_document || '—'}</dd>
              </div>
              <div>
                <dt>Método de assinatura</dt>
                <dd>
                  {signatureMethodDocLabel(auth.signature_method)}
                  {auth.signature_method === 'govbr' && auth.govbr_assurance
                    ? ` · ${auth.govbr_assurance}`
                    : ''}
                </dd>
              </div>
              <div>
                <dt>Data e hora da assinatura</dt>
                <dd>{formatDateTime(auth.signed_at)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{auth.status === 'signed' ? 'Assinada / válida' : auth.status}</dd>
              </div>
            </dl>

            {auth.signature_data ? (
              <div className="travel-auth-doc__sign-box">
                <p>Assinatura manuscrita registrada</p>
                <img src={auth.signature_data} alt="Assinatura do responsável" />
              </div>
            ) : auth.signature_method === 'govbr' ? (
              <p className="travel-auth-doc__govbr">
                Assinatura eletrônica via {signatureMethodLabel('govbr')}
                {auth.govbr_name ? ` — ${auth.govbr_name}` : ''}
                {auth.govbr_email ? ` (${auth.govbr_email})` : ''}.
              </p>
            ) : null}
          </section>

          <footer className="travel-auth-doc__footer">
            <div className="travel-auth-doc__verify">
              <div className="travel-auth-doc__qr">
                <VerifyQrCode
                  value={verifyUrl}
                  size={112}
                  title="QR Code de verificação da autorização"
                />
              </div>
              <div className="travel-auth-doc__verify-text">
                <p className="travel-auth-doc__verify-title">Verificação online</p>
                <p>
                  Escaneie o QR Code para conferir a validade deste protocolo no portal da BMB.
                  Documento gerado eletronicamente — protocolo <strong>{protocol}</strong>.
                </p>
                <p className="travel-auth-doc__verify-url">
                  <a href={verifyUrl}>{verifyUrl}</a>
                </p>
              </div>
            </div>
            <p>
              A cópia impressa corresponde ao registro eletrônico disponível para conferência
              pública. Documento pessoal vinculado à participação do(a) aluno(a) na atividade
              descrita.
            </p>
            <p>Botucatu/SP — Banda Marcial de Botucatu</p>
          </footer>
        </div>

        <DialogFooter className="no-print flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
              onClick={handleSharePdf}
              disabled={busy !== null}
            >
              {busy === 'share-pdf' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Compartilhar PDF
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="min-h-11 w-full sm:w-auto"
              disabled={busy !== null}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
