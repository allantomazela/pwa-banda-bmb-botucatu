import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toEmbedUrl } from '@/lib/video-embed'

interface VideoPlayerOverlayProps {
  open: boolean
  title: string
  videoUrl: string
  onClose: () => void
  eyebrow?: string
}

/**
 * Player em overlay no `document.body`, sem `transform` no ancestral do iframe
 * (no iOS Safari o translate do Dialog Radix impede o YouTube de renderizar).
 */
export function VideoPlayerOverlay({
  open,
  title,
  videoUrl,
  onClose,
  eyebrow = 'Videoaula BMB',
}: VideoPlayerOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open || !videoUrl) return null

  const embedUrl = toEmbedUrl(videoUrl, { autoplay: true })

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ position: 'fixed', inset: 0 }}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))]">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-crest text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </p>
          <h2 className="truncate font-display text-base font-bold text-white sm:text-lg">{title}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5 text-white hover:bg-primary hover:text-primary-foreground"
          aria-label="Fechar vídeo"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-4">
        <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
