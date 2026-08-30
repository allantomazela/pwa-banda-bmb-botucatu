import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SignaturePadHandle = {
  clear: () => void
  toDataUrl: () => string | null
  hasStroke: () => boolean
}

type Props = {
  className?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokeRef = useRef(false)
  const [, setTick] = useState(0)

  const paintBlank = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ratio = window.devicePixelRatio || 1
    const width = parent.clientWidth
    const height = Math.max(180, Math.round(width * 0.4))
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.2
    ctx.strokeStyle = '#f8fafc'
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, width, height)
  }

  const clear = () => {
    paintBlank()
    hasStrokeRef.current = false
    setTick((n) => n + 1)
  }

  useImperativeHandle(ref, () => ({
    clear,
    toDataUrl: () => {
      const canvas = canvasRef.current
      if (!canvas || !hasStrokeRef.current) return null
      return canvas.toDataURL('image/png')
    },
    hasStroke: () => hasStrokeRef.current,
  }))

  useEffect(() => {
    paintBlank()
    const onResize = () => clear()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-zinc-950">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          onPointerDown={(e) => {
            const canvas = canvasRef.current
            const ctx = canvas?.getContext('2d')
            if (!canvas || !ctx) return
            canvas.setPointerCapture(e.pointerId)
            drawing.current = true
            const { x, y } = point(e)
            ctx.beginPath()
            ctx.moveTo(x, y)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return
            const { x, y } = point(e)
            ctx.lineTo(x, y)
            ctx.stroke()
            if (!hasStrokeRef.current) {
              hasStrokeRef.current = true
              setTick((n) => n + 1)
            }
          }}
          onPointerUp={() => {
            drawing.current = false
          }}
          onPointerCancel={() => {
            drawing.current = false
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Assine com o dedo ou mouse. Depois poderemos trocar por Gov.br.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={clear}>
          <Eraser className="mr-2 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>
    </div>
  )
})
