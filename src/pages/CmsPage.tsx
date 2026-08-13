import { useParams } from 'react-router-dom'
import { useFetch } from '@/hooks/use-fetch'
import { getPageBySlug } from '@/services/site-cms'
import { CmsSections } from '@/components/cms/CmsSections'
import NotFound from '@/pages/NotFound'
import { Loader2 } from 'lucide-react'

export default function CmsPage() {
  const { slug = '' } = useParams()
  const { data: page, loading } = useFetch(() => getPageBySlug(slug), [slug])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!page || page.is_system) return <NotFound />

  return (
    <div className="container py-12 lg:py-20 animate-fade-in space-y-10">
      <header className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-display">{page.title}</h1>
      </header>
      <CmsSections slug={page.slug} />
    </div>
  )
}
