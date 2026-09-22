import {
  buildTravelAuthPdfBlob,
  type TravelAuthPdfInput,
} from '@/lib/travel-auth-pdf'

export type { TravelAuthPdfInput }

async function deliverPdfFile(input: {
  blob: Blob
  fileName: string
  title: string
  text: string
  verifyUrl: string
}): Promise<'shared' | 'downloaded'> {
  const file = new File([input.blob], input.fileName, { type: 'application/pdf' })

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const payload: ShareData = {
      title: input.title,
      text: input.text,
      files: [file],
    }
    const canShareFiles =
      typeof navigator.canShare !== 'function' || navigator.canShare(payload)
    if (canShareFiles) {
      try {
        await navigator.share(payload)
        return 'shared'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
      }
    }

    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.verifyUrl,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }

  const url = URL.createObjectURL(input.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = input.fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return 'downloaded'
}

export async function shareOrDownloadTravelAuthPdf(input: {
  fileName: string
  title: string
  text: string
  pdfInput: TravelAuthPdfInput
  element?: HTMLElement | null
}): Promise<'shared' | 'downloaded'> {
  const blob = await buildTravelAuthPdfBlob({
    element: input.element,
    pdfInput: input.pdfInput,
  })
  return deliverPdfFile({
    blob,
    fileName: input.fileName,
    title: input.title,
    text: input.text,
    verifyUrl: input.pdfInput.verifyUrl,
  })
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

export async function shareVerifyLink(input: {
  url: string
  title: string
  text: string
}): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }
  const ok = await copyTextToClipboard(input.url)
  if (!ok) throw new Error('Não foi possível copiar o link.')
  return 'copied'
}

export function travelAuthPdfFileName(protocol: string): string {
  const safe = protocol.replace(/[^a-zA-Z0-9-_]/g, '_')
  return `autorizacao-${safe}.pdf`
}
