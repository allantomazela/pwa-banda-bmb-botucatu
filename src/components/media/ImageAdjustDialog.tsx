import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cropImageToFile, loadImage, type PixelCrop } from '@/lib/crop-image'

export type ImageAdjustAspect = 'free' | '1:1' | '4:3' | '16:9' | '21:9' | '3:4'

const ASPECT_OPTIONS: Array<{ id: ImageAdjustAspect; label: string; value: number | null }> = [
  { id: 'free', label: 'Livre', value: null },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '21:9', label: '21:9', value: 21 / 9 },
  { id: '3:4', label: '3:4', value: 3 / 4 },
]

type Props = {
  open: boolean
  file: File | null
  title?: string
  defaultAspect?: ImageAdjustAspect
  onCancel: () => void
  onConfirm: (file: File) => void
}

function coverScale(iw: number, ih: number, fw: number, fh: number) {
  return Math.max(fw / iw, fh / ih)
}

function clampOffset(
  offset: { x: number; y: number },
  iw: number,
  ih: number,
  fw: number,
  fh: number,
  zoom: number,
) {
  const s = coverScale(iw, ih, fw, fh) * zoom
  const displayW = iw * s
  const displayH = ih * s
  const maxX = Math.max(0, (displayW - fw) / 2)
  const maxY = Math.max(0, (displayH - fh) / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}

function visibleCrop(
  iw: number,
  ih: number,
  fw: number,
  fh: number,
  zoom: number,
  offset: { x: number; y: number },
): PixelCrop {
  const s = coverScale(iw, ih, fw, fh) * zoom
  const displayW = iw * s
  const displayH = ih * s
  const left = (fw - displayW) / 2 + offset.x
  const top = (fh - displayH) / 2 + offset.y

  let x = -left / s
  let y = -top / s
  let width = fw / s
  let height = fh / s

  x = Math.max(0, Math.min(x, iw - 1))
  y = Math.max(0, Math.min(y, ih - 1))
  width = Math.max(1, Math.min(width, iw - x))
  height = Math.max(1, Math.min(height, ih - y))

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function ImageAdjustDialog({
  open,
  file,
  title = 'Ajustar imagem',
  defaultAspect = 'free',
  onCancel,
  onConfirm,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [natural, setNatural] = useState({ w: 1, h: 1 })
  const [frameSize, setFrameSize] = useState({ w: 1, h: 1 })
  const [aspectId, setAspectId] = useState<ImageAdjustAspect>(defaultAspect)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aspectValue = useMemo(
    () => ASPECT_OPTIONS.find((item) => item.id === aspectId)?.value ?? null,
    [aspectId],
  )

  const frameAspect = aspectValue ?? natural.w / natural.h

  useEffect(() => {
    if (!open || !file) {
      setSrc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setSrc(url)
    setAspectId(defaultAspect)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setError(null)
    loadImage(url)
      .then((img) => setNatural({ w: img.naturalWidth, h: img.naturalHeight }))
      .catch(() => setError('Não foi possível carregar a imagem.'))
    return () => URL.revokeObjectURL(url)
  }, [open, file, defaultAspect])

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setFrameSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, frameAspect, src])

  const display = useMemo(() => {
    const s = coverScale(natural.w, natural.h, frameSize.w, frameSize.h) * zoom
    return {
      width: natural.w * s,
      height: natural.h * s,
      left: (frameSize.w - natural.w * s) / 2 + offset.x,
      top: (frameSize.h - natural.h * s) / 2 + offset.y,
    }
  }, [natural, frameSize, zoom, offset])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setOffset(
      clampOffset(
        { x: dragStart.current.ox + dx, y: dragStart.current.oy + dy },
        natural.w,
        natural.h,
        frameSize.w,
        frameSize.h,
        zoom,
      ),
    )
  }

  const onPointerUp = () => setDragging(false)

  const handleZoom = (value: number[]) => {
    const nextZoom = value[0] ?? 1
    setZoom(nextZoom)
    setOffset((prev) =>
      clampOffset(prev, natural.w, natural.h, frameSize.w, frameSize.h, nextZoom),
    )
  }

  const handleConfirm = async () => {
    if (!src || !file) return
    setBusy(true)
    setError(null)
    try {
      const crop = visibleCrop(natural.w, natural.h, frameSize.w, frameSize.h, zoom, offset)
      const mime =
        file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg'
      const cropped = await cropImageToFile(src, crop, file.name, mime)
      onConfirm(cropped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ajustar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Arraste para posicionar e use o zoom para enquadrar. O que ficar dentro do quadro será
            publicado.
          </p>

          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={aspectId === option.id ? 'default' : 'outline'}
                onClick={() => {
                  setAspectId(option.id)
                  setOffset({ x: 0, y: 0 })
                  setZoom(1)
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div
            ref={frameRef}
            className={cn(
              'relative mx-auto w-full max-w-xl touch-none overflow-hidden rounded-xl border border-primary/40 bg-black',
              dragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            style={{ aspectRatio: String(frameAspect) }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src ? (
              <img
                src={src}
                alt="Prévia para ajuste"
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width: display.width,
                  height: display.height,
                  left: display.left,
                  top: display.top,
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/50" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Zoom</Label>
              <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
            </div>
            <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={handleZoom} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy || !src}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Usar este enquadramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
