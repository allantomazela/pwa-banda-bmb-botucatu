export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    image.src = src
  })
}

function isNearlyFullImage(crop: PixelCrop, imageWidth: number, imageHeight: number) {
  const area = crop.width * crop.height
  const full = imageWidth * imageHeight
  const covers =
    crop.x <= 1 &&
    crop.y <= 1 &&
    crop.x + crop.width >= imageWidth - 1 &&
    crop.y + crop.height >= imageHeight - 1
  return covers || area / full > 0.985
}

/** Recorta mantendo a resolução do recorte (sem reduzir qualidade desnecessariamente). */
export async function cropImageToFile(
  imageSrc: string,
  crop: PixelCrop,
  originalFile: File,
  options?: { quality?: number },
): Promise<File> {
  const image = await loadImage(imageSrc)
  const iw = image.naturalWidth
  const ih = image.naturalHeight

  const x = Math.max(0, Math.min(Math.round(crop.x), iw - 1))
  const y = Math.max(0, Math.min(Math.round(crop.y), ih - 1))
  const width = Math.max(1, Math.min(Math.round(crop.width), iw - x))
  const height = Math.max(1, Math.min(Math.round(crop.height), ih - y))

  // Sem zoom/recorte efetivo: devolve o arquivo original intacto
  if (isNearlyFullImage({ x, y, width, height }, iw, ih)) {
    return originalFile
  }

  const preferPng = originalFile.type === 'image/png'
  const preferWebp = originalFile.type === 'image/webp'
  const mimeType = preferPng ? 'image/png' : preferWebp ? 'image/webp' : 'image/jpeg'
  const quality = options?.quality ?? (mimeType === 'image/jpeg' ? 0.97 : 0.98)

  // Mantém 1:1 os pixels do recorte (sem downscale)
  const outW = width
  const outH = height

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d', { alpha: preferPng })
  if (!ctx) throw new Error('Canvas indisponível.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, x, y, width, height, 0, 0, outW, outH)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Falha ao gerar a imagem.'))),
      mimeType,
      quality,
    )
  })

  const base = originalFile.name.replace(/\.[^.]+$/, '') || 'imagem'
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `${base}-ajustada.${ext}`, {
    type: mimeType,
    lastModified: Date.now(),
  })
}

/** Calcula o tamanho do quadro que cabe na tela. */
export function fitFrameSize(
  aspect: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const safeAspect = aspect > 0 ? aspect : 1
  let width = Math.max(120, maxWidth)
  let height = width / safeAspect
  if (height > maxHeight) {
    height = Math.max(120, maxHeight)
    width = height * safeAspect
  }
  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}
