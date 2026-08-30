import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  cropImageToFile,
  fitFrameSize,
  loadImage,
  type PixelCrop,
} from '@/lib/crop-image'

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
  return Math.max(fw / Math.max(iw, 1), fh / Math.max(ih, 1))
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

  // Mantém o aspecto do quadro sem “encolher” o recorte nos cantos
  if (x < 0) {
    width += x
    x = 0
  }
  if (y < 0) {
    height += y
    y = 0
  }
  if (x + width > iw) width = iw - x
  if (y + height > ih) height = ih - y

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.max(1, width),
    height: Math.max(1, height),
  }
}

function readViewportBudget() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  // Espaço para título, botões de aspecto, zoom e rodapé do dialog
  const maxWidth = Math.min(720, Math.max(260, vw - 48))
  const maxHeight = Math.min(520, Math.max(200, vh * 0.48))
  return { maxWidth, maxHeight }
}

export function ImageAdjustDialog({
  open,
  file,
  title = 'Ajustar imagem',
  defaultAspect = 'free',
  onCancel,
  onConfirm,
}: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [natural, setNatural] = useState({ w: 1, h: 1 })
  const [budget, setBudget] = useState(readViewportBudget)
  const [aspectId, setAspectId] = useState<ImageAdjustAspect>(defaultAspect)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const aspectValue = useMemo(
    () => ASPECT_OPTIONS.find((item) => item.id === aspectId)?.value ?? null,
    [aspectId],
  )

  const frameAspect = aspectValue ?? natural.w / Math.max(natural.h, 1)

  const frame = useMemo(
    () => fitFrameSize(frameAspect, budget.maxWidth, budget.maxHeight),
    [frameAspect, budget],
  )

  useEffect(() => {
    if (!open) return
    const onResize = () => setBudget(readViewportBudget())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

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
    setBudget(readViewportBudget())
    loadImage(url)
      .then((img) => setNatural({ w: img.naturalWidth, h: img.naturalHeight }))
      .catch(() => setError('Não foi possível carregar a imagem.'))
    return () => URL.revokeObjectURL(url)
  }, [open, file, defaultAspect])

  useEffect(() => {
    setOffset((prev) =>
      clampOffset(prev, natural.w, natural.h, frame.width, frame.height, zoom),
    )
  }, [frame.width, frame.height, natural.w, natural.h, zoom])

  const display = useMemo(() => {
    const s = coverScale(natural.w, natural.h, frame.width, frame.height) * zoom
    return {
      width: natural.w * s,
      height: natural.h * s,
      left: (frame.width - natural.w * s) / 2 + offset.x,
      top: (frame.height - natural.h * s) / 2 + offset.y,
    }
  }, [natural, frame, zoom, offset])

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
        frame.width,
        frame.height,
        zoom,
      ),
    )
  }

  const onPointerUp = () => setDragging(false)

  const handleZoom = (value: number[]) => {
    const nextZoom = value[0] ?? 1
    setZoom(nextZoom)
    setOffset((prev) =>
      clampOffset(prev, natural.w, natural.h, frame.width, frame.height, nextZoom),
    )
  }

  const handleConfirm = async () => {
    if (!src || !file) return
    setBusy(true)
    setError(null)
    try {
      // Mede o quadro real no DOM (evita divergência com o CSS)
      const el = frameRef.current
      const fw = el?.clientWidth || frame.width
      const fh = el?.clientHeight || frame.height
      const crop = visibleCrop(natural.w, natural.h, fw, fh, zoom, offset)
      const cropped = await cropImageToFile(src, crop, file)
      onConfirm(cropped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ajustar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  const handleUseOriginal = () => {
    if (!file) return
    onConfirm(file)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent className="flex max-h-[96dvh] w-[calc(100%-1rem)] max-w-3xl flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arraste para posicionar e use o zoom. O que estiver dentro do quadro será publicado —
            sem nova redução de qualidade.
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
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

          <div className="flex justify-center">
            <div
              ref={frameRef}
              className={cn(
                'relative touch-none overflow-hidden rounded-xl border border-primary/40 bg-zinc-950',
                dragging ? 'cursor-grabbing' : 'cursor-grab',
              )}
              style={{
                width: frame.width,
                height: frame.height,
                maxWidth: '100%',
              }}
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
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/60" />
            </div>
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between">
              <Label>Zoom</Label>
              <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
            </div>
            <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={handleZoom} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleUseOriginal} disabled={busy || !file}>
            Usar original sem recorte
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={busy || !src}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Usar este enquadramento
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
