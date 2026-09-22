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

type JsPdfCtor = new (options?: {
  orientation?: 'portrait' | 'landscape'
  unit?: 'mm' | 'pt' | 'px'
  format?: string
}) => {
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

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn
    jspdf?: { jsPDF: JsPdfCtor }
  }
}

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

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const usableWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * usableWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }

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
