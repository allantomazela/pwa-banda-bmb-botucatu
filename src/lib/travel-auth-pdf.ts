/** Geração de PDF da autorização (visual via CDN + fallback textual). */

type PdfLine = { text: string; bold?: boolean; size?: number; gap?: number }

type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    scale?: number
    useCORS?: boolean
    allowTaint?: boolean
    backgroundColor?: string | null
    logging?: boolean
    windowWidth?: number
  },
) => Promise<HTMLCanvasElement>

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void
  addPage: () => void
  output: (type: 'blob') => Blob
}

type JsPdfCtor = new (options?: {
  orientation?: 'portrait' | 'landscape'
  unit?: 'mm' | 'pt' | 'px'
  format?: string
}) => JsPdfDoc

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn
    jspdf?: { jsPDF: JsPdfCtor }
  }
}

type KeepRange = { start: number; end: number }

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === '1') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = '1'
      resolve()
    }
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`))
    document.head.appendChild(script)
  })
}

async function ensureVisualPdfLibs(): Promise<{
  html2canvas: Html2CanvasFn
  jsPDF: JsPdfCtor
}> {
  if (!window.html2canvas) {
    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js')
  }
  if (!window.jspdf?.jsPDF) {
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js')
  }
  const html2canvas = window.html2canvas
  const jsPDF = window.jspdf?.jsPDF
  if (!html2canvas || !jsPDF) {
    throw new Error('Bibliotecas de PDF indisponíveis')
  }
  return { html2canvas, jsPDF }
}

function toPdfSafeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
}

function escapePdfText(value: string): string {
  return toPdfSafeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) lines.push(current)
    if (word.length <= maxChars) {
      current = word
    } else {
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars))
      }
      current = ''
    }
  }
  if (current) lines.push(current)
  return lines
}

export type TravelAuthPdfInput = {
  protocol: string
  studentName: string
  registration: string
  tripTitle: string
  destination: string
  departureLabel: string
  returnLabel: string
  guardianName: string
  guardianDocument: string
  signatureMethod: string
  signedAt: string
  verifyUrl: string
  body: string
}

/** Fallback textual se a captura visual falhar. */
export function buildTravelAuthTextPdfBlob(input: TravelAuthPdfInput): Blob {
  const blocks: PdfLine[] = [
    { text: 'BANDA MARCIAL DE BOTUCATU', bold: true, size: 12, gap: 8 },
    { text: 'Autorizacao de viagem / participacao', bold: true, size: 13, gap: 10 },
    { text: `Protocolo: ${input.protocol}`, bold: true, size: 11, gap: 16 },
    { text: '1. Aluno(a)', bold: true, size: 11, gap: 8 },
    { text: `Nome: ${input.studentName}`, size: 10, gap: 5 },
    { text: `Matricula: ${input.registration}`, size: 10, gap: 12 },
    { text: '2. Viagem', bold: true, size: 11, gap: 8 },
    { text: `Titulo: ${input.tripTitle}`, size: 10, gap: 5 },
    { text: `Destino: ${input.destination}`, size: 10, gap: 5 },
    { text: `Saida: ${input.departureLabel}`, size: 10, gap: 5 },
    { text: `Retorno: ${input.returnLabel}`, size: 10, gap: 12 },
    { text: '3. Declaracao', bold: true, size: 11, gap: 8 },
    ...input.body.split('\n').flatMap((line) =>
      wrapLine(line || ' ', 90).map((t) => ({ text: t, size: 9, gap: 4 })),
    ),
    { text: ' ', size: 9, gap: 10 },
    { text: '4. Responsavel e assinatura', bold: true, size: 11, gap: 8 },
    { text: `Responsavel: ${input.guardianName}`, size: 10, gap: 5 },
    { text: `Documento: ${input.guardianDocument}`, size: 10, gap: 5 },
    { text: `Metodo: ${input.signatureMethod}`, size: 10, gap: 5 },
    { text: `Assinado em: ${input.signedAt}`, size: 10, gap: 14 },
    { text: '5. Validacao online (QR / link)', bold: true, size: 11, gap: 8 },
    { text: 'Abra o link abaixo ou escaneie o QR do documento impresso:', size: 9, gap: 5 },
    ...wrapLine(input.verifyUrl, 78).map((t) => ({ text: t, size: 8, gap: 4 })),
    { text: ' ', size: 9, gap: 12 },
    {
      text: 'Documento gerado pelo portal da BMB. Conferencia publica via protocolo.',
      size: 8,
      gap: 4,
    },
  ]

  const streamParts: string[] = ['BT']
  let y = 800
  for (const block of blocks) {
    const size = block.size ?? 10
    const font = block.bold ? '/F2' : '/F1'
    if (y < 48) break
    streamParts.push(`${font} ${size} Tf`)
    streamParts.push(`1 0 0 1 48 ${y} Tm`)
    streamParts.push(`(${escapePdfText(block.text)}) Tj`)
    y -= block.gap ?? 12
  }
  streamParts.push('ET')
  const stream = streamParts.join('\n')

  const objects: string[] = []
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj')
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj')
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>endobj',
  )
  objects.push(`4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`)
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj')
  objects.push('6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj')

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += `${obj}\n`
  }
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

/** Intervalos (em px do canvas) que não devem ser cortados no meio (assinatura, rodapé). */
function collectKeepTogetherRanges(element: HTMLElement, canvasHeight: number): KeepRange[] {
  const elHeight = Math.max(element.scrollHeight, element.offsetHeight, 1)
  const ratio = canvasHeight / elHeight
  const rootTop = element.getBoundingClientRect().top + window.scrollY

  const nodes = element.querySelectorAll<HTMLElement>(
    '[data-pdf-keep-together], .travel-auth-doc__sign-box, .travel-auth-doc__section--signature, .travel-auth-doc__footer',
  )

  const ranges: KeepRange[] = []
  nodes.forEach((node) => {
    const top = node.getBoundingClientRect().top + window.scrollY - rootTop
    const height = Math.max(node.offsetHeight, node.scrollHeight)
    const start = Math.max(0, Math.floor(top * ratio))
    const end = Math.min(canvasHeight, Math.ceil((top + height) * ratio))
    if (end > start + 8) ranges.push({ start, end })
  })

  ranges.sort((a, b) => a.start - b.start)

  // Mescla intervalos sobrepostos (ex.: seção 4 + caixa de assinatura)
  const merged: KeepRange[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end + 4) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

/**
 * Define cortes de página evitando atravessar blocos “keep together”.
 * Se um bloco não cabe na página, ele começa na página seguinte inteiro.
 */
function buildPageSlices(
  canvasHeight: number,
  pageHeightPx: number,
  keepRanges: KeepRange[],
): KeepRange[] {
  if (canvasHeight <= pageHeightPx) {
    return [{ start: 0, end: canvasHeight }]
  }

  const slices: KeepRange[] = []
  let y = 0

  while (y < canvasHeight - 1) {
    let end = Math.min(y + pageHeightPx, canvasHeight)

    for (const range of keepRanges) {
      // Corte cairia no meio do bloco → quebra antes dele
      if (range.start < end && range.end > end && range.start > y) {
        end = range.start
        break
      }
      // Bloco começa nesta página mas não cabe → empurra para a próxima
      if (range.start >= y && range.start < end && range.end > y + pageHeightPx) {
        if (range.start > y + 24) {
          end = range.start
          break
        }
      }
    }

    if (end <= y) {
      end = Math.min(y + pageHeightPx, canvasHeight)
    }

    slices.push({ start: y, end })
    y = end
  }

  return slices
}

function canvasSliceToJpeg(source: HTMLCanvasElement, startY: number, endY: number): string {
  const sliceHeight = Math.max(1, Math.ceil(endY - startY))
  const slice = document.createElement('canvas')
  slice.width = source.width
  slice.height = sliceHeight
  const ctx = slice.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, slice.width, slice.height)
  ctx.drawImage(
    source,
    0,
    startY,
    source.width,
    sliceHeight,
    0,
    0,
    source.width,
    sliceHeight,
  )
  return slice.toDataURL('image/jpeg', 0.92)
}

/** Captura o documento visual (QR + assinatura) e monta PDF A4. */
export async function buildTravelAuthVisualPdfBlob(element: HTMLElement): Promise<Blob> {
  const { html2canvas, jsPDF } = await ensureVisualPdfLibs()

  const placeholder = document.createElement('div')
  const parent = element.parentNode
  parent?.insertBefore(placeholder, element)
  const prev = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    zIndex: element.style.zIndex,
    width: element.style.width,
  }
  element.style.position = 'fixed'
  element.style.left = '0'
  element.style.top = '0'
  element.style.zIndex = '2147483646'
  element.style.width = '794px'
  document.body.appendChild(element)

  try {
    await new Promise((r) => window.setTimeout(r, 120))
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(element.scrollWidth, 794),
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const usableWidth = pageWidth - margin * 2
    const usablePageHeight = pageHeight - margin * 2
    const imgHeightMm = (canvas.height * usableWidth) / canvas.width

    // Cabe em uma folha (ou com leve redução): evita qualquer corte na assinatura
    const maxShrink = 0.82
    if (imgHeightMm <= usablePageHeight / maxShrink) {
      const fit = Math.min(1, usablePageHeight / imgHeightMm)
      const w = usableWidth * fit
      const h = imgHeightMm * fit
      const x = margin + (usableWidth - w) / 2
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', x, margin, w, h)
      return pdf.output('blob')
    }

    // Multi-página: fatia o canvas sem atravessar assinatura/rodapé
    const pageHeightPx = (usablePageHeight / usableWidth) * canvas.width
    const keepRanges = collectKeepTogetherRanges(element, canvas.height)
    const slices = buildPageSlices(canvas.height, pageHeightPx, keepRanges)

    slices.forEach((slice, index) => {
      if (index > 0) pdf.addPage()
      const jpeg = canvasSliceToJpeg(canvas, slice.start, slice.end)
      const sliceHeightMm = ((slice.end - slice.start) * usableWidth) / canvas.width
      pdf.addImage(jpeg, 'JPEG', margin, margin, usableWidth, sliceHeightMm)
    })

    return pdf.output('blob')
  } finally {
    element.style.position = prev.position
    element.style.left = prev.left
    element.style.top = prev.top
    element.style.zIndex = prev.zIndex
    element.style.width = prev.width
    placeholder.parentNode?.insertBefore(element, placeholder)
    placeholder.remove()
  }
}

export async function buildTravelAuthPdfBlob(input: {
  element?: HTMLElement | null
  pdfInput: TravelAuthPdfInput
}): Promise<Blob> {
  if (input.element) {
    try {
      return await buildTravelAuthVisualPdfBlob(input.element)
    } catch {
      /* fallback textual */
    }
  }
  return buildTravelAuthTextPdfBlob(input.pdfInput)
}
