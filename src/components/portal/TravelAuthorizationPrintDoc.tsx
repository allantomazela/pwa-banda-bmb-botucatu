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
  shareTravelAuthPdfVia,
  shareVerifyLinkEmail,
  shareVerifyLinkWhatsApp,
  travelAuthPdfFileName,
} from '@/lib/travel-auth-share'
import { signatureMethodLabel } from '@/services/govbr'
import type { TravelAuthorizationWithTrip } from '@/services/travel'
import { useToast } from '@/hooks/use-toast'
import { Check, Copy, ExternalLink, Loader2, Mail, Printer } from 'lucide-react'
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
  const [busy, setBusy] = useState<
    'copy' | 'link-wa' | 'link-mail' | 'pdf-wa' | 'pdf-mail' | null
  >(null)
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

  const pdfPayload = () => ({
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
  })

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

  const handleShareLinkWhatsApp = () => {
    setBusy('link-wa')
    try {
      shareVerifyLinkWhatsApp({ protocol, studentName, verifyUrl })
      toast({
        title: 'Abrindo WhatsApp',
        description: 'O link de validação já vai na mensagem.',
      })
    } catch {
      toast({
        title: 'Não foi possível abrir o WhatsApp',
        description: 'Use Copiar link e cole manualmente.',
        variant: 'destructive',
      })
    }
    setBusy(null)
  }

  const handleShareLinkEmail = () => {
    setBusy('link-mail')
    try {
      shareVerifyLinkEmail({ protocol, studentName, verifyUrl })
      toast({
        title: 'Abrindo e-mail',
        description: 'O link de validação já vai no corpo da mensagem.',
      })
    } catch {
      toast({
        title: 'Não foi possível abrir o e-mail',
        description: 'Use Copiar link e cole manualmente.',
        variant: 'destructive',
      })
    }
    setBusy(null)
  }

  const handleSharePdf = async (channel: 'whatsapp' | 'email') => {
    setBusy(channel === 'whatsapp' ? 'pdf-wa' : 'pdf-mail')
    try {
      await shareTravelAuthPdfVia({
        channel,
        fileName: travelAuthPdfFileName(protocol),
        element: printRef.current,
        pdfInput: pdfPayload(),
        protocol,
        studentName,
      })
      toast({
        title: channel === 'whatsapp' ? 'PDF pronto para o WhatsApp' : 'PDF pronto para o e-mail',
        description:
          'O PDF foi baixado neste aparelho. Anexe o arquivo na conversa ou no e-mail que acabou de abrir.',
      })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast({
          title: 'Não foi possível preparar o PDF',
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
              onClick={handleShareLinkWhatsApp}
              disabled={busy !== null}
            >
              {busy === 'link-wa' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="mr-2 h-4 w-4" />
              )}
              WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={handleShareLinkEmail}
              disabled={busy !== null}
            >
              {busy === 'link-mail' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              E-mail
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
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => handleSharePdf('whatsapp')}
              disabled={busy !== null}
            >
              {busy === 'pdf-wa' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="mr-2 h-4 w-4" />
              )}
              PDF no WhatsApp
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => handleSharePdf('email')}
              disabled={busy !== null}
            >
              {busy === 'pdf-mail' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              PDF por e-mail
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
