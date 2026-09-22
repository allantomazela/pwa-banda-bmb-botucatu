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
  // <a> evita aba em branco e funciona melhor com mailto
  const a = document.createElement('a')
  a.href = url
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadBlob(blob: Blob, fileName: string) {
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
    `Link de validação — Autorização BMB`,
    `Protocolo: ${input.protocol}`,
    `Aluno(a): ${input.studentName}`,
    '',
    'Abra para conferir a validade online:',
    input.verifyUrl,
  ].join('\n')
}

/** Só o link de validação (sem PDF). */
export function shareVerifyLinkWhatsApp(input: {
  protocol: string
  studentName: string
  verifyUrl: string
}): void {
  openWhatsAppShare(buildLinkShareText(input))
}

/** Só o link de validação (sem PDF). */
export function shareVerifyLinkEmail(input: {
  protocol: string
  studentName: string
  verifyUrl: string
}): void {
  openEmailShare({
    subject: `Link de validação — Autorização BMB ${input.protocol}`,
    body: buildLinkShareText(input),
  })
}

export async function createTravelAuthPdfFile(input: {
  fileName: string
  pdfInput: TravelAuthPdfInput
  element?: HTMLElement | null
}): Promise<File> {
  const blob = await buildTravelAuthPdfBlob({
    element: input.element,
    pdfInput: input.pdfInput,
  })
  return new File([blob], input.fileName, { type: 'application/pdf' })
}

function canSharePdfFile(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false
  }
  if (typeof navigator.canShare !== 'function') {
    // alguns browsers antigos: tenta mesmo assim
    return true
  }
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * Envia o PDF de fato (arquivo), não só o link.
 * 1) Web Share com o arquivo (WhatsApp/e-mail recebem o PDF)
 * 2) Senão: baixa o PDF e abre o canal com instrução para anexar
 */
export async function shareTravelAuthPdfVia(input: {
  channel: 'whatsapp' | 'email'
  fileName: string
  pdfInput: TravelAuthPdfInput
  element?: HTMLElement | null
  protocol: string
  studentName: string
  /** Arquivo já gerado (evita regenerar) */
  file?: File | null
}): Promise<'shared-file' | 'downloaded-opened'> {
  const file =
    input.file ??
    (await createTravelAuthPdfFile({
      fileName: input.fileName,
      pdfInput: input.pdfInput,
      element: input.element,
    }))

  // Caminho ideal: o sistema anexa o PDF (Android/iOS)
  if (canSharePdfFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: `Autorização BMB — ${input.protocol}`,
        text:
          input.channel === 'whatsapp'
            ? `Autorização de viagem em PDF — ${input.protocol} (${input.studentName})`
            : `Segue em anexo a autorização de viagem BMB (${input.protocol}).`,
      })
      return 'shared-file'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      // continua no fallback
    }
  }

  // Fallback desktop: baixa o PDF e abre o app com texto DIFERENTE do botão de link
  downloadBlob(file, input.fileName)

  if (input.channel === 'whatsapp') {
    openWhatsAppShare(
      [
        '📄 Autorização BMB em PDF',
        `Protocolo: ${input.protocol}`,
        `Aluno(a): ${input.studentName}`,
        '',
        `O arquivo "${input.fileName}" foi baixado neste aparelho.`,
        'Anexe esse PDF nesta conversa (📎 / documento).',
        '',
        '(Esta mensagem é do documento PDF — não é só o link de validação.)',
      ].join('\n'),
    )
  } else {
    openEmailShare({
      subject: `PDF — Autorização BMB ${input.protocol}`,
      body: [
        'Segue a autorização de viagem da Banda Marcial de Botucatu em PDF.',
        '',
        `Protocolo: ${input.protocol}`,
        `Aluno(a): ${input.studentName}`,
        `Arquivo: ${input.fileName}`,
        '',
        'IMPORTANTE: anexe o PDF que acabou de ser baixado neste computador/celular.',
        '(O e-mail do navegador não consegue anexar sozinho por segurança.)',
      ].join('\n'),
    })
  }

  return 'downloaded-opened'
}
