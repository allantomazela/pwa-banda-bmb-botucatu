import {
  buildTravelAuthPdfBlob,
  type TravelAuthPdfInput,
} from '@/lib/travel-auth-pdf'

export type { TravelAuthPdfInput }

export function travelAuthPdfFileName(protocol: string): string {
  const safe = protocol.replace(/[^a-zA-Z0-9-_]/g, '_')
  return `autorizacao-${safe}.pdf`
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

/** Abre WhatsApp (app ou web) com texto pré-preenchido. */
export function openWhatsAppShare(text: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.href = url
  }
}

/** Abre o cliente de e-mail com assunto e corpo. */
export function openEmailShare(input: { subject: string; body: string }): void {
  const url = `mailto:?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.body)}`
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.href = url
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function buildLinkShareText(input: {
  protocol: string
  studentName: string
  verifyUrl: string
}): string {
  return [
    `Autorização BMB — ${input.protocol}`,
    `Aluno(a): ${input.studentName}`,
    '',
    'Confira a validade online:',
    input.verifyUrl,
  ].join('\n')
}

function buildPdfShareText(input: {
  protocol: string
  studentName: string
  verifyUrl: string
  fileName: string
}): string {
  return [
    `Autorização de viagem BMB — ${input.protocol}`,
    `Aluno(a): ${input.studentName}`,
    '',
    `Arquivo PDF: ${input.fileName}`,
    '(anexe o PDF baixado nesta conversa/e-mail)',
    '',
    'Validação online do protocolo:',
    input.verifyUrl,
  ].join('\n')
}

/** Compartilha o link de validação via WhatsApp (abre de imediato). */
export function shareVerifyLinkWhatsApp(input: {
  protocol: string
  studentName: string
  verifyUrl: string
}): void {
  openWhatsAppShare(buildLinkShareText(input))
}

/** Compartilha o link de validação via e-mail. */
export function shareVerifyLinkEmail(input: {
  protocol: string
  studentName: string
  verifyUrl: string
}): void {
  openEmailShare({
    subject: `Validação autorização BMB — ${input.protocol}`,
    body: buildLinkShareText(input),
  })
}

/**
 * Gera o PDF, baixa no aparelho e abre WhatsApp/e-mail.
 * (Navegadores não anexam arquivo automaticamente — o download permite anexar.)
 */
export async function shareTravelAuthPdfVia(input: {
  channel: 'whatsapp' | 'email'
  fileName: string
  pdfInput: TravelAuthPdfInput
  element?: HTMLElement | null
  protocol: string
  studentName: string
}): Promise<'opened'> {
  // Mantém a janela “vincular” ao gesto do usuário (evita bloqueio de popup após await)
  const bridge = window.open('about:blank', '_blank')

  try {
    const blob = await buildTravelAuthPdfBlob({
      element: input.element,
      pdfInput: input.pdfInput,
    })
    downloadBlob(blob, input.fileName)

    const message = buildPdfShareText({
      protocol: input.protocol,
      studentName: input.studentName,
      verifyUrl: input.pdfInput.verifyUrl,
      fileName: input.fileName,
    })

    if (input.channel === 'whatsapp') {
      const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
      if (bridge) {
        bridge.location.href = wa
      } else {
        openWhatsAppShare(message)
      }
    } else {
      // mailto em about:blank costuma falhar — fecha o bridge e abre o cliente de e-mail
      bridge?.close()
      openEmailShare({
        subject: `Autorização BMB — ${input.protocol}`,
        body: message,
      })
    }

    return 'opened'
  } catch (err) {
    bridge?.close()
    throw err
  }
}
