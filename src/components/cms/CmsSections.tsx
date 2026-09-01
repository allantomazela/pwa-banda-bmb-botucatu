import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getPageBySlug, getVisibleSections, type SiteSection } from '@/services/site-cms'
import { getGalleryPhotos, type GalleryPhoto } from '@/services/gallery'
import { toEmbedUrl } from '@/lib/cms'
import { Button } from '@/components/ui/button'

export function CmsSections({ slug }: { slug: string }) {
  const { data: page } = useFetch(() => getPageBySlug(slug), [slug])
  const { data: sections } = useFetch(
    () => (page ? getVisibleSections(page.id) : Promise.resolve([])),
    [page?.id],
  )

  if (!sections?.length) return null

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <CmsSectionBlock key={section.id} section={section} />
      ))}
    </div>
  )
}

function sectionShell(className: string) {
  return cn('mx-auto min-w-0 max-w-full px-4 sm:px-6', className)
}

function CmsSectionBlock({ section }: { section: SiteSection }) {
  if (section.section_type === 'text') {
    return (
      <section className={sectionShell('max-w-3xl')}>
        {section.title ? (
          <h2 className="text-fluid-section font-bold font-display mb-4 break-words">{section.title}</h2>
        ) : null}
        {section.body ? (
          <p className="break-words text-muted-foreground text-lg whitespace-pre-wrap leading-relaxed">
            {section.body}
          </p>
        ) : null}
      </section>
    )
  }

  if (section.section_type === 'image') {
    return (
      <section className={sectionShell('max-w-5xl')}>
        {section.title ? (
          <h2 className="text-fluid-section font-bold font-display mb-6 text-center break-words">{section.title}</h2>
        ) : null}
        {section.media_url ? (
          <img
            src={section.media_url}
            alt={section.title || 'Imagem da Banda BMB'}
            className="h-auto w-full max-w-full rounded-xl border border-white/10 object-cover max-h-[70vh]"
            loading="lazy"
          />
        ) : null}
        {section.body ? (
          <p className="text-muted-foreground text-center mt-4">{section.body}</p>
        ) : null}
      </section>
    )
  }

  if (section.section_type === 'video') {
    const embed = toEmbedUrl(section.media_url)
    return (
      <section className={sectionShell('max-w-4xl')}>
        {section.title ? (
          <h2 className="text-fluid-section font-bold font-display mb-6 text-center break-words">{section.title}</h2>
        ) : null}
        {embed ? (
          <div className="aspect-video w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            <iframe
              src={embed}
              title={section.title || 'Vídeo'}
              className="h-full w-full max-w-full"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : null}
        {section.body ? (
          <p className="text-muted-foreground text-center mt-4">{section.body}</p>
        ) : null}
      </section>
    )
  }

  if (section.section_type === 'gallery') {
    return <GallerySection title={section.title} />
  }

  if (section.section_type === 'cta') {
    return (
      <section className={sectionShell('max-w-3xl py-8 text-center rounded-xl bg-card/40 border border-white/5')}>
        {section.title ? (
          <h2 className="text-fluid-section font-bold font-display mb-4 break-words">{section.title}</h2>
        ) : null}
        {section.body ? <p className="break-words text-muted-foreground mb-6">{section.body}</p> : null}
        {section.link_url ? (
          <Button asChild>
            <Link to={section.link_url}>{section.link_label || 'Saiba mais'}</Link>
          </Button>
        ) : null}
      </section>
    )
  }

  return null
}

function GallerySection({ title }: { title: string }) {
  const { data: photos } = useFetch<GalleryPhoto[]>(getGalleryPhotos)

  if (!photos?.length) return null

  return (
    <section className={sectionShell('max-w-6xl')}>
      {title ? <h2 className="text-fluid-section font-bold font-display mb-6 text-center break-words">{title}</h2> : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
        {photos.slice(0, 9).map((photo) => (
          <img
            key={photo.id}
            src={photo.image_url}
            alt={photo.title}
            className="aspect-[4/3] w-full object-cover rounded-xl border border-white/5"
          />
        ))}
      </div>
    </section>
  )
}
