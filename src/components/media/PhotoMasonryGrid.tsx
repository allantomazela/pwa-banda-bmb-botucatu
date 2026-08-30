import { ImageIcon, Loader2 } from 'lucide-react'
import type { GalleryPhoto } from '@/services/gallery'
import { cn } from '@/lib/utils'

type Props = {
  loading: boolean
  error: string | null
  photos: GalleryPhoto[] | null
  emptyText: string
  onSelect: (photo: GalleryPhoto, index: number) => void
}

export function PhotoMasonryGrid({ loading, error, photos, emptyText, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-16 text-center text-muted-foreground">Não foi possível carregar as fotos.</p>
    )
  }

  if (!photos?.length) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="columns-2 gap-3 sm:columns-2 md:columns-3 md:gap-4 lg:columns-4">
      {photos.map((photo, index) => {
        const tall = index % 5 === 1 || index % 7 === 3
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onSelect(photo, index)}
            className={cn(
              'group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/8 bg-card text-left shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(251,192,45,0.12)] md:mb-4',
            )}
          >
            <div className={cn('relative overflow-hidden', tall ? 'aspect-[3/4]' : 'aspect-[4/3]')}>
              <img
                src={photo.image_url}
                alt={photo.title || 'Foto da galeria'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <span className="line-clamp-2 text-sm font-medium text-white">
                  {photo.title || 'Ampliar foto'}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
