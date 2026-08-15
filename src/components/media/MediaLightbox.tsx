import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toEmbedUrl } from '@/lib/video-embed'

interface MediaLightboxProps {
  open: boolean
  title: string
  imageUrl?: string | null
  videoUrl?: string | null
  onClose: () => void
}

export function MediaLightbox({ open, title, imageUrl, videoUrl, onClose }: MediaLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-1.25rem)] max-w-4xl overflow-hidden border-white/10 bg-card p-0 sm:w-full">
        <DialogHeader className="px-4 pb-2 pt-5 sm:px-6">
          <DialogTitle className="pr-8 text-left text-base sm:text-lg">{title}</DialogTitle>
        </DialogHeader>
        {open && videoUrl ? (
          <div className="relative aspect-video w-full bg-black">
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
          <img src={imageUrl} alt={title} className="max-h-[75dvh] w-full bg-black object-contain" />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
