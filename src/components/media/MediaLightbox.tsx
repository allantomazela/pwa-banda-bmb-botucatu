import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toEmbedUrl } from '@/lib/video-embed'

interface MediaLightboxProps {
  open: boolean
  title: string
  imageUrl?: string | null
  videoUrl?: string | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  counter?: string
}

export function MediaLightbox({
  open,
  title,
  imageUrl,
  videoUrl,
  onClose,
  onPrev,
  onNext,
  counter,
}: MediaLightboxProps) {
  const hasNav = Boolean(onPrev || onNext)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-0.75rem)] max-w-5xl overflow-hidden border-primary/20 bg-zinc-950 p-0 shadow-[0_0_80px_rgba(251,192,45,0.12)] sm:w-full">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 pr-2">
            <p className="mb-1 font-crest text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Galeria BMB
              {counter ? <span className="text-white/30"> · {counter}</span> : null}
            </p>
            <DialogTitle className="truncate text-left font-display text-base font-bold text-white sm:text-lg">
              {title || 'Mídia'}
            </DialogTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/5 text-white hover:bg-primary hover:text-primary-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative bg-black">
          {open && videoUrl ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={toEmbedUrl(videoUrl, { autoplay: true })}
                title={title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Foto'}
              className="mx-auto max-h-[min(78dvh,820px)] w-full object-contain"
            />
          ) : null}

          {hasNav && imageUrl ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-primary/25 bg-black/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground sm:left-4"
                onClick={onPrev}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-primary/25 bg-black/60 text-white backdrop-blur-md hover:border-primary hover:bg-primary hover:text-primary-foreground sm:right-4"
                onClick={onNext}
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
