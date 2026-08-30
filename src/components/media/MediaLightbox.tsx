import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      <DialogContent className="w-[calc(100%-1rem)] max-w-5xl overflow-hidden border-white/10 bg-card p-0 sm:w-full">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 px-4 pb-2 pt-5 sm:px-6">
          <div className="min-w-0 flex-1 pr-8">
            <DialogTitle className="truncate text-left text-base sm:text-lg">
              {title || 'Galeria'}
            </DialogTitle>
            {counter ? <p className="mt-1 text-xs text-muted-foreground">{counter}</p> : null}
          </div>
        </DialogHeader>

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
              className="mx-auto max-h-[78dvh] w-full object-contain"
            />
          ) : null}

          {hasNav && imageUrl ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-primary hover:text-primary-foreground sm:left-4"
                onClick={onPrev}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-primary hover:text-primary-foreground sm:right-4"
                onClick={onNext}
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white hover:bg-primary hover:text-primary-foreground sm:right-4 sm:top-4"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
