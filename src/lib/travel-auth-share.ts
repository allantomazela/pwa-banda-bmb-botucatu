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

/** Gera o PDF e salva no aparelho (Download). */
export async function saveTravelAuthPdf(input: {
  fileName: string
  pdfInput: TravelAuthPdfInput
  element?: HTMLElement | null
}): Promise<File> {
  const file = await createTravelAuthPdfFile(input)
  downloadBlob(file, input.fileName)
  return file
}

function canSharePdfFile(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false
  }
  if (typeof navigator.canShare !== 'function') return true
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/**
 * Compartilha o PDF já salvo (ou gera se necessário).
 * Prefere o seletor nativo do sistema (WhatsApp, e-mail, etc.).
 */
export async function shareTravelAuthPdf(input: {
  file: File
  protocol: string
  studentName: string
  verifyUrl: string
}): Promise<'shared' | 'downloaded'> {
  const { file } = input

  if (canSharePdfFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: `Autorização BMB — ${input.protocol}`,
        text: `Autorização de viagem — ${input.studentName} (${input.protocol}). Validação: ${input.verifyUrl}`,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }

  if (canUseNativeShare()) {
    try {
      await navigator.share({
        title: `Autorização BMB — ${input.protocol}`,
        text: `Autorização de viagem — ${input.studentName}. O PDF "${file.name}" está nos Downloads. Validação: ${input.verifyUrl}`,
        url: input.verifyUrl,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }

  downloadBlob(file, file.name)
  return 'downloaded'
}
