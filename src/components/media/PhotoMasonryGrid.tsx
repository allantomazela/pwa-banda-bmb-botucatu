import { ImageIcon } from 'lucide-react'
import type { GalleryPhoto } from '@/services/gallery'
import { cn } from '@/lib/utils'

type Props = {
  loading: boolean
  error: string | null
  photos: GalleryPhoto[] | null
  emptyText: string
  onSelect: (photo: GalleryPhoto, index: number) => void
}

function aspectFor(index: number): string {
  const pattern = index % 7
  if (pattern === 0 || pattern === 4) return 'aspect-[3/4]'
  if (pattern === 2) return 'aspect-square'
  if (pattern === 5) return 'aspect-[4/5]'
  return 'aspect-[4/3]'
}

export function PhotoMasonryGrid({ loading, error, photos, emptyText, onSelect }: Props) {
  if (loading) {
    return (
      <div className="columns-1 gap-3 sm:columns-2 md:columns-3 md:gap-4 lg:columns-4" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'mb-3 break-inside-avoid animate-shimmer rounded-2xl border border-white/10 md:mb-4',
              aspectFor(i),
            )}
          />
        ))}
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
      <div className="rounded-3xl border border-dashed border-primary/25 bg-card/30 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <ImageIcon className="h-6 w-6 text-primary/70" />
        </div>
        <p className="font-display text-lg font-semibold text-white">{emptyText}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Novas memórias da BMB aparecerão neste mosaico.
        </p>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-3 sm:columns-2 md:columns-3 md:gap-4 lg:columns-4">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo, index)}
          className="media-mosaic-tile group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary md:mb-4"
        >
          <div className={cn('relative overflow-hidden', aspectFor(index))}>
            <img
              src={photo.image_url}
              alt={photo.title || 'Foto da galeria'}
              className="h-full w-full object-cover transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 space-y-1 p-3.5 sm:p-4">
              <p className="font-crest text-[9px] font-semibold uppercase tracking-[0.24em] text-primary/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Ampliar
              </p>
              <span className="line-clamp-2 font-display text-sm font-semibold text-white sm:text-base">
                {photo.title || 'Momento da Banda Marcial'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
