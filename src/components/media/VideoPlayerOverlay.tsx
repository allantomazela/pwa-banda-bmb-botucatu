import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getYouTubeId, toEmbedUrl, toWatchUrl } from '@/lib/video-embed'

interface VideoPlayerOverlayProps {
  open: boolean
  title: string
  videoUrl: string
  onClose: () => void
  eyebrow?: string
}

/**
 * Player em overlay no `document.body`.
 * Evita Dialog com transform (quebra iframe no iOS) e usa caixa 16:9
 * com iframe em fluxo normal (mesma abordagem das seções CMS).
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

  // Sem autoplay: no mobile o YouTube bloqueia e o player fica preto
  const embedUrl = toEmbedUrl(videoUrl)
  const watchUrl = toWatchUrl(videoUrl)
  const hasYouTube = Boolean(getYouTubeId(videoUrl))

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ position: 'fixed', inset: 0, zIndex: 200 }}
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

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5">
        <div
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-black"
          style={{ aspectRatio: '16 / 9', minHeight: 200 }}
        >
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={title}
            className="h-full w-full max-w-full border-0"
            style={{ minHeight: 200 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60 sm:text-sm">
            Toque no play do YouTube para assistir.
            {hasYouTube ? ' Se o player não carregar, abra no YouTube.' : ''}
          </p>
          {watchUrl ? (
            <Button asChild variant="secondary" className="min-h-11 w-full shrink-0 sm:w-auto">
              <a href={watchUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir no YouTube
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
