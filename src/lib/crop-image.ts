export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    image.src = src
  })
}

export async function cropImageToFile(
  imageSrc: string,
  crop: PixelCrop,
  fileName: string,
  mimeType = 'image/jpeg',
  quality = 0.92,
  maxEdge = 2400,
): Promise<File> {
  const image = await loadImage(imageSrc)
  const { width, height, x, y } = crop

  let outW = width
  let outH = height
  if (Math.max(outW, outH) > maxEdge) {
    const scale = maxEdge / Math.max(outW, outH)
    outW = Math.round(outW * scale)
    outH = Math.round(outH * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível.')

  ctx.drawImage(image, x, y, width, height, 0, 0, outW, outH)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Falha ao gerar a imagem.'))),
      mimeType,
      quality,
    )
  })

  const base = fileName.replace(/\.[^.]+$/, '') || 'imagem'
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `${base}-ajustada.${ext}`, { type: mimeType })
}
